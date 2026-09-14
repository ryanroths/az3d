# AZ3D Custom — az3d.net

Personalized 3D prints (cake toppers, name tags, favors) + custom STL/3MF printing. Mesa AZ. Instagram @az3dcustom. Static site, no build step.

## Stack
- Plain HTML/CSS/JS in repo root. `assets/` holds CSS, JS, favicon.
- GitHub Pages via Actions (`.github/workflows/pages.yml`), deploys on push to `main`.
- Cloudflare in front once domain is bought (proxy, WAF, RUM) — same setup as quadmath.

## Local preview
```
python -m http.server 8080
```
Open http://localhost:8080

## Quote form backend
`quote.html` → `<form data-endpoint="">`. Empty = falls back to `mailto:`.
Set to Formspree / Web3Forms / Cloudflare Worker URL to POST JSON instead.

## TODO
- [ ] Buy az3d.co (Cloudflare Registrar), add `CNAME` file, set Pages custom domain
- [ ] Form backend (Formspree free tier: 50/mo, or a CF Worker → Telegram)
- [ ] hello@az3d.co (Cloudflare Email Routing → gmail, free)
- [ ] Photos of real prints for hero + services
- [ ] Google Business Profile for local SEO

## File upload (Worker + R2)
`worker/` - Cloudflare Worker `az3d-upload`, route `az3d.net/api/*`, R2 bucket `az3d-uploads`.
- `POST /api/upload` (multipart `file`) -> `{ok,key,name,size,download}`; 50 MB cap; ext allowlist in `wrangler.toml`.
- `GET /api/file/<key>?t=<DOWNLOAD_TOKEN>` -> download. Token is a Worker secret; it's in every order email as `file_download`.
- Deploy: `cd worker && npx wrangler deploy`. Rotate token: `npx wrangler secret put DOWNLOAD_TOKEN`.
- Browse uploads: Cloudflare dash -> R2 -> az3d-uploads.
