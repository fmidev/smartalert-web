# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A static-plus-PHP web app that displays CAP (Common Alerting Protocol) alerts on a Leaflet map. The browser side polls two tiny PHP endpoints that walk a CAP XML filesystem tree; there is no database, no framework, no build step for the frontend.

## Run locally

```bash
php -S localhost:8080
```

`data/` is gitignored — alerts are supplied at deploy time. For local work with real-looking data, either symlink a CAP tree (`ln -s /path/to/cap/tree data`) or reuse the CI fixtures:

```bash
cp -r .github/fixtures/subdirs data   # or .github/fixtures/flat
```

Browse `http://localhost:8080/` (map UI), `/capfeed.php` (ATOM feed, styled by `capatom.xsl` in browsers), `/list.php` (JSON).

## Data tree contract

The CAP endpoints expect one of two layouts under `data/`:

- **flat**: `data/publishedCap/<year>/<month>/<YYYYMMDDHHMMSS>/<ts>_NNNN_ALERT_*.xml`
- **subdir**: `data/<domain>/publishedCap/<year>/<month>/<ts>/<ts>_NNNN_ALERT_*.xml` with `<domain>` e.g. `meteorology`, `hydrology`

Both endpoints auto-detect which layout is in use: if `data/publishedCap/` exists they use flat, otherwise they scan `data/*/publishedCap/`. For each `publishedCap/` root they descend into the **lexicographically greatest** subdirectory (CAP dirs are zero-padded timestamps, so this picks the most recent issuance) and return files whose name matches `_ALERT_` or `_UPDATE_`. Alerts whose `<expires>` is in the past are skipped in `capfeed.php`. `list.php` does not filter by expiry — the frontend does.

Never hard-code an absolute working directory; the endpoints build paths from `__DIR__`.

## Endpoints

- **`list.php`** → JSON array of CAP file paths (document-root-relative). Accepts `?dir=a,b` to restrict to specific subdirs; values are whitelisted against `^[A-Za-z0-9_-]+$` and must correspond to existing `data/<name>/publishedCap` dirs.
- **`capfeed.php`** → ATOM feed of active alerts. Emits `<?xml-stylesheet href="capatom.xsl" type="text/xsl"?>` so browsers render a styled page while API clients keep getting raw XML.
- **`lastUpdated.php`** → JSON string with the name of the most recent timestamp dir (name only, not path). Note: this file uses a different subpath (`data/published`, `data/{hydrology,meteorology}/published`) than `list.php`/`capfeed.php`.

Output escaping in `capfeed.php`: use `htmlspecialchars(..., ENT_XML1 | ENT_QUOTES, 'UTF-8')` for any value that may land in an XML attribute (filenames, host header, CAP fields).

## Frontend wiring

`index.html` loads `capmap-config.js` (deployment-specific, contains map center/bounds, event types, language options — see `README.md` for the full config table), then `js/capmap.js` (map logic), then one or more `i18n/translations-XX-XX.js` files. Adding a new language means adding a translation JS file and linking it from `index.html`; adding a new event type means extending `eventTypes` in the config and making sure the translation files cover the new key.

Icons: default set in `img/`. To customize, copy to `img/custom/` (keep filenames) and set `customIcons: true`. See README for the rsync recipe.

## CI / release

`.github/workflows/docker-image.yml` runs on push to master and on PRs:

1. Lints all PHP by running `php -l` inside `php:7.2-cli` (matches the runtime Dockerfile base).
2. Builds the image from `Dockerfile` (just `php:7.2-apache` + `COPY . /var/www/html/`).
3. Smoke-tests the running container with fixtures bind-mounted at `/var/www/html/data`: exercises flat layout, subdir layout, auto-discovery, `?dir=` single / multi / rejected values, and asserts that `capfeed.php` emits the stylesheet PI and `capatom.xsl` is served.
4. Pushes to both `docker.io/fmidev/smartmetalert` and `ghcr.io/fmidev/smartalert-web`. Master builds tag `latest` + `YY.MM.DD` + `YY.MM.DD-<sha7>`; PR builds tag `pr-<N>`. Fork PRs skip login/push (secrets unavailable).

Fixtures live at `.github/fixtures/{flat,subdirs}/` and must be valid CAP 1.2 XML with `<expires>` in the far future. When changing CAP field handling, keep the fixtures aligned with what the assertions grep for.

## Two packaging paths

The repo is deployed two ways, so keep both in mind when adding files:

- **Docker**: `Dockerfile` copies the whole repo into `/var/www/html/`. `.dockerignore` excludes `.git`, `.github`, `.dockerignore`.
- **RPM**: `smartalert-web.spec` copies a hand-picked set — `*.php`, `*.js`, `index.html`, `cap-logo.png`, `i18n/`, `css/`, `js/`, `img/`. If you add a new top-level file that must ship (e.g. `capatom.xsl`), extend the `%install` section of the spec.

## Repo conventions

- No comments that narrate what the code does; only call out non-obvious invariants.
- When editing `capfeed.php` or `list.php`, keep filesystem calls absolute (`__DIR__ . "/..."`) and response URLs/paths document-root-relative — the two are kept separate deliberately so behavior doesn't depend on the PHP process CWD.
- Code changes to the PHP endpoints typically go through a PR so the workflow's smoke tests gate them; workflow/fixture changes are small enough to land on master directly.
