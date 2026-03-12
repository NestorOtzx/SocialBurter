# Guía de Integración: App Móvil + Backend API

## Estado actual

✅ **Backend API** (`trueque-backend/`)
- Server corriendo en `http://localhost:3000`
- Todos los endpoints disponibles (auth, participants, ranking)
- Base de datos SQLite inicializada

✅ **App Móvil** (`trueque-mobile/`)
- Integrada con el API via servicios HTTP
- Login autenticado (token JWT)
- Todos los screens actualizados para consumir API

## Configuración

### 1. Variables de Entorno (App Móvil)

En `trueque-mobile/.env` (crear si no existe):

```
REACT_APP_API_BASE_URL=http://localhost:3000
```

Para testing en dispositivo físico o emulador Android, reemplaza `localhost` con tu IP:
```
REACT_APP_API_BASE_URL=http://192.168.1.100:3000
```

### 2. Backend debe estar corriendo

```bash
cd i:\projects\proysocial\trueque-backend
npm run dev
```

El servidor debe mostrar:
```
Server running on http://localhost:3000
Database initialized
```

### 3. Credenciales de Demo

- **Monitor**: `monitor1 / 123456`
- **Admin**: `admin1 / admin123`

## Testing

### Test 1: Verificar Backend

```bash
node -e "const http = require('http'); http.get('http://localhost:3000/health', (res) => { let data = ''; res.on('data', c => data += c); res.on('end', () => console.log(data)); });"
```

Expect response: `{"status":"ok"}`

### Test 2: Login API

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"monitor1","password":"123456"}'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "monitor1",
    "role": "monitor"
  }
}
```

Save el token.

### Test 3: Guardar Participante

```bash
curl -X POST http://localhost:3000/participants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "participant": {
      "cedula": "123456789",
      "name": "Juan Perez",
      "municipality": "Toribio",
      "village": "Vda. El Roble",
      "eventYear": 2026,
      "createdBy": "monitor1"
    },
    "products": [
      {
        "category": "semillas",
        "speciesCommonName": "Maiz",
        "speciesScientificName": "Zea mays",
        "variety": "Maiz blanco criollo",
        "quantity": 5,
        "unit": "kg",
        "stage": "llega"
      }
    ]
  }'
```

### Test 4: Obtener Ranking

```bash
curl http://localhost:3000/ranking?eventYear=2026 \
  -H "Authorization: Bearer <TOKEN>"
```

## Flujo de uso en la app

### 1. Login
- Usuario ingresa credenciales (demo: monitor1/123456)
- App hace `POST /auth/login`
- Token JWT se guarda en `AsyncStorage`

### 2. Registrar Participante
- Usuario completa formulario (cedula, nombre, productos)
- Click "Guardar participante"
- App hace `POST /participants` con token
- Servidor responde con éxito

### 3. Ver Ranking
- Usuario selecciona año del evento
- Click "Actualizar"
- App hace `GET /ranking?eventYear=XXXX` con token
- Muestra ranking ordenado por puntaje

### 4. Ver Histórico
- Usuario ingresa cedula
- Click "Buscar"
- App hace `GET /ranking/historical?cedula=XXX` con token
- Muestra histórico de todos los años

### 5. Editar Reglas
- Usuario selecciona año
- Click "Cargar Regla"
- App traefactores de ponderación del backend
- Usuario edita y guarda
- App hace `POST /ranking/rule` con token

## Próximos Pasos

1. **Testing en Android**
   - Instalar Android Studio + SDK
   - Crear emulador o conectar dispositivo
   - `npm run android` en trueque-mobile

2. **Testing en Web** (si se desea)
   - La app aún no compilapara web por issues de expo-sqlite
   - Opción: Crear un panel web separado con React + Vite

3. **Sincronización Offline** (futuro)
   - Mantener BD local para caché
   - Simplementar sync_queue para datos pendientes
   - Sincronizar cuando hay conectividad

## Troubleshooting

### "Cannot POST /participants"
- Verificar token está en header Authorization
- Verificar backend está corriendo

### "401 Unauthorized"
- Token expirado
- Usuario no autenticado
- Hacer login nuevamente

### "Network error"
- Backend no está corriendo (`npm run dev` en trueque-backend)
- URL del API incorrecta en `.env` (REACT_APP_API_BASE_URL)
- Firewall bloqueando puerto 3000

## Arquitectura

```
┌─────────────────────┐
│  Trueque Mobile     │
│  (React Native)     │
│  - 6 screens        │
│  - JWT auth         │
│  - Local cache (BD) │
└──────────┬──────────┘
           │ HTTP + JWT
           ▼
┌─────────────────────┐
│ Trueque Backend     │
│ (Express + Node)    │
│ - Auth: JWT         │
│ - Participants API  │
│ - Ranking Engine    │
│ - SQLite DB         │
└─────────────────────┘
```

Ambos están **integrados y listos para testing**.
