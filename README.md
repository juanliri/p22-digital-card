# P-22 Corp — Digital Executive Identity & Federal Procurement Gateway

Official digital business card and procurement capabilities portal for **P-22 Corp Construction Material Solutions LLC**.

- **CAGE Code**: `169D8`
- **UEI**: `X3HUQZ66P6N3`
- **Primary Domain**: `card.p22corp.com` (or Vercel production deployment)

---

## Architecture Overview

This platform outperforms enterprise commercial solutions (Popl Teams, HiHello Business, Blinq Premium) at **$0/month recurring cost** by running all cryptographic and dynamic generation client-side in the browser:

```
┌────────────────────────────────────────────────────────┐
│               PUBLIC CLIENT CARD VIEW                  │
│       Routes: card.p22corp.com/:slug (e.g. /pedro)      │
├────────────────────────────────────────────────────────┤
│ • Verified SAM.gov, CAGE & UEI Federal Badges          │
│ • 1-Click .vcf Phonebook Save with vCard 3.0 spec      │
│ • Client Quick Actions: Call, Email, Briefing, Website │
│ • 1:1 Live Site 3D Structural Elevation Video (1080p)  │
│ • Official Capability Statement (PDF & Web Takeoff)    │
│ • Facility & Logistics Operations Carousel             │
│ • Sticky Floating Bottom Dock on Scroll                │
│ • Lead Capture Exchange Form (Offline-first + Webhook) │
└────────────────────────────────────────────────────────┘
                           ▲
                           │ Separated Architecture
                           ▼
┌────────────────────────────────────────────────────────┐
│             STAFF PRE-EXPO SETUP HUB                   │
│              Route: card.p22corp.com/setup             │
├────────────────────────────────────────────────────────┤
│ • Staff Profile Selector (Pedro, Eduardo, Marleni, etc)│
│ • 1-Click HTML Email Signature Copier (Outlook/Gmail)  │
│ • 1080p HD Zoom & Teams Virtual Background Generator   │
│ • Apple Watch Face & Lock Screen QR Generator          │
│ • Hardware NFC Chip Programming Guide (NTAG215/216)    │
└────────────────────────────────────────────────────────┘
```

---

## Active Team Roster (`team.json`)

| Slug | Staff Member | Role | Direct Phone | Direct Email |
| :--- | :--- | :--- | :--- | :--- |
| `pedro` | **Pedro Felipe** | Managing Director & Govt Procurement Lead | 1-888-722-2675 | pfelipe@p22corp.com |
| `eduardo` | **Eduardo Lopez** | VP of Operations & Supply Chain | 1-888-722-2675 | elopez@p22corp.com |
| `marleni` | **Marleni Mendez** | Director of Federal Accounts & Contracts | 1-888-722-2675 | mmendez@p22corp.com |
| `bids` | **Government Solicitations** | Estimating & Bid Desk | 1-888-722-2675 | bids@p22corp.com |
| `logistics` | **Dallas Logistics Hub** | Central Warehouse & Staging Yard | 1-888-722-2675 | dispatch@p22corp.com |

---

## Vercel Deployment & Rollbacks

1. **Deploy Production**:
   ```bash
   vercel --prod
   ```

2. **Instant Rollback**:
   Through the Vercel dashboard or CLI, any previous deployment can be designated as the active production domain instantly with zero downtime.

3. **Routing Configuration (`vercel.json`)**:
   - `/setup` maps to `setup.html` (internal team only, robots noindex).
   - `/:slug` routes dynamically to `index.html` while preserving rep slug context.

---

## Local & Off-Site Backups

- Primary Repository: `i:\_Dev_Builds_\2026\p22-digital-card\`
- Redundant Physical Backup: `F:\P22-Digital-Card-Backup\`
