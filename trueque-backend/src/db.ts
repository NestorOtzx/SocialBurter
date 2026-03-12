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

/**
 * Promisify db methods for async/await
 */
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

/**
 * Migrates from old schema (participants has event_year in UNIQUE, product_records has no event_year)
 * to new schema (participants UNIQUE by cedula only, product_records has event_year + registered_at).
 */
export async function migrateDatabase(): Promise<void> {
  try {
    const columns: any[] = await dbAll('PRAGMA table_info(participants)');
    const hasEventYear = columns.some((c) => c.name === 'event_year');
    if (!hasEventYear) {
      console.log('Database schema is current — no migration needed');
      return;
    }

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

        // Keep latest per cedula (ORDER DESC so first-inserted per UNIQUE is the latest)
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

        // Copy product_records, deriving event_year from the old participants row
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

    console.log('Database migration completed successfully');
  } catch (error) {
    console.error('Database migration failed:', error);
    throw error;
  }
}
