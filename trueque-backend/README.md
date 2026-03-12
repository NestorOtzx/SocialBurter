# Trueque Backend API

API REST para el sistema del Trueque Municipal de Toribío.

## Configuración rápida

```bash
npm install
npm run dev
```

El servidor estará disponible en `http://localhost:3000`.

## Autenticación

Todos los endpoints excepto `POST /auth/login` y `GET /health` requieren un token JWT.

**Demo credentials:**
- Monitor: `monitor1 / 123456`
- Admin: `admin1 / admin123`

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "monitor1",
    "password": "123456"
  }'
```

Respuesta:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "monitor1",
    "role": "monitor"
  }
}
```

Incluye el token en las siguientes requests:
```
Authorization: Bearer <token>
```

## Endpoints

### Participants

**Guardar participante + productos**
```bash
POST /participants
Authorization: Bearer <token>
Content-Type: application/json

{
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
}
```

**Obtener participante**
```bash
GET /participants/by-cedula?cedula=123456789&eventYear=2026
Authorization: Bearer <token>
```

**Listar participantes de un año**
```bash
GET /participants?eventYear=2026
Authorization: Bearer <token>
```

### Ranking

**Obtener ranking con scoring**
```bash
GET /ranking?eventYear=2026
Authorization: Bearer <token>
```

Respuesta:
```json
{
  "rule": {
    "id": 1,
    "eventYear": 2026,
    "diversityWeight": 1,
    "volumeWeight": 1,
    "tieBreaker": "diversity"
  },
  "ranking": [
    {
      "participantId": 1,
      "cedula": "123456789",
      "name": "Juan Perez",
      "diversity": 3,
      "volume": 10.5,
      "score": 13.5
    }
  ]
}
```

**Histórico de un participante**
```bash
GET /ranking/historical?cedula=123456789
Authorization: Bearer <token>
```

**Obtener regla de un año**
```bash
GET /ranking/rule?eventYear=2026
Authorization: Bearer <token>
```

**Guardar/actualizar regla de año**
```bash
POST /ranking/rule
Authorization: Bearer <token>
Content-Type: application/json

{
  "eventYear": 2026,
  "diversityWeight": 2,
  "volumeWeight": 1,
  "tieBreaker": "diversity"
}
```

## Base de datos

Se crea automáticamente en `./trueque_municipal.db` (SQLite).

Contiene tablas:
- `participants`: Participantes del evento
- `product_records`: Productos registrados
- `event_rules`: Reglas de premiación por año
- `species_catalog`: Catálogo de especies

## Notas de integración móvil

El app móvil (`trueque-mobile`) puede cambiar fácilmente para conectar a esta API:

1. Reemplazar las funciones de `src/services/` para hacer HTTP calls en lugar de SQLite local.
2. Guardar el token JWT en AsyncStorage después del login.
3. Incluir el token en los headers de todas las requests autenticadas.
4. La BD local se puede mantener para cache offline.

## Próximos pasos

- [ ] Panel web administrativo (React/Vite)
- [ ] Exportación de reportes (PDF/Excel)
- [ ] Validación de roles más granular
- [ ] Rate limiting y seguridad
