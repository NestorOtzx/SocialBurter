import { Request, Response } from 'express';
import { dbRun, dbGet, dbAll } from '../db';
import { EventRule, RankingResult } from '../types';

export async function getRanking(req: Request, res: Response) {
  try {
    const { eventYear } = req.query;

    if (!eventYear) {
      return res.status(400).json({ error: 'eventYear is required' });
    }

    const rule = await dbGet(
      `SELECT
        id, event_year as eventYear, diversity_weight as diversityWeight,
        volume_weight as volumeWeight, tie_breaker as tieBreaker
       FROM event_rules
       WHERE event_year = ?`,
      [Number(eventYear)]
    );

    const ranking = (await dbAll(
      `SELECT
        p.id as participantId, p.cedula, p.name,
        COUNT(DISTINCT LOWER(TRIM(pr.variety))) as diversity,
        COALESCE(SUM(pr.quantity), 0) as volume
       FROM participants p
       JOIN product_records pr ON pr.participant_id = p.id
       WHERE pr.event_year = ?
       GROUP BY p.id, p.cedula, p.name`,
      [Number(eventYear)]
    )) as RankingResult[];

    const diversityWeight = rule?.diversityWeight ?? 1;
    const volumeWeight = rule?.volumeWeight ?? 1;
    const tieBreaker = rule?.tieBreaker ?? 'diversity';

    const scored = ranking.map((r) => ({
      ...r,
      score: r.diversity * diversityWeight + r.volume * volumeWeight,
    }));

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (tieBreaker === 'diversity') {
        if (b.diversity !== a.diversity) return b.diversity - a.diversity;
        return b.volume - a.volume;
      }
      if (b.volume !== a.volume) return b.volume - a.volume;
      return b.diversity - a.diversity;
    });

    res.json({ rule, ranking: scored });
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

    const history = await dbAll(
      `SELECT
        pr.event_year as eventYear, p.name,
        COUNT(DISTINCT LOWER(TRIM(pr.variety))) as diversity,
        COALESCE(SUM(pr.quantity), 0) as volume
       FROM participants p
       JOIN product_records pr ON pr.participant_id = p.id
       WHERE p.cedula = ?
       GROUP BY pr.event_year, p.name
       ORDER BY pr.event_year DESC`,
      [cedula]
    );

    res.json(history);
  } catch (error) {
    console.error('Error getting historical:', error);
    res.status(500).json({ error: 'Failed to get historical data' });
  }
}

export async function saveEventRule(req: Request, res: Response) {
  try {
    const { eventYear, diversityWeight, volumeWeight, tieBreaker } = req.body;

    if (!eventYear) {
      return res.status(400).json({ error: 'eventYear is required' });
    }

    const existing = await dbGet('SELECT id FROM event_rules WHERE event_year = ?', [eventYear]);

    if (existing) {
      await dbRun(
        `UPDATE event_rules
         SET diversity_weight = ?, volume_weight = ?, tie_breaker = ?, updated_at = ?
         WHERE event_year = ?`,
        [
          diversityWeight ?? 1,
          volumeWeight ?? 1,
          tieBreaker ?? 'diversity',
          new Date().toISOString(),
          eventYear,
        ]
      );
    } else {
      await dbRun(
        `INSERT INTO event_rules (event_year, diversity_weight, volume_weight, tie_breaker)
         VALUES (?, ?, ?, ?)`,
        [eventYear, diversityWeight ?? 1, volumeWeight ?? 1, tieBreaker ?? 'diversity']
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
        id, event_year as eventYear, diversity_weight as diversityWeight,
        volume_weight as volumeWeight, tie_breaker as tieBreaker, updated_at as updatedAt
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
