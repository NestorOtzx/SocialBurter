# Sistema de Diseño — Trueque Municipal de Toribío

## Concepto: "Campo Digital"

Una herramienta de campo que se siente como parte de la tierra que documenta.
Cálida, legible bajo el sol, confiable para un monitor que trabaja de pie.

El Trueque Municipal de Toribío tiene raíces en prácticas ancestrales nasa de intercambio
de semillas y conocimiento. El diseño debe honrar eso: tierra, vida, cosecha.
No tech corporativo. No azul de banco.

---

## Paleta de colores

### Colores principales

| Token | Hex | Uso |
|-------|-----|-----|
| `primary` | `#2D6A4F` | Acciones principales, botones, header |
| `primaryLight` | `#40916C` | Estados hover/pressed |
| `primarySurface` | `#D8F3DC` | Fondos de chips, badges activos |
| `accent` | `#D9730D` | Cosecha, CTAs secundarios, destacados |
| `accentLight` | `#F4A261` | Top 3 ranking, premios, celebración |

### Fondos y superficies

| Token | Hex | Uso |
|-------|-----|-----|
| `background` | `#F9F5EF` | Fondo general (blanco cálido, como papel artesanal) |
| `surface` | `#FFFFFF` | Cards, modales, formularios |
| `surfaceWarm` | `#FEF9F0` | Secciones alternadas, fondos de paso activo |

### Texto

| Token | Hex | Uso |
|-------|-----|-----|
| `text` | `#1A2E1F` | Texto principal (verde muy oscuro, no negro puro) |
| `mutedText` | `#5A7060` | Descripciones, metadatos |
| `lightText` | `#8FA693` | Placeholders, texto deshabilitado |

### Semánticos

| Token | Hex | Uso |
|-------|-----|-----|
| `success` | `#2D6A4F` | (mismo que primary — coherencia) |
| `warning` | `#D9730D` | (mismo que accent) |
| `error` | `#C0392B` | Errores de validación |
| `border` | `#D6E4DA` | Bordes de inputs, separadores (verde muy claro) |
| `shadow` | `#0A1F10` | Color de sombras (verde oscuro, no negro) |

### Ranking (podio)

| Posición | Color | Hex |
|----------|-------|-----|
| 1° Oro | `#F4A261` / `#E07B39` | Cosecha madura |
| 2° Plata | `#95D5B2` / `#74C69D` | Cultivo verde |
| 3° Bronce | `#D4A373` / `#C68B5C` | Tierra café |

---

## Tipografía

**Fuente:** Inter (ya cargada en el proyecto)

| Peso | Token | Uso |
|------|-------|-----|
| 400 | `fonts.regular` | Texto general, descripciones |
| 500 | `fonts.medium` | Labels de input, metadatos |
| 600 | `fonts.semibold` | Subtítulos, valores importantes |
| 700 | `fonts.bold` | Títulos de pantalla, nombres, puntajes |

### Escala tipográfica

| Elemento | Tamaño | Peso |
|----------|--------|------|
| Título de pantalla (header) | 20px | Bold |
| Título de card | 15px | Bold |
| Cuerpo | 14px | Regular |
| Descripción / meta | 12px | Regular |
| Badge / chip | 11px | SemiBold |
| Puntaje (ranking) | 24px | Bold |

---

## Espaciado

Sin cambios (el sistema actual funciona bien):

```js
xs: 6, sm: 10, md: 16, lg: 20, xl: 24, xxl: 32
```

**Regla de campo:** Targets táctiles mínimos de **48px** de alto. Los monitores usan la
app parados, con guantes o en condiciones difíciles.

---

## Componentes — Especificaciones de cambio

### AppHeader

**Cambio:** De blanco plano con línea gris a barra verde con texto blanco.

```
Fondo: primary (#2D6A4F)
Texto: #FFFFFF
SafeAreaView: mismo fondo verde
Sin borde inferior (el color ya separa)
Altura mínima: 64px
```

Opción: Agregar una franja de acento naranja de 4px en la parte inferior del header
como detalle de cosecha.

### MenuCard (Home)

**Cambio:** Agregar borde superior de color según categoría + icono más grande.

```
Card base: fondo blanco, radio 14px
Borde superior: 4px solid, color según categoría:
  - Pre-registro: primary (#2D6A4F)
  - Registro día: accent (#D9730D)
  - Ranking: accentLight (#F4A261)
  - Histórico: #40916C
  - Configuración: mutedText (#5A7060)

Sombra: más suave, usar sombra verde oscura
  shadowColor: #0A1F10
  elevation: 2 (reducir)
```

### InputField

**Cambio:** Border color verde, focus con primary, fondo cálido.

```
Estado normal: border #D6E4DA, fondo #FFFFFF
Estado focus: border #2D6A4F, leve glow
Estado error: border #C0392B
Label: color text (#1A2E1F), font semibold
```

### Botón primario

**Cambio:** De azul a verde bosque.

```
Fondo: primary (#2D6A4F)
Texto: #FFFFFF, bold, 15px
Radius: 10px
Alto mínimo: 52px (regla de campo)
Estado pressed: primaryLight (#40916C)
Estado disabled: opacity 0.5
```

### Ranking cards

**Cambio:** Podio con colores y medalla visual.

