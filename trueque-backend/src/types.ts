export type UserRole = 'monitor' | 'admin';
export type Category = 'semillas' | 'materias_primas' | 'transformados' | 'animales_vivos';
export type Stage = 'llega' | 'intercambiado' | 'retira';

export interface AuthUser {
  username: string;
  role: UserRole;
}

export interface Participant {
  id?: number;
  cedula: string;
  name: string;
  municipality: string;
  village: string;
  phone?: string;
  annualTrades?: number;
  farmName?: string;
  latitude?: number | null;
  longitude?: number | null;
  altitude?: number | null;
  corregimiento?: string;
  soilType?: string;
  climateConditions?: string;
  productiveSystems?: string[];
  leadership?: string[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Contribution {
  id?: number;
  participantId?: number;
  participantName?: string;
  participantCedula?: string;
  municipality?: string;
  village?: string;
  eventYear: number;
  category: Category;
  speciesCommonName: string;
  speciesScientificName: string;
  variety: string;
  quantity: number;
  unit: 'kg' | 'unidad';
  stage: Stage;
  photoUri?: string;
  registeredAt?: string;
}

export interface ProductRecord {
  id?: number;
  participantId?: number;
  category: Category;
  speciesCommonName: string;
  speciesScientificName: string;
  variety: string;
  quantity: number;
  unit: 'kg' | 'unidad';
  stage: Stage;
  photoUri?: string;
}

export interface RankingResult {
  participantId: number;
  cedula: string;
  name: string;
  diversity: number;
  volume: number;
  practices: number;
  leadership: number;
  score?: number;
}

export interface EventRule {
  id?: number;
  eventYear: number;
  diversityWeight: number;
  volumeWeight: number;
  practiceWeight: number;
  leadershipWeight: number;
  tieBreaker: 'diversity' | 'volume' | 'practices' | 'leadership';
  updatedAt?: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface JWTPayload {
  username: string;
  role: UserRole;
}
