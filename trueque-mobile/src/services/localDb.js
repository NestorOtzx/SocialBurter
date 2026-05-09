import * as SQLite from 'expo-sqlite';

// Open or create the database
let db;

export const getDb = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('trueque_offline.db');
  }
  return db;
};

// Initialize schema
export const initLocalDb = async () => {
  const database = await getDb();
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS sync_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cedula TEXT UNIQUE NOT NULL,
      payload_json TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS sync_contributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cedula TEXT NOT NULL,
      event_year INTEGER NOT NULL,
      payload_json TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

// Save participant offline
export const saveOfflineParticipant = async (participantData) => {
  const database = await getDb();
  const cedula = participantData.participant.cedula;
  const payload = JSON.stringify(participantData);

  // Use UPSERT to replace if exists (based on cedula UNIQUE constraint)
  await database.runAsync(
    `INSERT INTO sync_participants (cedula, payload_json, status) 
     VALUES (?, ?, 'pending')
     ON CONFLICT(cedula) DO UPDATE SET payload_json = excluded.payload_json, status = 'pending'`,
    [cedula, payload]
  );
};

// Save contributions offline
export const saveOfflineContributions = async (cedula, eventYear, contributionsData) => {
  const database = await getDb();
  const payload = JSON.stringify(contributionsData);

  // We append contributions. The backend handles inserting multiple.
  await database.runAsync(
    `INSERT INTO sync_contributions (cedula, event_year, payload_json, status) 
     VALUES (?, ?, ?, 'pending')`,
    [cedula, eventYear, payload]
  );
};

// Get pending items
export const getPendingParticipants = async () => {
  const database = await getDb();
  return await database.getAllAsync(`SELECT * FROM sync_participants WHERE status = 'pending'`);
};

export const getPendingContributions = async () => {
  const database = await getDb();
  return await database.getAllAsync(`SELECT * FROM sync_contributions WHERE status = 'pending'`);
};

// Mark as synced
export const markParticipantSynced = async (id) => {
  const database = await getDb();
  await database.runAsync(`UPDATE sync_participants SET status = 'synced' WHERE id = ?`, [id]);
};

export const markContributionsSynced = async (id) => {
  const database = await getDb();
  await database.runAsync(`UPDATE sync_contributions SET status = 'synced' WHERE id = ?`, [id]);
};

// Clear synced data (optional cleanup)
export const clearSyncedData = async () => {
  const database = await getDb();
  await database.runAsync(`DELETE FROM sync_participants WHERE status = 'synced'`);
  await database.runAsync(`DELETE FROM sync_contributions WHERE status = 'synced'`);
};