```
Top 1: borde izquierdo 5px #F4A261 (dorado), círculo posición con fondo dorado
Top 2: borde izquierdo 5px #95D5B2 (verde), círculo verde
Top 3: borde izquierdo 5px #D4A373 (tierra), círculo marrón
Resto: borde izquierdo 3px #D6E4DA (neutro)

Puntaje: 22-24px, bold, color primary
```

### Chip / Badge de categoría

**Cambio:** Usar `primarySurface` (#D8F3DC) con texto `primary` en lugar de gris.

### Stepper (wizard de registro)

**Cambio:** Pasos completados en verde, paso activo en accent naranja.

```
Completado: fondo primary (#2D6A4F), ícono check blanco
Activo: fondo accent (#D9730D), número blanco
Pendiente: fondo border (#D6E4DA), número mutedText
Línea conectora: primary para completados, border para pendientes
```

---

## Pantalla de Login — Diseño nuevo

```
Fondo superior (60%): primary (#2D6A4F) con textura sutil
  - Espacio para logo / nombre del municipio en grande
  - "Trueque Municipal" en blanco, bold, 28px
  - "Toribío, Cauca" en primarySurface, regular, 14px

Fondo inferior (40%): background (#F9F5EF)
  - Card blanca elevada (borderRadius 20px top)
  - Formulario dentro
  - Botón verde con texto "Ingresar"
```

Alternativa más simple (sin rediseño estructural):
- Solo cambiar el color del header de Login a verde
- Agregar un ícono de hoja/semilla encima del form

---

## Pantalla Home — Diseño nuevo

```
Header: verde (#2D6A4F) con "Trueque Municipal" en blanco
Debajo del header: franja naranja de 4px (harvest stripe)
Fondo de pantalla: background (#F9F5EF)
Grid de cards: 2 columnas, con borde superior de color por categoría
Cada card: blanca, sombra verde suave, radio 14px
```

---

## Pantalla Ranking — Diseño nuevo

```
Banner superior:
  - Fondo: gradiente de primary a primaryLight
  - Título "Ranking 2026" en blanco, 22px bold
  - Subtítulo en primarySurface
  - Selector de año como chip/pill (fondo accentLight)

Filas de ranking:
  - Top 3: con indicador de color de podio en borde izquierdo
  - Medal icon (🥇🥈🥉 o ícono SVG) junto al número de posición
  - Puntaje destacado en primary/accent según posición
```

---

## Iconografía

Mantener **Feather Icons** (ya instalado). Para el home, actualizar icons:

| Pantalla | Icon actual | Icon sugerido |
|----------|-------------|---------------|
| Pre-registro | `clipboard` | `user-plus` |
| Registro día | `refresh-cw` | `package` (semillas) |
| Ranking | `award` | `award` (ok) |
| Histórico | `bar-chart-2` | `clock` o `bar-chart-2` (ok) |
| Configuración | `settings` | `sliders` |

---

## Responsive — Reglas

La app es React Native (mobile-first), pero hay consideraciones:

1. **Tablet / landscape:** El grid de Home debe pasar de 2 columnas a 3 o 4.
   Implementar con `Dimensions.get('window').width > 600` o `useWindowDimensions()`.

2. **Wizard de pasos:** En pantallas anchas, los steps del wizard pueden mostrarse
   en dos columnas en lugar de uno.

3. **Ranking:** La lista puede usar `numColumns={2}` en FlatList para tablets.

4. **Touch targets:** Mínimo 48px en todas las acciones. Crítico para uso en campo.

5. **Contraste:** Verificar WCAG AA para texto sobre fondos de color. El verde
   `#2D6A4F` sobre `#FFFFFF` da ratio 7.2:1 (pasa AA y AAA).

---

## Variables de tema actualizadas

```js
// theme.js — versión nueva
export const colors = {
  primary: '#2D6A4F',
  primaryLight: '#40916C',
  primarySurface: '#D8F3DC',
  accent: '#D9730D',
  accentLight: '#F4A261',
  text: '#1A2E1F',
  mutedText: '#5A7060',
  lightText: '#8FA693',
  border: '#D6E4DA',
  background: '#F9F5EF',
  surface: '#FFFFFF',
  surfaceWarm: '#FEF9F0',
  success: '#2D6A4F',
  warningBackground: '#FEF3E2',
  warningText: '#92400E',
  chipBackground: '#D8F3DC',
  shadow: '#0A1F10',
  error: '#C0392B',
  // Ranking podio
  gold: '#F4A261',
  silver: '#95D5B2',
  bronze: '#D4A373',
};
```

---

## Resumen de cambios por impacto

| Cambio | Impacto visual | Esfuerzo | Prioridad |
|--------|---------------|---------|-----------|
| Actualizar paleta en `theme.js` | Alto — cambia toda la app | Bajo (1 archivo) | P0 |
| Rediseñar AppHeader (verde) | Alto — visible en todas las pantallas | Bajo | P0 |
| Actualizar botón primario | Medio | Mínimo | P0 |
| Borde superior de color en MenuCards | Medio | Bajo | P1 |
| Ranking con colores de podio | Alto en pantalla de ranking | Bajo | P1 |
| Rediseñar Login (fondo verde) | Alto — primera impresión | Medio | P1 |
| Stepper con colores semánticos | Bajo-medio | Bajo | P2 |
| Responsive tablet (Dimensions) | Bajo en móvil | Medio | P2 |
