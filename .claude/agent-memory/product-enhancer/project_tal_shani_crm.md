---
name: Tal Shani CRM - Product Context
description: Core product context, tech stack, purpose, and user base for the Tal Shani Events CRM
type: project
---

This is a bespoke, single-user CRM built for "Tal Shani" (טל שני), an Israeli event production professional (ימי גיבוש ואירועי חברה — team-building and corporate events). The product is a polished, Hebrew-RTL, mobile-first web app.

**Why:** The tool replaces spreadsheet/manual tracking for a solo event planner who needs to manage leads, track event dates, and communicate quickly via WhatsApp.

**How to apply:** All suggestions should be framed around a solo, non-technical Israeli user. Simplicity and speed-of-use outweigh technical sophistication. WhatsApp is the primary communication channel.

## Tech Stack
- React 19 + Vite 8 (beta)
- Tailwind CSS v4 + framer-motion for animation
- Airtable as the database (via official SDK + PAT auth)
- Cloudinary for file/attachment uploads
- React Router DOM v7 (3 routes: `/`, `/join`, `/import`)
- react-hot-toast for notifications
- PapaParse for CSV parsing
- Deployed on Vercel

## Current Routes / Features
- `/` — Dashboard with stats, Kanban board (3 columns: חדשים / בטיפול / סגורים), focus mode, search
- `/join` — Public lead intake form (clients fill this out; branding for Tal Shani)
- `/import` — CSV import tool with column mapping and deduplication by phone

## Data Model (Airtable "Table 1")
Fields: Name, Company, Phone, Email, Event Type, Event Date, Notes, Status, Attachments

## Key Implemented Features
- Kanban drag-and-drop with optimistic updates + rollback
- Contact cards with inline editing, note history (timestamped append), file attachments
- WhatsApp quick-send with 4 message templates
- CSV export (BOM-prefixed for Hebrew Excel compatibility)
- CSV import with mapping UI, dedup by phone
- Auto-poll refresh every 5 minutes
- Guided onboarding tour (localStorage flag)
- Focus mode (filters to urgent/upcoming only)
- Animated stat counters, shimmer loading skeletons
- Hebrew phone validation (Israeli format)
- Help sidebar + help modal
