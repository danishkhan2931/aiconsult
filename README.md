AI Consulting — Static Landing Page

This is a minimal single-page website (HTML/CSS/JS) for an AI software consulting agency. It uses vanilla HTML, CSS, and JavaScript and is dark-themed and responsive.

To serve locally:

If you have Python 3 installed:

```bash
# from the website/ folder
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

Or with Node.js and serve:

```bash
npm install -g serve
serve .
```

Local dev with email forwarding

1. Copy the example environment file and edit SMTP settings:

```bash
cp .env.example .env
# Edit .env and set SMTP_HOST, SMTP_USER, SMTP_PASS, and CONTACT_TO if needed
```

2. Install dependencies and start the server:

```bash
npm install
npm start
```

3. Open http://localhost:3000 (or the PORT you set).

Notes
- The server uses nodemailer to forward contact submissions to the email in CONTACT_TO (defaults to danishkhan2931@gmail.com in .env.example).
- Do not commit .env with credentials to source control.

Publish to GitHub Pages (quick, for danishkhan2931)

To publish the site publicly at https://danishkhan2931.github.io/ run the following from the `website/` folder:

```bash
cd /Users/danish/IdeaProjects/solutions/website
git init
git add .
git commit -m "Initial site for AI consulting"
# Create and push to the special user site repo (requires gh CLI or manual remote setup)
gh repo create danishkhan2931/danishkhan2931.github.io --public --source=. --remote=origin --push
```

If you don't have the GitHub CLI (`gh`), create a repo named `danishkhan2931.github.io` on github.com, then run:

```bash
cd /Users/danish/IdeaProjects/solutions/website
git init
git add .
git commit -m "Initial site for AI consulting"
git remote add origin https://github.com/danishkhan2931/danishkhan2931.github.io.git
git branch -M main
git push -u origin main
```

After pushing, the site will be available at:

https://danishkhan2931.github.io/

Contact form note for GitHub Pages

Because GitHub Pages only hosts static files, you must use a third-party form endpoint (Formspree, Formspark, Netlify Forms) or host the Node/Python backend elsewhere. To make it easy, `script.js` includes a `FORM_ENDPOINT` constant you can set to your Formspree URL (or leave as `/api/contact` if you will host the server separately).

Automated deploy via GitHub Actions

This repository includes a GitHub Actions workflow that will automatically deploy the site to GitHub Pages when you push to the `main` branch of a repository. To publish to the username site at `danishkhan2931.github.io`:

1. Create the GitHub repository named `danishkhan2931.github.io` in your account (or use the `gh` CLI):

```bash
# from the website/ folder
git init
git add .
git commit -m "Publish site"
git branch -M main
git remote add origin https://github.com/danishkhan2931/danishkhan2931.github.io.git
git push -u origin main
```

2. The `pages` GitHub Action workflow will run automatically and deploy the repo to GitHub Pages. It may take a minute or two.

3. Visit https://danishkhan2931.github.io/ to see the published site.

Notes
- The action publishes the repository root. Ensure you do not commit secrets like `.env` (there's a `.gitignore` that excludes them by default).
- The contact form must be wired to a third-party service (Formspree, etc.) for the static GitHub Pages site to collect submissions. See earlier instructions on configuring `window.FORM_ENDPOINT` in `index.html`.
