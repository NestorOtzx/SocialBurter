# AI Mobile Guide: trueque-mobile

This document details the React Native application structure and key development patterns for SocialBurter.

## 📱 Framework & Stack
- **Framework:** React Native + Expo.
- **Navigation:** React Navigation (Stack).
- **Icons:** Feather (via `@expo/vector-icons`).
- **Storage:** `AsyncStorage` for JWT and local cache.
- **API Client:** Standard `fetch` wrapped in services.

## 📂 Directory Structure
- `src/components/`: Reusable UI elements (Buttons, Inputs, Cards).
- `src/screens/`: Main views (Login, Home, Ranking, etc.).
- `src/screens/registro/`: Multi-step Wizard for registration.
- `src/services/`: Modules for API interaction (AuthService, ParticipantService).
- `src/constants/`: Theme tokens and global constants.

## 🗺 Navigation & Screens
1. **LoginScreen:** Authentication entry point.
2. **HomeScreen:** Dashboard with categorized MenuCards.
3. **RegistroWizard:** 4-step process:
    - `BuscarParticipanteStep`: Search by ID.
    - `DatosParticipanteStep`: Edit profile/demographics.
    - `RegistrarAportesStep`: List and add products brought.
    - `ResumenParticipanteTruequeStep`: Final review and submission.
4. **RankingScreen:** View current year scores.
5. **HistoricoScreen:** View history for a specific participant.
6. **ConfiguracionScreen:** Admin settings (Ranking weights).

## 🔄 Data Flow
- **Authentication:** Token stored in `AsyncStorage`. Intercepted by services to add `Authorization` header.
- **Registration:** Data is collected locally in the Wizard's state and sent in a single `POST` request at the end.
- **Ranking:** Fetched from backend on demand; uses pull-to-refresh.

## 🛠 Styling Pattern
Uses a centralized `theme.js` for colors and spacing.
- **Rule of Field:** All interactive elements (buttons, inputs) MUST have a minimum height/width of **48px** for better usability with gloves or in outdoor conditions.

---
**Note for AI:** When adding new screens, ensure they are registered in the main Navigator (usually in `App.js` or `navigation/`). Always use the defined theme colors instead of hardcoded hex values.
