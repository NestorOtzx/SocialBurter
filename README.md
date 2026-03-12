# Trueque Municipal - Proyecto Completo

## 📋 Descripción

Plataforma digital para gestionar eventos de intercambio de semillas, productos agrícolas y artesanales en municipios colombianos. Permite a monitores de campo registrar participantes y productos, calcular rankings basados en diversidad y volumen, y parametrizar reglas anuales.

## 🏗️ Arquitectura

### Stack de Tecnología

```
┌─────────────────────────────────────────────────────────────┐
│                    APLICACIÓN MÓVIL                         │
│  React Native + Expo + TypeScript + SQLite (local cache)    │
├─────────────────────────────────────────────────────────────┤
│                   HTTP API REST + JWT                       │
├─────────────────────────────────────────────────────────────┤
│                    BACKEND API                              │
│     Express.js + Node.js + TypeScript + SQLite              │
└─────────────────────────────────────────────────────────────┘
```

### Componentes

#### 1. **Backend API** (`trueque-backend/`)
- **Framework**: Express.js + TypeScript
- **BD**: SQLite3 (local)
- **Auth**: JWT (jsonwebtoken)
- **Puertos**: 3000 (development)
- **Status**: ✅ Running

**Endpoints principales:**
- `POST /auth/login` - Autenticación con credenciales
- `POST/GET /participants` - CRUD de participantes
- `GET /ranking?eventYear=XXXX` - Ranking calculado con scoring
- `GET /ranking/historical?cedula=XXX` - Histórico por cedula
- `GET/POST /ranking/rule` - Gestión de parametrización anual

#### 2. **App Móvil** (`trueque-mobile/`)
- **Framework**: Expo (React Native)
- **Lenguaje**: TypeScript
- **BD Local**: expo-sqlite (cache offline)
- **HTTP Client**: axios
- **Auth**: JWT + AsyncStorage
- **Status**: ✅ TypeScript compila sin errores

**Screens:**
1. **LoginScreen** - Autenticación via API
2. **HomeScreen** - Menú principal
3. **RegisterParticipantScreen** - Formulario multi-producto con validación
4. **RankingScreen** - Tabla de posiciones por año
5. **HistoryScreen** - Consulta de histórico por cedula
6. **RulesScreen** - Editor de pesos y desempates anuales

## 📁 Estructura de Carpetas

```
proysocial/
├── trueque-backend/              # API Express
│   ├── src/
│   │   ├── index.ts              # Entry point
│   │   ├── db.ts                 # SQLite wrapper
│   │   ├── types.ts              # Shared interfaces
│   │   ├── middleware/
│   │   │   └── auth.ts           # JWT verification
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── participantController.ts
│   │   │   └── rankingController.ts
│   │   └── routes/
│   │       ├── authRoutes.ts
│   │       ├── participantRoutes.ts
│   │       └── rankingRoutes.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                      # Runtime config
│   └── README.md
│
├── trueque-mobile/               # React Native + Expo
│   ├── src/
│   │   ├── navigation/
│   │   │   └── AppNavigator.tsx  # Stack navigation
│   │   ├── screens/              # 6 screens
│   │   ├── services/
│   │   │   ├── apiClient.ts      # axios + JWT interceptors
│   │   │   ├── auth.ts
│   │   │   ├── participantService.ts
│   │   │   └── rankingService.ts
│   │   ├── data/
│   │   │   ├── db.ts             # expo-sqlite init
│   │   │   └── repositories.ts   # CRUD helpers
│   │   ├── models/
│   │   │   └── types.ts          # TypeScript types
│   │   └── styles/
│   │       └── theme.ts          # Colors + spacing
│   ├── App.tsx
│   ├── app.json
│   ├── package.json
│   └── tsconfig.json
│
├── INTEGRATION_GUIDE.md          # ← You are here
└── README.md
```

## 🚀 Quick Start

### 1. Iniciar Backend

```bash
cd i:\projects\proysocial\trueque-backend
npm install          # (ya hecho)
npm run dev          # TypeScript + auto-reload
```

Expected output:
```
Server running on http://localhost:3000
Database initialized
All routes registered
```

### 2. Iniciar App Móvil

```bash
cd i:\projects\proysocial\trueque-mobile
npm install          # (ya hecho)
npm run android      # Para emulador/dispositivo Android
  o
npm start            # Para que tu elijas (web/android/ios)
```

### 3. Credenciales de Demo

