import sqlite3 from 'sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';

const dbClient = process.env.DB_CLIENT || 'sqlite';
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'trueque_municipal.db');
const databaseUrl = process.env.DATABASE_URL || '';

let sqliteDb: sqlite3.Database | null = null;
let pgPool: Pool | null = null;

if (dbClient === 'postgres') {
  if (!databaseUrl) {
    console.error('DATABASE_URL is required when DB_CLIENT is postgres');
    process.exit(1);
  }
  pgPool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });
  console.log('Connected to PostgreSQL database');
} else {
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err);
    } else {
      console.log('Connected to SQLite database at', dbPath);
    }
  });
}

function translateQueryToPostgres(sql: string): string {
  let i = 1;
  return sql.replace(/\?/g, () => `$${i++}`);
}

export const dbRun = async (sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> => {
  if (dbClient === 'postgres' && pgPool) {
    let pgSql = translateQueryToPostgres(sql);
    
    // PostgreSQL doesn't have lastID, so we append RETURNING id to INSERTs.
    if (pgSql.trim().toUpperCase().startsWith('INSERT') && !pgSql.toUpperCase().includes('RETURNING ID')) {
      pgSql += ' RETURNING id';
    }

    // PostgreSQL requires fixing "INSERT OR IGNORE" to "ON CONFLICT DO NOTHING"
    pgSql = pgSql.replace(/INSERT OR IGNORE INTO/gi, 'INSERT INTO');
    if (sql.toUpperCase().includes('INSERT OR IGNORE INTO species_catalog')) {
      pgSql = pgSql.replace(';', '') + ' ON CONFLICT (common_name) DO NOTHING;';
    } else if (sql.toUpperCase().includes('INSERT OR IGNORE INTO users')) {
      pgSql = pgSql.replace(';', '') + ' ON CONFLICT (username) DO NOTHING;';
    } else if (sql.toUpperCase().includes('INSERT OR IGNORE INTO participants_v2')) {
      pgSql = pgSql.replace(';', '') + ' ON CONFLICT (cedula) DO NOTHING;';
    }

    try {
      const res = await pgPool.query(pgSql, params);
      const lastID = res.rows && res.rows[0]?.id ? res.rows[0].id : 0;
      return { lastID, changes: res.rowCount || 0 };
    } catch (err) {
      throw err;
    }
  } else if (sqliteDb) {
    return new Promise((resolve, reject) => {
      sqliteDb!.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }
  throw new Error('Database client not initialized');
};

export const dbGet = async (sql: string, params: any[] = []): Promise<any> => {
  if (dbClient === 'postgres' && pgPool) {
    const pgSql = translateQueryToPostgres(sql);
    const res = await pgPool.query(pgSql, params);
    return res.rows[0];
  } else if (sqliteDb) {
    return new Promise((resolve, reject) => {
      sqliteDb!.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
  throw new Error('Database client not initialized');
};

export const dbAll = async (sql: string, params: any[] = []): Promise<any[]> => {
  if (dbClient === 'postgres' && pgPool) {
    const pgSql = translateQueryToPostgres(sql);
    const res = await pgPool.query(pgSql, params);
    return res.rows || [];
  } else if (sqliteDb) {
    return new Promise((resolve, reject) => {
      sqliteDb!.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
  throw new Error('Database client not initialized');
};

const createTablesSQLite = `
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

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('monitor', 'admin')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

const createTablesPostgres = `
  CREATE TABLE IF NOT EXISTS participants (
    id SERIAL PRIMARY KEY,
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
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS product_records (
    id SERIAL PRIMARY KEY,
    participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    event_year INTEGER NOT NULL,
    category TEXT NOT NULL,
    species_common_name TEXT NOT NULL,
    species_scientific_name TEXT NOT NULL,
    variety TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    stage TEXT NOT NULL,
    photo_uri TEXT,
    registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS event_rules (
    id SERIAL PRIMARY KEY,
    event_year INTEGER NOT NULL UNIQUE,
    diversity_weight REAL NOT NULL,
    volume_weight REAL NOT NULL,
    practice_weight REAL NOT NULL DEFAULT 0,
    leadership_weight REAL NOT NULL DEFAULT 0,
    tie_breaker TEXT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS species_catalog (
    id SERIAL PRIMARY KEY,
    common_name TEXT NOT NULL UNIQUE,
    scientific_name TEXT NOT NULL
  );

  INSERT INTO species_catalog (common_name, scientific_name) VALUES
    ('Maiz', 'Zea mays'),
    ('Frijol', 'Phaseolus vulgaris'),
    ('Papa', 'Solanum tuberosum'),
    ('Yuca', 'Manihot esculenta'),
    ('Platano', 'Musa paradisiaca')
  ON CONFLICT (common_name) DO NOTHING;

  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('monitor', 'admin')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`;

export async function initDatabase() {
  const schema = dbClient === 'postgres' ? createTablesPostgres : createTablesSQLite;
  
  if (dbClient === 'postgres' && pgPool) {
    try {
      await pgPool.query(schema);
      console.log('PostgreSQL database initialized successfully');
    } catch (err) {
      console.error('Error initializing PostgreSQL database:', err);
      throw err;
    }
  } else if (sqliteDb) {
    return new Promise<void>((resolve, reject) => {
      sqliteDb!.exec(schema, (err) => {
        if (err) {
          console.error('Error initializing SQLite database:', err);
          reject(err);
        } else {
          console.log('SQLite database initialized successfully');
          resolve();
        }
      });
    });
  }
}

async function migrateLegacyParticipantSchema() {
  console.log('Migrating database: separating participant profile from event_year...');
  
  // Notice: We only run legacy SQLite migrations if we are actually using SQLite.
  // PostgreSQL shouldn't have legacy schema since it's brand new.
  if (dbClient === 'postgres') return;

  await new Promise<void>((resolve, reject) => {
    sqliteDb!.serialize(() => {
      sqliteDb!.run('PRAGMA foreign_keys = OFF');
      sqliteDb!.run('BEGIN TRANSACTION');

      sqliteDb!.run(`
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

      sqliteDb!.run(`
        INSERT OR IGNORE INTO participants_v2
          (id, cedula, name, municipality, village, created_by, created_at, updated_at)
        SELECT id, cedula, name, municipality, village, created_by, created_at, updated_at
        FROM participants
        ORDER BY updated_at DESC
      `);

      sqliteDb!.run(`
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

      sqliteDb!.run(`
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

      sqliteDb!.run('DROP TABLE product_records');
      sqliteDb!.run('DROP TABLE participants');
      sqliteDb!.run('ALTER TABLE participants_v2 RENAME TO participants');
      sqliteDb!.run('ALTER TABLE product_records_v2 RENAME TO product_records');
      sqliteDb!.run('COMMIT');
      sqliteDb!.run('PRAGMA foreign_keys = ON', (err?: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

async function ensureColumn(table: string, existingColumns: any[], name: string, sql: string) {
  if (dbClient === 'postgres') {
    // In Postgres, PRAGMA table_info is replaced by column queries, 
    // but column names check below uses `column_name` from information_schema.
    if (!existingColumns.some((column) => column.column_name === name)) {
      await dbRun(sql);
    }
  } else {
    if (!existingColumns.some((column) => column.name === name)) {
      await dbRun(sql);
    }
  }
}

export async function migrateDatabase(): Promise<void> {
  try {
    let participantColumns: any[] = [];
    let eventRuleColumns: any[] = [];
    
    if (dbClient === 'postgres') {
      participantColumns = await dbAll(`SELECT column_name FROM information_schema.columns WHERE table_name = 'participants'`);
      eventRuleColumns = await dbAll(`SELECT column_name FROM information_schema.columns WHERE table_name = 'event_rules'`);
      
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

      await ensureColumn('event_rules', eventRuleColumns, 'practice_weight', `ALTER TABLE event_rules ADD COLUMN practice_weight REAL NOT NULL DEFAULT 0`);
      await ensureColumn('event_rules', eventRuleColumns, 'leadership_weight', `ALTER TABLE event_rules ADD COLUMN leadership_weight REAL NOT NULL DEFAULT 0`);
      
    } else {
      participantColumns = await dbAll('PRAGMA table_info(participants)');
      
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

      eventRuleColumns = await dbAll('PRAGMA table_info(event_rules)');

      await ensureColumn('event_rules', eventRuleColumns, 'practice_weight', `ALTER TABLE event_rules ADD COLUMN practice_weight REAL NOT NULL DEFAULT 0`);
      await ensureColumn('event_rules', eventRuleColumns, 'leadership_weight', `ALTER TABLE event_rules ADD COLUMN leadership_weight REAL NOT NULL DEFAULT 0`);
    }

    await seedDemoUsers();

    console.log('Database schema is current');
  } catch (error) {
    console.error('Database migration failed:', error);
    throw error;
  }
}

async function seedDemoUsers(): Promise<void> {
  const count = await dbGet('SELECT COUNT(*) as cnt FROM users');
  if (count && count.cnt > 0) return;

  const SALT_ROUNDS = 10;
  const demoUsers = [
    { username: 'monitor1', password: '123456', role: 'monitor' },
    { username: 'admin1',   password: 'admin123', role: 'admin' },
  ];

  for (const user of demoUsers) {
    const hash = await bcrypt.hash(user.password, SALT_ROUNDS);
    
    // We already handle ON CONFLICT for this in dbRun
    await dbRun(
      `INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)`,
      [user.username, hash, user.role]
    );
  }

  console.log('Demo users seeded into users table');
}
