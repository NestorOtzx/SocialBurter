# AI Backend Guide: trueque-backend

This document details the backend architecture, database schema, and API logic for the SocialBurter project.

## 🏗 Architecture
- **Engine:** Node.js + Express.
- **Language:** TypeScript.
- **Database:** SQLite (local file `trueque_municipal.db`).
- **Auth:** JWT (JSON Web Tokens).

## 🗄 Database Schema (`src/db.ts`)
The system uses several key tables:

### 1. `participants`
Stores participant profiles (independent of specific event years).
- `cedula`: Unique ID (National ID).
- `name`, `municipality`, `village`, `phone`.
- Geographic: `latitude`, `longitude`, `altitude`.
- Metadata: `farm_name`, `productive_systems`, `leadership`.

### 2. `product_records`
Stores individual contributions per event year.
- `participant_id`: Foreign key to `participants`.
- `event_year`: Year of the event.
- `category`: `semillas`, `materias_primas`, `transformados`, `animales_vivos`.
- `quantity`, `unit` (`kg` or `unidad`), `stage` (`llega`, `intercambiado`, `retira`).

### 3. `event_rules`
Defines how ranking points are calculated for a specific year.
- `diversity_weight`, `volume_weight`, `practice_weight`, `leadership_weight`.
- `tie_breaker`: Field used to break ties (e.g., 'diversity').

### 4. `species_catalog`
A reference list of common and scientific names for species (e.g., Maiz -> Zea mays).

## ⚖️ Ranking Logic
The ranking is calculated by the `RankingEngine`. It weighs:
1. **Diversity:** Number of different species brought.
2. **Volume:** Total quantity of products.
3. **Practices & Leadership:** Points from participant profile flags.

Final Score = `(Diversity * DiversityWeight) + (Volume * VolumeWeight) + ...`

## 🔌 API Endpoints
- `POST /auth/login`: Returns JWT and user role (`monitor` or `admin`).
- `GET /participants`: Search/List participants.
- `POST /participants`: Create/Update participant + contributions in one transaction.
- `GET /ranking`: Get current year ranking.
- `GET /ranking/historical`: Get all history for a specific `cedula`.
- `POST /ranking/rule`: Update weighting factors for a year.

## 🔑 Authentication
Requests to protected routes must include:
`Authorization: Bearer <JWT_TOKEN>`

---
**Note for AI:** When modifying DB logic, check `src/db.ts` for existing migration functions (`migrateDatabase`). Ensure any new fields are added to both the `CREATE TABLE` statements and the migration/ensureColumn helpers.
