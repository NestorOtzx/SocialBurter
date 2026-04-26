import { Request, Response } from 'express';
import { dbRun, dbGet, dbAll } from '../db';
import { Participant, Contribution } from '../types';

function normalizeString(value: unknown) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function normalizeNumber(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeStringArray(value: unknown): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean).map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function serializeStringArray(value: unknown) {
  return normalizeStringArray(value).join(',');
}

const participantSelectSQL = `
  SELECT
    id,
    cedula,
    name,
    municipality,
    village,
    phone,
    annual_trades as annualTrades,
    farm_name as farmName,
    latitude,
    longitude,
    altitude,
    corregimiento,
    soil_type as soilType,
    climate_conditions as climateConditions,
    productive_systems as productiveSystems,
    leadership,
    created_by as createdBy,
    created_at as createdAt,
    updated_at as updatedAt
  FROM participants
`;

export async function findByCedula(req: Request, res: Response) {
  try {
    const { cedula } = req.query;

    if (!cedula) {
      return res.status(400).json({ error: 'cedula is required' });
    }

    const participant = await dbGet(
      `${participantSelectSQL}
       WHERE cedula = ?`,
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

export async function upsertParticipant(req: Request, res: Response) {
  try {
    const { participant, basicOnly, tipoRegistro } = req.body as {
      participant: Participant;
      basicOnly?: boolean;
      tipoRegistro?: string;
    };

    if (!participant?.cedula) {
      return res.status(400).json({ error: 'cedula is required' });
    }

    const existing = await dbGet(
      `SELECT *
       FROM participants
       WHERE cedula = ?`,
      [participant.cedula]
    );

    const nextName = normalizeString(participant.name) || normalizeString(existing?.name);
    const nextMunicipality = normalizeString(participant.municipality) || normalizeString(existing?.municipality);
    const nextVillage = normalizeString(participant.village) || normalizeString(existing?.village);
    const allowPartialPredio = tipoRegistro === 'pre';

    if (!nextName || (!allowPartialPredio && (!nextMunicipality || !nextVillage))) {
      return res.status(400).json({
        error: allowPartialPredio
          ? 'cedula and name are required'
          : 'cedula, name, municipality, and village are required',
      });
    }

    const payload = {
      cedula: participant.cedula,
      name: nextName,
      municipality: nextMunicipality,
      village: nextVillage,
      phone: normalizeString(participant.phone) || normalizeString(existing?.phone),
      annualTrades:
        normalizeNumber(participant.annualTrades) ??
        normalizeNumber(existing?.annual_trades) ??
        normalizeNumber(existing?.annualTrades) ??
        0,
      farmName: normalizeString(participant.farmName) || normalizeString(existing?.farm_name) || normalizeString(existing?.farmName),
      latitude: normalizeNumber(participant.latitude) ?? normalizeNumber(existing?.latitude),
      longitude: normalizeNumber(participant.longitude) ?? normalizeNumber(existing?.longitude),
      altitude: normalizeNumber(participant.altitude) ?? normalizeNumber(existing?.altitude),
      corregimiento: normalizeString(participant.corregimiento) || normalizeString(existing?.corregimiento),
      soilType: normalizeString(participant.soilType) || normalizeString(existing?.soil_type) || normalizeString(existing?.soilType),
      climateConditions:
        normalizeString(participant.climateConditions) ||
        normalizeString(existing?.climate_conditions) ||
        normalizeString(existing?.climateConditions),
      productiveSystems:
        serializeStringArray(participant.productiveSystems).length
          ? serializeStringArray(participant.productiveSystems)
          : normalizeString(existing?.productive_systems) || normalizeString(existing?.productiveSystems),
      leadership:
        serializeStringArray(participant.leadership).length
          ? serializeStringArray(participant.leadership)
          : normalizeString(existing?.leadership),
      createdBy: normalizeString(participant.createdBy) || req.user?.username || 'system',
    };

    let participantId: number;

    if (existing) {
      await dbRun(
        `UPDATE participants
         SET name = ?, municipality = ?, village = ?, phone = ?, annual_trades = ?, farm_name = ?,
             latitude = ?, longitude = ?, altitude = ?, corregimiento = ?, soil_type = ?,
             climate_conditions = ?, productive_systems = ?, leadership = ?, updated_at = ?
         WHERE id = ?`,
        [
          payload.name,
          payload.municipality,
          payload.village,
          payload.phone,
          payload.annualTrades,
          payload.farmName,
          payload.latitude,
          payload.longitude,
          payload.altitude,
          payload.corregimiento,
          payload.soilType,
          payload.climateConditions,
          payload.productiveSystems,
          payload.leadership,
          new Date().toISOString(),
          existing.id,
        ]
      );
      participantId = existing.id;
    } else {
      if (basicOnly) {
        return res.status(400).json({ error: 'Participant must exist before using basicOnly save' });
      }

      const result = await dbRun(
        `INSERT INTO participants
          (cedula, name, municipality, village, phone, annual_trades, farm_name, latitude,
           longitude, altitude, corregimiento, soil_type, climate_conditions,
           productive_systems, leadership, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          payload.cedula,
          payload.name,
          payload.municipality,
          payload.village,
          payload.phone,
          payload.annualTrades,
          payload.farmName,
          payload.latitude,
          payload.longitude,
          payload.altitude,
          payload.corregimiento,
          payload.soilType,
          payload.climateConditions,
          payload.productiveSystems,
          payload.leadership,
          payload.createdBy,
        ]
      );
      participantId = result.lastID;
    }

    const saved = await dbGet(
      `${participantSelectSQL}
       WHERE id = ?`,
      [participantId]
    );

    res.status(existing ? 200 : 201).json(saved);
  } catch (error) {
    console.error('Error upserting participant:', error);
    res.status(500).json({ error: 'Failed to save participant' });
  }
}

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

export async function listParticipants(req: Request, res: Response) {
  try {
    const { eventYear } = req.query;

    if (!eventYear) {
      return res.status(400).json({ error: 'eventYear is required' });
    }

    const participants = await dbAll(
      `SELECT DISTINCT
          p.id,
          p.cedula,
          p.name,
          p.municipality,
          p.village,
          p.phone,
          p.annual_trades as annualTrades,
          p.farm_name as farmName,
          p.latitude,
          p.longitude,
          p.altitude,
          p.corregimiento,
          p.soil_type as soilType,
          p.climate_conditions as climateConditions,
          p.productive_systems as productiveSystems,
          p.leadership,
          p.created_by as createdBy,
          p.created_at as createdAt,
          p.updated_at as updatedAt
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
