# Deploy The Fact Desk to Vercel

Your project is committed locally on branch `main`. Follow these steps once.

## Step 1 — Push to GitHub

Open **PowerShell** in this folder:

```powershell
cd C:\Users\andre\the-fact-desk
```

### Option A: GitHub CLI (recommended)

```powershell
gh auth login
```

Choose: **GitHub.com** → **HTTPS** → **Login with browser**.

Then create the repo and push:

```powershell
gh repo create the-fact-desk --public --source=. --remote=origin --push
```

If the repo name is taken, pick another:

```powershell
gh repo create the-fact-desk-app --public --source=. --remote=origin --push
```

### Option B: GitHub website

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `the-fact-desk`
3. Public → **Create repository** (no README)
4. Run:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/the-fact-desk.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 2 — Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. **Import** your `the-fact-desk` GitHub repository
3. Framework: **Next.js** (auto-detected)
4. Build command: `npm run build` (default)
5. **Environment variables** (mock demo — recommended):

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SHOW_LIVE_BETA` | `false` |
| `NEXT_PUBLIC_USE_MERGED_STORIES` | `false` |
| `NEXT_PUBLIC_USE_RSS_CACHE` | `false` |

6. Click **Deploy**

Vercel gives you a URL like `https://the-fact-desk.vercel.app`.

---

## Optional — Live Beta on Vercel

`data/live-stories.json` is in the repo (cached RSS stories).

Set on Vercel → Settings → Environment Variables:

```
NEXT_PUBLIC_SHOW_LIVE_BETA=true
```

Redeploy. Mock desk stays; Live Beta Feed appears at the bottom.

---

## Verify after deploy

- `/` — homepage
- `/story/disaster-relief-audit-preliminary` — detail page
- `/api/live-preview` — cached live JSON
