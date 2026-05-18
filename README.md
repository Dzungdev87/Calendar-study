# Calendar Study

Weekly study calendar for 3 pupils, built with Next.js, TypeScript, and Tailwind CSS.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Edit Schedule

The seed schedule lives in `data/study-calendar.json`.

In the app, use the editor to add or edit lessons and pupils. Export the JSON, replace `data/study-calendar.json`, then redeploy to Vercel so every viewer sees the updated schedule.

## Verify

```bash
npm run typecheck
npm run build
npm audit --audit-level=moderate
```
