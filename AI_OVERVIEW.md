# AI Overview: SocialBurter — Trueque Municipal de Toribío

This document provides a high-level overview of the **SocialBurter** project, a digital tool designed to support the ancestral practice of "Trueque" (barter) in the municipality of Toribío, Cauca, Colombia.

## 🌿 Project Concept: "Campo Digital" (Digital Field)
The project is built around the philosophy of being a "field tool" that feels part of the land it documents. It avoids corporate/bank aesthetics in favor of earthy tones, high legibility for outdoor use, and large touch targets for monitors working in the field.

## 📍 Context
- **Location:** Toribío, Cauca (Nasa territory).
- **Core Activity:** Exchange of seeds, knowledge, and agricultural products.
- **Goal:** Modernize the registration and ranking of participants during the annual barter event while preserving cultural integrity.

## 🛠 Tech Stack
The project is split into two main repositories:
1. **Backend (`trueque-backend`):** Node.js, Express, TypeScript, SQLite.
2. **Mobile (`trueque-mobile`):** React Native (Expo), JavaScript.

## 🔄 Main Workflow
1. **Login:** Monitors (field workers) or Admins log in using JWT-based authentication.
2. **Participant Registration:** 
   - Search for existing participants by ID (Cédula).
   - Update profiles or create new ones.
3. **Contribution Recording (Aportes):**
   - Record products brought to the event (Seeds, Raw Materials, Transformed Products, Live Animals).
   - Details include variety, quantity, unit (kg/unit), and stage (Arrival/Exchanged/Departure).
4. **Ranking:**
   - Real-time ranking calculation based on diversity of products and volume.
   - Historical view of participant performance across different years.

## 📂 Key Project Files
- `DESIGN.md`: Visual guidelines and design tokens.
- `INTEGRATION_GUIDE.md`: Setup instructions for backend and mobile integration.
- `trueque-backend/src/db.ts`: Database schema definition.
- `trueque-mobile/src/screens/`: UI logic for each part of the workflow.

---
**Note for AI:** Always maintain the "Campo Digital" aesthetic when suggesting UI changes. Focus on reliability and offline-first considerations where possible.
