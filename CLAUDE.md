# Website samples (Brandon's portfolio)

Brandon's portfolio of website samples, served by GitHub Pages at https://brandonwilliambridges.github.io/website-samples/. `index.html` is the portfolio home page.

## Two kinds of folders
- **Mirrored automatically. Never edit these here**; change the source repository and its sync workflow updates the copy on the next push to its `main`:
  - `fruit-city-worldwide/` and `fruit-city-crm-demo/` (from fruitcity-site)
  - `tpotdoc/` (from tpotdoc)
  - `vivero-de-rosas/` (from vivero-rosas)
- **Kept by hand here**: `cypress-lions-mane/` (the main copy lives in hpahf-site; update both together), and the sample sites for prospective clients: `cypress-tailor/`, `el-pepe/`, `los-globos/`, `mi-tierra/`.

## Rules
- Nothing private is ever published here: no secrets, keys, real customer data, analytics, or forms that actually send.
- Every sample page carries `noindex` so the samples don't compete with the real sites in search (the portfolio home page is the exception). `cypress-lions-mane/index.html` is missing it as of November 2026.
- `.samples-base` holds the base path (`/website-samples`) the sync script uses to rewrite links.
- Client samples follow the Vivero de Rosas approach (several designs with a toggle, at least English and Spanish) and must not look like Vivero de Rosas.
- When adding or removing a sample, update `index.html`.

## Commands
- Preview locally: `python3 -m http.server` from the repository root, then open `/` (links that start with `/website-samples` only work when served from that path)
