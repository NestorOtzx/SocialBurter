# AI Design Guide: "Campo Digital"

This document defines the visual identity and UI rules for the SocialBurter ecosystem.

## 🌿 Philosophy: "Campo Digital"
The interface should feel organic and grounded. It is designed for monitors who work on their feet, under direct sunlight, and often in rugged environments.
- **Keywords:** Earthy, Warm, High-Contrast, Tactile, Reliable.
- **Avoid:** Neon blues, corporate minimalism, thin lines, small buttons.

## 🎨 Color Palette (Tokens)

| Token | Hex | Role |
|-------|-----|------|
| `primary` | `#2D6A4F` | Forest Green - Core actions, Headers. |
| `accent` | `#D9730D` | Harvest Orange - Secondary CTAs, Highlights. |
| `background` | `#F9F5EF` | Paper White - General background (warm). |
| `surface` | `#FFFFFF` | Card background. |
| `text` | `#1A2E1F` | Deep Green - Primary text (not pure black). |
| `mutedText` | `#5A7060` | Metadata / Placeholders. |
| `border` | `#D6E4DA` | Soft Green - Input borders, Dividers. |

### Ranking Colors (Podium)
- **1st (Gold):** `#F4A261` (Cosecha madura)
- **2nd (Silver):** `#95D5B2` (Cultivo verde)
- **3rd (Bronze):** `#D4A373` (Tierra café)

## ✍️ Typography
- **Font:** Inter.
- **Hierarchy:**
    - **Screen Titles:** 20px Bold.
    - **Card Titles:** 15px Bold.
    - **Body:** 14px Regular.
    - **Ranking Scores:** 24px Bold.

## 📐 Interaction Rules
1. **Target Táctil (Touch Targets):** Minimum **48px** for all buttons and inputs.
2. **Contrast:** High contrast between text and background to ensure sunlight legibility.
3. **AppHeader:** Primary Green background with white text.
4. **MenuCards:** Use a 4px top border color to differentiate categories (e.g., Orange for "Registro Día").
5. **Shadows:** Use a subtle dark green shadow (`#0A1F10`) instead of pure black for a more organic feel.

## 📦 Component Specs
- **Buttons:** 10px Border Radius, Bold 15px text, centered.
- **Inputs:** 1px Forest Green border on focus, warm white background.
- **Badges:** Use `primarySurface` (#D8F3DC) background for active states.

---
**Note for AI:** When generating UI code or mockups, strictly adhere to these color tokens. Do not introduce new colors unless they fit the "Campo Digital" earthy theme.
