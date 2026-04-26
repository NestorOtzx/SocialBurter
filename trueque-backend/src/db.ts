import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'trueque_municipal.db');

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database at', dbPath);
  }
});

export const dbRun = (sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export const dbGet = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const dbAll = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

const createTablesSQL = `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cedula TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    municipality TEXT NOT NULL,
    village TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    annual_trades INTEGER NOT NULL DEFAULT 0,
    farm_name TEXT NOT NULL DEFAULT '',
    latitude REAL,
    longitude REAL,
    altitude REAL,
    corregimiento TEXT NOT NULL DEFAULT '',
    soil_type TEXT NOT NULL DEFAULT '',
    climate_conditions TEXT NOT NULL DEFAULT '',
    productive_systems TEXT NOT NULL DEFAULT '',
    leadership TEXT NOT NULL DEFAULT '',
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS product_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant_id INTEGER NOT NULL,
    event_year INTEGER NOT NULL,
    category TEXT NOT NULL,
    species_common_name TEXT NOT NULL,
    species_scientific_name TEXT NOT NULL,
    variety TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    stage TEXT NOT NULL,
    photo_uri TEXT,
    registered_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(participant_id) REFERENCES participants(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS event_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_year INTEGER NOT NULL UNIQUE,
    diversity_weight REAL NOT NULL,
    volume_weight REAL NOT NULL,
    practice_weight REAL NOT NULL DEFAULT 0,
    leadership_weight REAL NOT NULL DEFAULT 0,
    tie_breaker TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS species_catalog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    common_name TEXT NOT NULL UNIQUE,
    scientific_name TEXT NOT NULL
  );

  INSERT OR IGNORE INTO species_catalog (common_name, scientific_name) VALUES
    ('Maiz', 'Zea mays'),
    ('Frijol', 'Phaseolus vulgaris'),
    ('Papa', 'Solanum tuberosum'),
    ('Yuca', 'Manihot esculenta'),
    ('Platano', 'Musa paradisiaca');
`;

export async function initDatabase() {
  return new Promise<void>((resolve, reject) => {
    db.exec(createTablesSQL, (err) => {
      if (err) {
        console.error('Error initializing database:', err);
        reject(err);
      } else {
        console.log('Database initialized successfully');
        resolve();
      }
    });
  });
}

async function migrateLegacyParticipantSchema() {
  console.log('Migrating database: separating participant profile from event_year...');

  await new Promise<void>((resolve, reject) => {
    db.serialize(() => {
      db.run('PRAGMA foreign_keys = OFF');
      db.run('BEGIN TRANSACTION');

      db.run(`
        CREATE TABLE participants_v2 (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cedula TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          municipality TEXT NOT NULL,
          village TEXT NOT NULL,
          created_by TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);

      db.run(`
        INSERT OR IGNORE INTO participants_v2
          (id, cedula, name, municipality, village, created_by, created_at, updated_at)
        SELECT id, cedula, name, municipality, village, created_by, created_at, updated_at
        FROM participants
        ORDER BY updated_at DESC
      `);

      db.run(`
        CREATE TABLE product_records_v2 (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          participant_id INTEGER NOT NULL,
          event_year INTEGER NOT NULL,
          category TEXT NOT NULL,
          species_common_name TEXT NOT NULL,
          species_scientific_name TEXT NOT NULL,
          variety TEXT NOT NULL,
          quantity REAL NOT NULL,
          unit TEXT NOT NULL,
          stage TEXT NOT NULL,
          photo_uri TEXT,
          registered_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY(participant_id) REFERENCES participants_v2(id) ON DELETE CASCADE
        )
      `);

      db.run(`
        INSERT INTO product_records_v2
          (id, participant_id, event_year, category, species_common_name, species_scientific_name,
           variety, quantity, unit, stage, photo_uri, registered_at)
        SELECT pr.id, pv2.id, p.event_year, pr.category,
               pr.species_common_name, pr.species_scientific_name,
               pr.variety, pr.quantity, pr.unit, pr.stage, pr.photo_uri, datetime('now')
        FROM product_records pr
        JOIN participants p ON p.id = pr.participant_id
        JOIN participants_v2 pv2 ON pv2.cedula = p.cedula
      `);

      db.run('DROP TABLE product_records');
      db.run('DROP TABLE participants');
      db.run('ALTER TABLE participants_v2 RENAME TO participants');
      db.run('ALTER TABLE product_records_v2 RENAME TO product_records');
      db.run('COMMIT');
      db.run('PRAGMA foreign_keys = ON', (err?: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

async function ensureColumn(table: string, existingColumns: any[], name: string, sql: string) {
  if (!existingColumns.some((column) => column.name === name)) {
    await dbRun(sql);
  }
}

export async function migrateDatabase(): Promise<void> {
  try {
    let participantColumns: any[] = await dbAll('PRAGMA table_info(participants)');

    if (participantColumns.some((column) => column.name === 'event_year')) {
      await migrateLegacyParticipantSchema();
      console.log('Legacy schema migration completed successfully');
    }

    participantColumns = await dbAll('PRAGMA table_info(participants)');

    await ensureColumn('participants', participantColumns, 'phone', `ALTER TABLE participants ADD COLUMN phone TEXT NOT NULL DEFAULT ''`);
    await ensureColumn('participants', participantColumns, 'annual_trades', `ALTER TABLE participants ADD COLUMN annual_trades INTEGER NOT NULL DEFAULT 0`);
    await ensureColumn('participants', participantColumns, 'farm_name', `ALTER TABLE participants ADD COLUMN farm_name TEXT NOT NULL DEFAULT ''`);
    await ensureColumn('participants', participantColumns, 'latitude', `ALTER TABLE participants ADD COLUMN latitude REAL`);
    await ensureColumn('participants', participantColumns, 'longitude', `ALTER TABLE participants ADD COLUMN longitude REAL`);
    await ensureColumn('participants', participantColumns, 'altitude', `ALTER TABLE participants ADD COLUMN altitude REAL`);
    await ensureColumn('participants', participantColumns, 'corregimiento', `ALTER TABLE participants ADD COLUMN corregimiento TEXT NOT NULL DEFAULT ''`);
    await ensureColumn('participants', participantColumns, 'soil_type', `ALTER TABLE participants ADD COLUMN soil_type TEXT NOT NULL DEFAULT ''`);
    await ensureColumn('participants', participantColumns, 'climate_conditions', `ALTER TABLE participants ADD COLUMN climate_conditions TEXT NOT NULL DEFAULT ''`);
    await ensureColumn('participants', participantColumns, 'productive_systems', `ALTER TABLE participants ADD COLUMN productive_systems TEXT NOT NULL DEFAULT ''`);
    await ensureColumn('participants', participantColumns, 'leadership', `ALTER TABLE participants ADD COLUMN leadership TEXT NOT NULL DEFAULT ''`);

    const eventRuleColumns: any[] = await dbAll('PRAGMA table_info(event_rules)');

    await ensureColumn('event_rules', eventRuleColumns, 'practice_weight', `ALTER TABLE event_rules ADD COLUMN practice_weight REAL NOT NULL DEFAULT 0`);
    await ensureColumn('event_rules', eventRuleColumns, 'leadership_weight', `ALTER TABLE event_rules ADD COLUMN leadership_weight REAL NOT NULL DEFAULT 0`);

    console.log('Database schema is current');
  } catch (error) {
    console.error('Database migration failed:', error);
    throw error;
  }
}
