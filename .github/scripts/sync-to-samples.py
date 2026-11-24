#!/usr/bin/env python3
"""Copy built site folders into a checkout of BrandonWilliamBridges/website-samples, safely.

This is the only copy. It lives in website-samples, and each site's own repo runs it from its checkout of
website-samples (see .github/workflows/sync-samples.yml in fruitcity-site, tpotdoc and vivero-rosas).
A change here takes effect for every site on its next sync.

    python3 sync-to-samples.py --out OUT --samples SAMPLES --message "..." [--forbid-values-from FILE ...]

OUT holds one folder per site (for example OUT/vivero-de-rosas/). For each folder this script:
  1. deletes anything that must never be public (.env files, keys, databases, CNAME, git and editor files),
  2. adjusts every HTML page for the portfolio copy:
       - links that start with "/" are pointed at the site's folder (for example /website-samples/tpotdoc/),
       - analytics tags are removed so portfolio visits don't count as real-site traffic,
       - a noindex tag is added so the copy doesn't compete with the real site in search results,
       - a small script stops contact forms from sending real messages (including the sites' own live
         form services in LIVE_ENDPOINTS, whose addresses are also blanked in JavaScript files),
  3. stops the whole sync if anything still looks like a secret,
  4. replaces SAMPLES/<site>/ with the result.
Then it commits and pushes, retrying if another site pushed at the same moment.
"""
import argparse
import fnmatch
import os
import re
import shutil
import subprocess
import sys
import time

# Files and folders that are never copied, matched against each name (case-insensitive).
FORBIDDEN_NAMES = [
    '.env', '.env.*', '*.env', '.dev.vars', '.npmrc', '.netrc', '.pypirc',
    '*.pem', '*.key', '*.p12', '*.pfx', '*.crt', '*.cer', '*.jks', '*.keystore', 'id_rsa*', 'id_ed25519*', 'id_ecdsa*',
    '*.sql', '*.sqlite', '*.sqlite3', '*.db', '*.db-journal', '*.dump', '*.bak', '*.mdb', '*.csv', '*.xlsx', '*.xls',
    'wrangler.toml', 'wrangler.json', 'wrangler.jsonc', '.wrangler', 'node_modules', 'credentials*', '*secret*', '*.tfstate',
    '.git', '.gitignore', '.gitattributes', '.github', '.claude', 'CLAUDE.md', 'AGENTS.md', '.DS_Store', 'Thumbs.db',
    'CNAME', 'source-material',
]
# Text that looks like a credential. Any match stops the sync.
SECRET_PATTERNS = [
    (r'-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----', 'private key'),
    (r'\bgh[pousr]_[A-Za-z0-9]{30,}', 'GitHub token'),
    (r'\bgithub_pat_[A-Za-z0-9_]{40,}', 'GitHub token'),
    (r'\bAKIA[0-9A-Z]{16}\b', 'AWS access key'),
    (r'\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{32,}', 'API secret key'),
    (r'\b[rs]k_live_[A-Za-z0-9]{20,}', 'Stripe secret key'),
    (r'\bxox[abprs]-[A-Za-z0-9-]{10,}', 'Slack token'),
    (r'\bAIza[0-9A-Za-z_-]{35}\b', 'Google API key'),
    (r'(?i)\b(?:api[_-]?key|secret|password|passwd|auth[_-]?token|access[_-]?token)\b\s*[:=]\s*["\'][^"\'\s]{12,}["\']', 'hard-coded secret'),
    # Cloudflare: API tokens (40 characters) and Global API keys (37 hexadecimal characters) have no fixed prefix,
    # so they are caught by the name next to them; Origin CA keys have their own shape.
    (r'(?i)\b(?:cloudflare|cf)[_-]?(?:api[_-]?)?(?:token|key|secret)\b["\']?\s*[:=]\s*["\']?[A-Za-z0-9_-]{37,}', 'Cloudflare token or key'),
    (r'(?i)\bX-Auth-Key\b["\']?\s*[:=]\s*["\']?[0-9a-f]{37}\b', 'Cloudflare Global API key'),
    (r'\bv1\.0-[0-9a-f]{24}-[0-9a-f]{146}\b', 'Cloudflare Origin CA key'),
    # Twilio: Account SID (AC + 32 hex), API key SID (SK + 32 hex), and the auth token or API secret next to its name.
    (r'\bAC[0-9a-f]{32}\b', 'Twilio Account SID'),
    (r'\bSK[0-9a-f]{32}\b', 'Twilio API key'),
    (r'(?i)\btwilio[_-]?(?:auth[_-]?token|api[_-]?secret|secret|token)\b["\']?\s*[:=]\s*["\']?[0-9A-Za-z]{32}\b', 'Twilio auth token or secret'),
]
# Live form services run by the source sites themselves. In the portfolio copy their addresses are blanked in
# JavaScript files (so forms fall back to "call or email us"), forms and fetch calls to them are stopped by the
# sandbox script, and the sync stops if a JavaScript file still holds one.
LIVE_ENDPOINTS = [
    'apply.fruitcityworldwide.org',   # Fruit City volunteer applications (crm/volunteer-intake)
    'signup.fruitcityworldwide.org',  # Fruit City newsletter sign-up (workers/newsletter)
]
LIVE_URL = re.compile(r'(["\'`])https?://(?:' + '|'.join(re.escape(h) for h in LIVE_ENDPOINTS) + r')(?:/[^"\'`]*)?\1', re.I)
TEXT_EXT = {'.html', '.htm', '.js', '.mjs', '.css', '.json', '.xml', '.txt', '.svg', '.md', '.webmanifest', '.map'}
FORM_SERVICES = (r'formsubmit\.co|formspree\.io|web3forms\.com|getform\.io|usebasin\.com|api\.emailjs\.com|hooks\.zapier\.com|script\.google\.com|hook\.[a-z0-9]+\.make\.com|'
                 + '|'.join(re.escape(h) for h in LIVE_ENDPOINTS))