```
Monitor:  monitor1 / 123456
Admin:    admin1    / admin123
```

## 🔑 Características Implementadas

### ✅ Autenticación
- Login con credenciales de demo
- Token JWT generado por backend
- Persistencia de token en AsyncStorage
- Auto-logout en token expirado (401)

### ✅ Registro de Participantes
- Formulario multi-producto
- Validación en cliente
- Upload a API con token JWT
- Edición de registros existentes

### ✅ Ranking y Scoring
- Cálculo de diversidad (especies únicas)
- Cálculo de volumen (sumatoria de quantities)
- Scoring: `(diversidad × weight_div) + (volumen × weight_vol)`
- Desempate configurable (diversidad o volumen)
- Ranking ordenado por score descendente

### ✅ Parametrización Anual
- Pesos de scoring por años
- Criterio de desempate (diversidad/volumen)
- Persistencia en backend
- Consulta automática al cambiar año

### ✅ Consulta Histórica
- Búsqueda de participante por cedula
- Histórico de participación por año
- Score calculations para todos los años

### ✅ Base de Datos
- Schema consistente mobile ↔ backend
- Tablas: participants, product_records, event_rules, species_catalog
- WAL (Write-Ahead Logging) habilitado para concurrencia
- Transacciones en upserts

## 🧪 Testing

### Verificar Backend
```bash
node -e "const http = require('http'); http.get('http://localhost:3000/health', (res) => { let data = ''; res.on('data', c => data += c); res.on('end', () => console.log(data)); });"
```

### Verificar Compilación TypeScript
```bash
cd trueque-mobile && npx tsc --noEmit   # ✅ Debe pasar
cd trueque-backend && npx tsc --noEmit  # ✅ Debe pasar
```

### Test Completo de Flujo (manual)
1. Abrir app móvil
2. Login con `monitor1 / 123456`
3. Ir a "Registro en Campo"
4. Completar formulario (cedula, nombre, producto)
5. Click "Guardar participante"
6. Ir a "Ranking y Premiación"
7. Ver ranking actualizado

## 🔧 Configuración

### Variables de Entorno - Backend
`trueque-backend/.env`:
```
JWT_SECRET=your-secret-key
DB_PATH=./trueque_municipal.db
PORT=3000
NODE_ENV=development
```

### Variables de Entorno - Mobile
`trueque-mobile/.env` (crear):
```
REACT_APP_API_BASE_URL=http://localhost:3000
# Para dispositivo Android en red: http://192.168.1.100:3000
```

## 📱 Requisitos del Dispositivo

- **Android**: Android 8.0+ (API 26+)
- **Conectividad**: WiFi o USB para emulador
- **Espacio**: ~500MB para Expo + dependencias
- **RAM**: 2GB mínimo

## 🐛 Troubleshooting

| Error | Causa | Solución |
|-------|-------|----------|
| `Cannot POST /participants` | Token expirado | Re-login |
| `Network error` | Backend no corre | `npm run dev` en trueque-backend |
| `401 Unauthorized` | Credenciales incorrectas | Usar monitor1/123456 o admin1/admin123 |
| `Port 3000 in use` | Otra app usa el puerto | `npx kill-port 3000` |

## 🎯 Próximos Pasos (Futuro)

- [ ] Sincronización offline (sync_queue implementation)
- [ ] Panel web administrativo (React + Vite)
- [ ] Exportación de reportes (PDF/Excel)
- [ ] Rate limiting y seguridad avanzada
- [ ] Testing con iOS
- [ ] Base de datos remota (PostgreSQL en producción)
- [ ] Roles granulares (permisos por endpoint)
- [ ] Notificaciones push

## 📚 Documentación Completa

Ver:
- `trueque-backend/README.md` - Endpoints y API
- `INTEGRATION_GUIDE.md` - Guía de integración detallada

## 👥 Equipos en el Código

### Backend
- `src/controllers/rankingController.ts` - Lógica de scoring
- `src/middleware/auth.ts` - Seguridad

### Mobile
- `src/screens/RegisterParticipantScreen.tsx` - Formulario complejo
- `src/services/rankingService.ts` - Consumo de API ranking

## ✨ Resumen

El proyecto está **completamente integrado** y **listo para testing**:

✅ Backend compilando y corriendo
✅ App móvil compilando sin errores
✅ Autenticación JWT implementada
✅ Todos los screens utilizando API
✅ Base de datos sincronizada

**Estado de producción**: 60% (falta sincronización offline y panel web administrativo)
