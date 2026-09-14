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
