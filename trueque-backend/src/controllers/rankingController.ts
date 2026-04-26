import { Request, Response } from 'express';
import { dbRun, dbGet, dbAll } from '../db';
import { RankingResult } from '../types';

const PRACTICE_MATCHERS = ['agroecologico', 'silvopast', 'practicas ancestrales'];

function normalizeString(value: unknown) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function normalizeToken(value: unknown) {
  return normalizeString(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function normalizeStringArray(value: unknown) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeString(item)).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function hasPracticeScore(productiveSystems: unknown) {
  return normalizeStringArray(productiveSystems).some((item) => {
    const token = normalizeToken(item);
    return PRACTICE_MATCHERS.some((matcher) => token.includes(matcher));
  });
}

function hasLeadershipScore(leadership: unknown) {
  return normalizeStringArray(leadership).length > 0;
}

function compareByTieBreaker(a: RankingResult, b: RankingResult, tieBreaker: string) {
  const criteria = {
    diversity: ['diversity', 'volume', 'practices', 'leadership'],
    volume: ['volume', 'diversity', 'practices', 'leadership'],
    practices: ['practices', 'diversity', 'volume', 'leadership'],
    leadership: ['leadership', 'diversity', 'volume', 'practices'],
  } as const;

  const order = criteria[tieBreaker as keyof typeof criteria] || criteria.diversity;

  for (const key of order) {
    const difference = (b[key] || 0) - (a[key] || 0);

    if (difference !== 0) {
      return difference;
    }
  }

  return a.name.localeCompare(b.name);
}

export async function getRanking(req: Request, res: Response) {
  try {
    const { eventYear } = req.query;

    if (!eventYear) {
      return res.status(400).json({ error: 'eventYear is required' });
    }

    const rule = await dbGet(
      `SELECT
        id,
        event_year as eventYear,
        diversity_weight as diversityWeight,
        volume_weight as volumeWeight,
        practice_weight as practiceWeight,
        leadership_weight as leadershipWeight,
        tie_breaker as tieBreaker
       FROM event_rules
       WHERE event_year = ?`,
      [Number(eventYear)]
    );

    const rankingRows = await dbAll(
      `SELECT
        p.id as participantId,
        p.cedula,
        p.name,
        p.productive_systems as productiveSystems,
        p.leadership,
        COUNT(DISTINCT LOWER(TRIM(pr.variety))) as diversity,
        COALESCE(SUM(pr.quantity), 0) as volume
       FROM participants p
       JOIN product_records pr ON pr.participant_id = p.id
       WHERE pr.event_year = ?
       GROUP BY p.id, p.cedula, p.name, p.productive_systems, p.leadership`,
      [Number(eventYear)]
    );

    const diversityWeight = Number(rule?.diversityWeight ?? 1);
    const volumeWeight = Number(rule?.volumeWeight ?? 1);
    const practiceWeight = Number(rule?.practiceWeight ?? 0);
    const leadershipWeight = Number(rule?.leadershipWeight ?? 0);
    const tieBreaker = rule?.tieBreaker ?? 'diversity';

    const ranking = rankingRows.map((row) => {
      const practices = hasPracticeScore(row.productiveSystems) ? 1 : 0;
      const leadership = hasLeadershipScore(row.leadership) ? 1 : 0;

      return {
        participantId: Number(row.participantId),
        cedula: row.cedula,
        name: row.name,
        diversity: Number(row.diversity || 0),
        volume: Number(row.volume || 0),
        practices,
        leadership,
        score:
          Number(row.diversity || 0) * diversityWeight +
          Number(row.volume || 0) * volumeWeight +
          practices * practiceWeight +
          leadership * leadershipWeight,
      } as RankingResult;
    });

    ranking.sort((a, b) => {
      if ((b.score || 0) !== (a.score || 0)) {
        return (b.score || 0) - (a.score || 0);
      }

      return compareByTieBreaker(a, b, tieBreaker);
    });

    res.json({ rule, ranking });
  } catch (error) {
    console.error('Error getting ranking:', error);
    res.status(500).json({ error: 'Failed to get ranking' });
  }
}

export async function getHistorical(req: Request, res: Response) {
  try {
    const { cedula } = req.query;

    if (!cedula) {
      return res.status(400).json({ error: 'cedula is required' });
    }

    const historyRows = await dbAll(
      `SELECT
        pr.event_year as eventYear,
        p.name,
        p.productive_systems as productiveSystems,
        p.leadership,
        COUNT(DISTINCT LOWER(TRIM(pr.variety))) as diversity,
        COALESCE(SUM(pr.quantity), 0) as volume
       FROM participants p
       JOIN product_records pr ON pr.participant_id = p.id
       WHERE p.cedula = ?
       GROUP BY pr.event_year, p.name, p.productive_systems, p.leadership
       ORDER BY pr.event_year DESC`,
      [cedula]
    );

    const history = historyRows.map((row) => ({
      eventYear: Number(row.eventYear),
      name: row.name,
      diversity: Number(row.diversity || 0),
      volume: Number(row.volume || 0),
      practices: hasPracticeScore(row.productiveSystems) ? 1 : 0,
      leadership: hasLeadershipScore(row.leadership) ? 1 : 0,
    }));

    res.json(history);
  } catch (error) {
    console.error('Error getting historical:', error);
    res.status(500).json({ error: 'Failed to get historical data' });
  }
}

export async function saveEventRule(req: Request, res: Response) {
  try {
    const {
      eventYear,
      diversityWeight,
      volumeWeight,
      practiceWeight,
      leadershipWeight,
      tieBreaker,
    } = req.body;

    if (!eventYear) {
      return res.status(400).json({ error: 'eventYear is required' });
    }

    const existing = await dbGet('SELECT id FROM event_rules WHERE event_year = ?', [eventYear]);

    if (existing) {
      await dbRun(
        `UPDATE event_rules
         SET diversity_weight = ?, volume_weight = ?, practice_weight = ?, leadership_weight = ?,
             tie_breaker = ?, updated_at = ?
         WHERE event_year = ?`,
        [
          diversityWeight ?? 1,
          volumeWeight ?? 1,
          practiceWeight ?? 0,
          leadershipWeight ?? 0,
          tieBreaker ?? 'diversity',
          new Date().toISOString(),
          eventYear,
        ]
      );
    } else {
      await dbRun(
        `INSERT INTO event_rules
          (event_year, diversity_weight, volume_weight, practice_weight, leadership_weight, tie_breaker)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          eventYear,
          diversityWeight ?? 1,
          volumeWeight ?? 1,
          practiceWeight ?? 0,
          leadershipWeight ?? 0,
          tieBreaker ?? 'diversity',
        ]
      );
    }

    res.json({ message: 'Event rule saved' });
  } catch (error) {
    console.error('Error saving event rule:', error);
    res.status(500).json({ error: 'Failed to save event rule' });
  }
}

export async function getEventRule(req: Request, res: Response) {
  try {
    const { eventYear } = req.query;

    if (!eventYear) {
      return res.status(400).json({ error: 'eventYear is required' });
    }

    const rule = await dbGet(
      `SELECT
        id,
        event_year as eventYear,
        diversity_weight as diversityWeight,
        volume_weight as volumeWeight,
        practice_weight as practiceWeight,
        leadership_weight as leadershipWeight,
        tie_breaker as tieBreaker,
        updated_at as updatedAt
       FROM event_rules
       WHERE event_year = ?`,
      [Number(eventYear)]
    );

    res.json(rule || null);
  } catch (error) {
    console.error('Error getting event rule:', error);
    res.status(500).json({ error: 'Failed to get event rule' });
  }
}