SANDBOX_FILE = 'samples-sandbox.js'  # served from the site's own folder, so a site's Content-Security-Policy allows it
SANDBOX = (
    '/* Added by sync-to-samples.py: this is a portfolio copy, so forms here never send anything. */(function(){'
    "var F=/^https?:\\/\\/([a-z0-9-]+\\.)*(" + FORM_SERVICES + ")\\//i;"
    'var f=window.fetch;window.fetch=function(i,o){var u=typeof i==="string"?i:(i&&i.url)||"";'
    'if(F.test(u))return Promise.resolve(new Response(JSON.stringify({success:"true",ok:true,message:"Portfolio copy: nothing was sent."}),'
    '{status:200,headers:{"content-type":"application/json"}}));return f.apply(this,arguments)};'
    'var b=navigator.sendBeacon&&navigator.sendBeacon.bind(navigator);if(b)navigator.sendBeacon=function(u,d){return F.test(String(u))?true:b(u,d)};'
    'document.addEventListener("submit",function(e){var a=e.target.getAttribute("action")||"";'
    'if(F.test(a)){e.preventDefault();alert("This is a portfolio copy of the site, so this form doesn\'t send anything.")}},true)})();\n'
)
ANALYTICS = re.compile(
    r'<script\b[^>]*(?:static\.cloudflareinsights\.com|googletagmanager\.com|google-analytics\.com|plausible\.io|umami|clarity\.ms|connect\.facebook\.net)[^>]*>\s*</script>\s*',
    re.I)


def log(msg):
    print(msg, flush=True)


def die(msg):
    print(f'::error::{msg}', flush=True)
    sys.exit(1)


def forbidden(name):
    n = name.lower()
    return any(fnmatch.fnmatch(n, p.lower()) for p in FORBIDDEN_NAMES)


def scrub(root):
    for dirpath, dirnames, filenames in os.walk(root, topdown=True):
        for d in list(dirnames):
            if forbidden(d):
                shutil.rmtree(os.path.join(dirpath, d))
                dirnames.remove(d)
                log(f'  left out folder {os.path.relpath(os.path.join(dirpath, d), root)}/')
        for f in filenames:
            p = os.path.join(dirpath, f)
            if forbidden(f) or os.path.islink(p):
                os.remove(p)
                log(f'  left out {os.path.relpath(p, root)}')


def rewrite_html(text, prefix):
    attr = re.compile(r'(\s(?:href|src|action|poster|data-src|data-href)\s*=\s*)(["\'])/(?!/)', re.I)
    text = attr.sub(lambda m: f'{m.group(1)}{m.group(2)}{prefix}/', text)
    text = re.sub(r'(\s(?:srcset|imagesrcset)\s*=\s*)(["\'])([^"\']*)\2',
                  lambda m: m.group(1) + m.group(2) + re.sub(r'(^|,\s*)/(?!/)', lambda n: f'{n.group(1)}{prefix}/', m.group(3)) + m.group(2),
                  text, flags=re.I)
    text = rewrite_css(text, prefix)
    text = ANALYTICS.sub('', text)
    head = ''
    if not re.search(r'<meta[^>]+name=["\']robots["\'][^>]+noindex', text, re.I):
        text = re.sub(r'<meta[^>]+name=["\']robots["\'][^>]*>\s*', '', text, flags=re.I)
        head += '<meta name="robots" content="noindex">'
    if 'data-samples-sandbox' not in text:
        head += f'<script src="{prefix}/{SANDBOX_FILE}" data-samples-sandbox></script>'
    if head:
        m = re.search(r'<head\b[^>]*>', text, re.I)
        text = text[:m.end()] + head + text[m.end():] if m else head + text
    return text


def rewrite_css(text, prefix):
    return re.sub(r'url\(\s*(["\']?)/(?!/)', lambda m: f'url({m.group(1)}{prefix}/', text)


