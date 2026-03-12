import { Request, Response } from 'express';
import { dbRun, dbGet, dbAll } from '../db';
import { Participant, Contribution } from '../types';

// GET /participants/by-cedula?cedula=xxx
export async function findByCedula(req: Request, res: Response) {
  try {
    const { cedula } = req.query;
    if (!cedula) {
      return res.status(400).json({ error: 'cedula is required' });
    }
    const participant = await dbGet(
      `SELECT id, cedula, name, municipality, village,
              created_by as createdBy, created_at as createdAt, updated_at as updatedAt
       FROM participants WHERE cedula = ?`,
      [String(cedula)]
    );
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    res.json(participant);
  } catch (error) {
    console.error('Error finding participant by cedula:', error);
    res.status(500).json({ error: 'Failed to find participant' });
  }
}

// POST /participants â€” upsert participant profile (no products)
export async function upsertParticipant(req: Request, res: Response) {
  try {
    const { participant } = req.body as { participant: Participant };
    if (!participant?.cedula || !participant.name || !participant.municipality || !participant.village) {
      return res.status(400).json({ error: 'cedula, name, municipality, and village are required' });
    }

    const existing = await dbGet('SELECT id FROM participants WHERE cedula = ?', [participant.cedula]);
    let participantId: number;

    if (existing) {
      await dbRun(
        `UPDATE participants SET name = ?, municipality = ?, village = ?, updated_at = ? WHERE id = ?`,
        [participant.name, participant.municipality, participant.village, new Date().toISOString(), existing.id]
      );
      participantId = existing.id;
    } else {
      const result = await dbRun(
        `INSERT INTO participants (cedula, name, municipality, village, created_by) VALUES (?, ?, ?, ?, ?)`,
        [
          participant.cedula,
          participant.name,
          participant.municipality,
          participant.village,
          participant.createdBy || req.user?.username || 'system',
        ]
      );
      participantId = result.lastID;
    }

    const saved = await dbGet(
      `SELECT id, cedula, name, municipality, village,
              created_by as createdBy, created_at as createdAt, updated_at as updatedAt
       FROM participants WHERE id = ?`,
      [participantId]
    );
    res.status(existing ? 200 : 201).json(saved);
  } catch (error) {
    console.error('Error upserting participant:', error);
    res.status(500).json({ error: 'Failed to save participant' });
  }
}

// POST /participants/:id/contributions
export async function addContributions(req: Request, res: Response) {
  try {
    const participantId = Number(req.params.id);
    const { contributions, eventYear } = req.body as {
      contributions: Contribution[];
      eventYear: number;
    };

    if (!participantId || !eventYear || !contributions?.length) {
      return res.status(400).json({ error: 'participantId, eventYear, and contributions are required' });
    }

    const participant = await dbGet('SELECT id FROM participants WHERE id = ?', [participantId]);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    for (const c of contributions) {
      await dbRun(
        `INSERT INTO product_records
          (participant_id, event_year, category, species_common_name, species_scientific_name,
           variety, quantity, unit, stage, photo_uri)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          participantId,
          eventYear,
          c.category,
          c.speciesCommonName || '',
          c.speciesScientificName || '',
          c.variety || '',
          c.quantity,
          c.unit || 'kg',
          c.stage || 'llega',
          c.photoUri || null,
        ]
      );
    }

    res.status(201).json({ message: 'Contributions added successfully', count: contributions.length });
  } catch (error) {
    console.error('Error adding contributions:', error);
    res.status(500).json({ error: 'Failed to add contributions' });
  }
}

// GET /participants/:id/contributions?eventYear=xxx
export async function getContributions(req: Request, res: Response) {
  try {
    const participantId = Number(req.params.id);
    const { eventYear } = req.query;

    const whereClause = eventYear ? 'AND pr.event_year = ?' : '';
    const params: any[] = eventYear ? [participantId, Number(eventYear)] : [participantId];

    const contributions = await dbAll(
      `SELECT pr.id, pr.participant_id as participantId, pr.event_year as eventYear,
              pr.category, pr.species_common_name as speciesCommonName,
              pr.species_scientific_name as speciesScientificName,
              pr.variety, pr.quantity, pr.unit, pr.stage, pr.photo_uri as photoUri,
              pr.registered_at as registeredAt
       FROM product_records pr
       WHERE pr.participant_id = ? ${whereClause}
       ORDER BY pr.registered_at DESC`,
      params
    );
    res.json(contributions);
  } catch (error) {
    console.error('Error getting contributions:', error);
    res.status(500).json({ error: 'Failed to get contributions' });
  }
}

// GET /participants?eventYear=xxx â€” list participants who have contributions in that year
export async function listParticipants(req: Request, res: Response) {
  try {
    const { eventYear } = req.query;
    if (!eventYear) {
      return res.status(400).json({ error: 'eventYear is required' });
    }
    const participants = await dbAll(
      `SELECT DISTINCT p.id, p.cedula, p.name, p.municipality, p.village,
              p.created_by as createdBy, p.created_at as createdAt, p.updated_at as updatedAt
       FROM participants p
       JOIN product_records pr ON pr.participant_id = p.id
       WHERE pr.event_year = ?
       ORDER BY p.name`,
      [Number(eventYear)]
    );
    res.json(participants);
  } catch (error) {
    console.error('Error listing participants:', error);
    res.status(500).json({ error: 'Failed to list participants' });
  }
}

// GET /participants/contributions?eventYear=xxx â€” list all contributions for a year (for history screen)
export async function listContributions(req: Request, res: Response) {
  try {
    const { eventYear } = req.query;
    if (!eventYear) {
      return res.status(400).json({ error: 'eventYear is required' });
    }
    const contributions = await dbAll(
      `SELECT pr.id, pr.participant_id as participantId, pr.event_year as eventYear,
              pr.category, pr.species_common_name as speciesCommonName,
              pr.species_scientific_name as speciesScientificName,
              pr.variety, pr.quantity, pr.unit, pr.stage, pr.photo_uri as photoUri,
              pr.registered_at as registeredAt,
              p.name as participantName, p.cedula as participantCedula,
              p.municipality, p.village
       FROM product_records pr
       JOIN participants p ON p.id = pr.participant_id
       WHERE pr.event_year = ?
       ORDER BY pr.registered_at DESC`,
      [Number(eventYear)]
    );
    res.json(contributions);
  } catch (error) {
    console.error('Error listing contributions:', error);
    res.status(500).json({ error: 'Failed to list contributions' });
  }
}
