# HER Leadership HQ

Internal platform for [Her Education Required](https://hereducation.org) leadership: shared calendar, onboarding bids from the registration form, and weekly self reports.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Accounts (no Supabase / no cloud auth)

Each leader creates their own username + password on the login page (**Create account**). Accounts are stored locally in `data/users.json` with hashed passwords.

Optional form ingest secret in `.env.local`:

```
INGEST_SECRET=your-form-webhook-secret
```

## Features

- **Shared calendar** — any signed-in leader can post events.
- **Onboarding bids** — applications appear as cards; leaders bid to onboard them.
- **Weekly self reports** — saved as JSON files under `data/reports/`:
  - `current/week-of-YYYY-MM-DD/` — active week(s)
  - `archive/week-of-YYYY-MM-DD/` — automatically moved here once a week ends
  - Browse archived weeks on the reports page under **Archive by week**

## Connect the Google Form

Registration form: [HER Education Required registration form](https://docs.google.com/forms/d/1uCjsP-O7k6S3d_As3J2pampyR4RJQ0K7z5-txtg6EfA/viewform)

1. Open the form’s linked responses sheet (or Extensions → Apps Script on the form).
2. Paste `scripts/google-form-apps-script.js`.
3. Set `INGEST_URL` to your deployed HQ URL + `/api/ingest`.
4. Match `INGEST_SECRET` to `.env.local`.
5. Add an **On form submit** trigger for `onFormSubmit`.

## Deploy notes

Data lives on disk under `data/`. Works well on an always-on host (Railway, Render, Fly, a VPS).
