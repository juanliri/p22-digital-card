# P-22 Digital Card — Setup Guide & System Workflows

Live site: `https://card.p22corp.com` · Repo: `juanliri/p22-digital-card` (auto-deploys to Vercel on push to `main`)

---

## 1. The Three Surfaces (who sees what)

| Surface | URL | Audience | Contains |
|---|---|---|---|
| **Public Card** | `/pedro` `/eduardo` `/marleni` `/bids` `/logistics` | Clients, primes, agencies | Save Contact, Apple/Google Wallet, Call/Email/SMS/WhatsApp, Step 2 exchange, 2 PDFs, supply chips |
| **Staff Badge** | `/badge?rep=pedro` · `eduardo` · `marleni` | Each staff member only (installed on own phone) | ID badge + QR of own public card. Low-key link to Setup |
| **Setup Hub** | `/setup` | Staff (PIN `169D8` or team PIN) | Wallet studio, lock-screen poster, email signature, Zoom background, NFC guide, lead vault |

Public pages never link to Setup. The footer has a faint link to the badge only.

---

## 2. Setup Guide — Per Person

### Pedro Felipe — Managing Director & Federal Contract Lead
- Public card: `/pedro` · Badge: `/badge?rep=pedro`
- Email `pfelipe@p22corp.com` · Phone `1-888-722-2675`

### Eduardo Lopez — Director of Commercial Sales & Material Supply
- Public card: `/eduardo` · Badge: `/badge?rep=eduardo`
- Email `sales@p22corp.com`

### Marleni Mendez — Director of Finance & Contract Compliance
- Public card: `/marleni` · Badge: `/badge?rep=marleni`
- Email `accounting@p22corp.com`

### Shared desks (no badge): Procurement Desk `/bids`, Logistics Hub `/logistics`
Team-wide cards for RFQ intake and staging/freight inquiries.

### One-time setup steps (each staff member, ~5 min)

**A. Install your badge (own phone only)**
1. Open your own badge link from the list above in Safari (iPhone) or Chrome (Android).
2. iPhone: Share → *Add to Home Screen*. Android: menu → *Install app*.
3. The icon is labelled with your first name and always opens your badge.
4. Each person has a separate install; do not install from someone else's link.

**B. Add your wallet pass**
1. Open your public card (`/yourname`) on your phone.
2. iPhone: tap **Apple Wallet** → *Add*. Android: tap **Google Wallet** → sign in → *Save*.
3. Google may ask you to verify identity first (Google's screen, not ours).
4. The iPhone pass also shows on Apple Watch (double-click side button).

**C. Setup Hub tools (optional)**
1. Go to `/setup`, enter PIN or CAGE `169D8`.
2. Pick your name in *Team Member*.
3. Tools: wallets, lock-screen poster, email signature (copy, paste in Outlook/Gmail), Zoom/Teams background, NFC card encoding (NFC Tools app, write the URL of your public card), lead vault.

---

## 3. Workflows

### 3.1 Client at a booth / meeting (main flow)
```
Client scans QR / NFC / link  ->  Public card (/pedro)
  -> Save Contact       ->  .vcf -> phone Contacts (iOS: "Create New Contact"; Android: share sheet -> Contacts)
  -> or Apple/Google Wallet  ->  pass saved
  -> or Call / Email / SMS / WhatsApp
        | any of these actions
  Step 2 opens: "Exchange Details" -> client enters name, agency, email, phone
        |
  Submit -> success card shown
```

### 3.2 Staff showing their badge
```
Home-screen badge icon -> /badge?rep=you -> badge with QR of your public card
  -> client scans QR -> flow 3.1
```

### 3.3 Staff admin
```
Badge -> low-visibility "Setup" link -> PIN gate -> /setup -> pick profile -> tools
```

### 3.4 Document delivery
Public card -> *Quick Preview* (modal) or *Download PDF* for the Capability Statement; *Download* for the Corporate Overview. The supply matrix expands on demand.

### 3.5 By audience
- **Prime / agency buyer:** save contact, download Capability Statement (CAGE `169D8`, UEI `X3HUQZ66P6N3`), submit exchange form.
- **Potential partner / vendor:** same card; Marleni's for vendor onboarding and invoicing, Eduardo's for supply.
- **Internal staff:** badge + setup tools.

---

## 4. How the Pieces Fit

```
team.json (source of truth: titles, bios, wallet serials)
   |
   +- index.html (master template, embedded TEAM_DATA)
   |      +- scratch/sync_mirrors_complete.py -> pedro/eduardo/marleni/bids/logistics.html
   +- assets/vcf/*.vcf        contact files (static)
   +- assets/passes/*.pkpass  Apple Wallet passes (static, signed by WalletWallet)
   +- Google Wallet           https://api.walletwallet.dev/api/passes/<serial>/google (fresh link each tap)
   +- badge.html + manifest-badge-<name>.json   independent installable badges
   +- setup.html              staff tools
   +- sw.js (v3.5)            offline cache; vercel.json sets MIME types and rewrites
```

**To change a title/bio:** edit `team.json`, re-inject into `index.html` `TEAM_DATA`, run `python scratch/sync_mirrors_complete.py`, regenerate `assets/vcf` if needed, then `git push`.

---

## 5. Known Gaps (fix before the expo)

1. **Lead form does not reach staff.** Submissions are saved only in the *visitor's own browser* (`localStorage`), so staff never receive them. `MAKE_WEBHOOK_URL` in `index.html` is still the placeholder `REPLACE_WITH_YOUR_WEBHOOK`. Fix: create a Make.com (or Zapier/Formspree) webhook, paste the URL, and leads arrive by email/Sheet.
2. **Setup PIN is client-side.** `169D8` is public on the card. It hides tools but is not real security. Keep nothing sensitive in Setup.
3. **Wallet passes show the old title.** Passes are minted by WalletWallet (e.g. Pedro's reads "Pedro Felipe | PMP", old title in the Google pass). Re-mint with the new business titles to match the cards.
4. **Free-tier limit.** WalletWallet allows about 1,000 pass creations/updates per month.
5. **Android contacts.** `.vcf` behaviour varies by browser; the share-sheet path is the most reliable.
6. **Old shared badge.** Anyone who installed it must delete and reinstall.

## 6. Pre-Expo Checklist
- [ ] Each person: install own badge, add wallet pass, test Save Contact
- [ ] Set up the lead webhook (gap 1) and test a submission end to end
- [ ] Re-mint wallet passes with updated titles (gap 3)
- [ ] Print/encode NFC cards with each person's public URL
- [ ] Test on one iPhone and one Android over mobile data
