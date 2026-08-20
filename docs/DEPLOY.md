# Deploy Willow The Villa Calendar

## Recommended Free Setup

Use GitHub Pages. It hosts static HTML, CSS, JavaScript, and images for free from a GitHub repository.

Expected public URL:

```text
https://aditunga.github.io/WillowTheVilla/
```

## Publish From This Mac

The local repository is already initialized and committed.

Before pushing, make sure GitHub CLI is logged in as `aditunga`:

```sh
gh auth status
```

If it shows a different account, log in as `aditunga`:

```sh
gh auth login
```

Then create the GitHub repository and push:

```sh
gh repo create aditunga/WillowTheVilla --public --source=. --remote=origin --push
```

In GitHub:

1. Open `https://github.com/aditunga/WillowTheVilla`.
2. Go to `Settings`.
3. Open `Pages`.
4. Under `Build and deployment`, choose `Deploy from a branch`.
5. Select branch `main` and folder `/ (root)`.
6. Save.

If you want shared bookings and real owner-only financial/private fields, configure Supabase before or after publishing. See `docs/SUPABASE.md`.

## Offline Cache And Home Screen Install

`manifest.webmanifest` and `sw.js` must sit next to `index.html` at the site root, which
is where GitHub Pages already serves them from. Once the site is opened over HTTPS:

- Android Chrome and iOS Safari offer `Add to Home Screen`, and the calendar then opens
  full screen with the Willow icon.
- `sw.js` caches the page shell. It always tries the network first, so a deploy shows up
  on the next load; the cache is only used when the phone has no signal. Booking data
  itself already survives offline through `localStorage`.

To turn the offline cache off, delete `sw.js`, remove the `registerServiceWorker()` call
in `app.js`, and bump the `?v=` query on the script tags in `index.html` so phones pick up
the change.

## DuckDNS

DuckDNS is not needed for GitHub Pages. GitHub Pages already gives the free `github.io` website URL.

Use DuckDNS only if the site is hosted from a home/local machine. In that setup:

1. Create a DuckDNS subdomain.
2. Run a web server for this folder.
3. Set router port forwarding to that machine.
4. Keep the DuckDNS updater running so the hostname follows the home internet IP.

That home-hosted setup is more fragile than GitHub Pages and is not required for this static website.

## DuckDNS With GitHub Pages

GitHub Pages publishes four official IPv4 addresses:

```text
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

DuckDNS only has one `current ip` box. If you must point `willowthevilla.duckdns.org` to GitHub Pages through DuckDNS, use:

```text
185.199.108.153
```

This is less ideal than a normal DNS provider that supports all four records or a `CNAME`. In GitHub Pages settings, set the custom domain to:

```text
willowthevilla.duckdns.org
```