def adjust(root, prefix):
    for dirpath, _, filenames in os.walk(root):
        for f in filenames:
            p = os.path.join(dirpath, f)
            ext = os.path.splitext(f)[1].lower()
            if ext not in ('.html', '.htm', '.css', '.js', '.mjs'):
                continue
            with open(p, encoding='utf-8', errors='surrogateescape') as fh:
                text = fh.read()
            if ext in ('.js', '.mjs'):
                new = LIVE_URL.sub(lambda m: m.group(1) * 2, text)  # 'https://apply.../apply' -> ''
            else:
                new = rewrite_html(text, prefix) if ext != '.css' else rewrite_css(text, prefix)
            if new != text:
                with open(p, 'w', encoding='utf-8', errors='surrogateescape') as fh:
                    fh.write(new)


def check(root, extra_values):
    problems = []
    for dirpath, _, filenames in os.walk(root):
        for f in filenames:
            p = os.path.join(dirpath, f)
            rel = os.path.relpath(p, root)
            if forbidden(f):
                problems.append(f'{rel}: file type is never allowed')
            if os.path.splitext(f)[1].lower() not in TEXT_EXT or os.path.getsize(p) > 20_000_000:
                continue
            with open(p, encoding='utf-8', errors='ignore') as fh:
                text = fh.read()
            for pat, what in SECRET_PATTERNS:
                if re.search(pat, text):
                    problems.append(f'{rel}: looks like it contains a {what}')
            if os.path.splitext(f)[1].lower() in ('.js', '.mjs') and f != SANDBOX_FILE and LIVE_URL.search(text):
                problems.append(f'{rel}: still points at a live form service ({", ".join(LIVE_ENDPOINTS)})')
            for v in extra_values:
                if v in text:
                    problems.append(f'{rel}: contains a private value from the source repo\'s config')
    return problems


def private_values(path):
    """Values from a config file (like crm/wrangler.toml) that must never show up in the copy."""
    vals = []
    if not path or not os.path.exists(path):
        return vals
    with open(path, encoding='utf-8') as fh:
        for line in fh:
            m = re.match(r'\s*([A-Za-z0-9_]+)\s*=\s*"([^"]{8,})"', line)
            if m and re.search(r'id|aud|key|secret|token|email|account', m.group(1), re.I):
                vals.extend(v.strip() for v in m.group(2).split(',') if len(v.strip()) >= 8)
    return vals


def git(samples, *args, check_ok=True):
    r = subprocess.run(['git', '-C', samples, *args], text=True, capture_output=True)
    if check_ok and r.returncode:
        die(f'git {" ".join(args)} failed:\n{r.stdout}{r.stderr}')
    return r


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True)
    ap.add_argument('--samples', required=True)
    ap.add_argument('--message', required=True)
    ap.add_argument('--forbid-values-from', action='append', default=[])
    ap.add_argument('--no-push', action='store_true', help='copy and commit only (for testing)')
    a = ap.parse_args()

    base_file = os.path.join(a.samples, '.samples-base')
    base = open(base_file).read().strip().rstrip('/') if os.path.exists(base_file) else '/website-samples'
    extra = [v for f in a.forbid_values_from for v in private_values(f)]
    sites = sorted(d for d in os.listdir(a.out) if os.path.isdir(os.path.join(a.out, d)))
    if not sites:
        die(f'nothing to sync in {a.out}')

    for site in sites:
        if not re.fullmatch(r'[a-z0-9][a-z0-9-]*', site):
            die(f'bad site folder name: {site}')
        src = os.path.join(a.out, site)
        log(f'== {site}')
        scrub(src)
        adjust(src, f'{base}/{site}')
        with open(os.path.join(src, SANDBOX_FILE), 'w') as fh:
            fh.write(SANDBOX)
        problems = check(src, extra)
        if problems:
            die('Stopped: the copy of ' + site + ' may contain private data. Nothing was pushed.\n' + '\n'.join('  ' + p for p in problems))
        if not os.path.exists(os.path.join(src, 'index.html')):
            die(f'{site} has no index.html; is the build output in the right place?')
        dest = os.path.join(a.samples, site)
        shutil.rmtree(dest, ignore_errors=True)
        shutil.copytree(src, dest)
        n = sum(len(f) for _, _, f in os.walk(dest))
        log(f'  {n} files ready')

    git(a.samples, 'add', '-A', '--', *sites)
    if git(a.samples, 'diff', '--cached', '--quiet', check_ok=False).returncode == 0:
        log('website-samples is already up to date; nothing to commit.')
        return
    git(a.samples, '-c', 'user.name=website-samples sync', '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com',
        'commit', '-q', '-m', a.message)
    if a.no_push:
        log('Committed (not pushed: --no-push).')
        return
    for attempt in range(1, 7):
        if git(a.samples, 'push', '-q', 'origin', 'HEAD:main', check_ok=False).returncode == 0:
            log('Pushed to website-samples.')
            return
        log(f'Push was rejected (another site probably synced at the same moment). Retrying ({attempt}/6)...')
        time.sleep(attempt * 3)
        git(a.samples, 'pull', '-q', '--rebase', 'origin', 'main')
    die('Could not push to website-samples after 6 tries.')


if __name__ == '__main__':
    main()
