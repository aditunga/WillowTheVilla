# Deploy Willow The Villa Calendar

## Recommended Free Setup

Use GitHub Pages. It hosts static HTML, CSS, JavaScript, and images for free from a GitHub repository.

Expected public URL:

```text
https://aditya915.github.io/WillowTheVilla/
```

## Publish From This Mac

The local repository is already initialized and committed.

Before pushing, make sure GitHub CLI is logged in as `aditya915`:

```sh
gh auth status
```

If it shows a different account, log in as `aditya915`:

```sh
gh auth login
```

Then create the GitHub repository and push:

```sh
gh repo create aditya915/WillowTheVilla --public --source=. --remote=origin --push
```

In GitHub:

1. Open `https://github.com/aditya915/WillowTheVilla`.
2. Go to `Settings`.
3. Open `Pages`.
4. Under `Build and deployment`, choose `GitHub Actions`.
5. The workflow in `.github/workflows/pages.yml` will deploy the website.

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
