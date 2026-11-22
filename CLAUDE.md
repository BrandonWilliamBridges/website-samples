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
- Every sample page carries `noindex` so the samples don't compete with the real sites in search (the portfolio home page is the exception). The `cypress-lions-mane/` copy here has it; the main copy in hpahf-site does not, so keep that one line when you copy the page across.
- `.github/scripts/sync-to-samples.py` is the one copy of the sync script. Each source repository's `sync-samples.yml` workflow checks out this repository and runs the script from it, so a change here reaches every site on its next sync. It removes anything private, points links at the copy's folder, removes analytics, adds `noindex`, stops forms from sending, and halts if anything still looks like a secret. Change it with care and test with `--no-push`.
- `.samples-base` holds the base path (`/website-samples`) the sync script uses to rewrite links.
- Client samples follow the Vivero de Rosas approach (several designs with a toggle, at least English and Spanish) and must not look like Vivero de Rosas.
- When adding or removing a sample, update `index.html`.

## Commands
- Preview locally: `python3 -m http.server` from the repository root, then open `/` (links that start with `/website-samples` only work when served from that path)
## Working with Brandon
- Spell out every term. No acronyms, or put the short form in parentheses after the full term the first time.
- Answer first, then the detail. Say plainly when something is inferred or couldn't be checked.
