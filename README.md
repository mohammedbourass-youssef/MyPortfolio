# Mohammed Bourass — Developer Portfolio

A client-only, static portfolio built with Vite, React, TypeScript, and Tailwind CSS. It has no backend, database, authentication, or required API services. Unknown external URLs are intentionally left blank in `src/data/profile.ts`. The hero and GitHub avatar use `public/Profile.webp` with `public/Profile.jpg` as the fallback; English and French CV downloads use `public/D_ENGLISH.pdf` and `public/CV_FRENSH.pdf` respectively. PDFs are never embedded or loaded on page view.

## Run locally

1. Install Node.js 20 or newer.
2. Install dependencies: `npm ci` (or `npm install` if you are updating the lockfile).
3. Start the dev server: `npm run dev`.
4. Verify the production version with `npm run build` and `npm run preview`.

## Deploy to GitHub Pages

1. Create a GitHub repository for the portfolio and push this project to its `main` branch. Commit `package-lock.json` after running `npm install`; the workflow uses `npm ci`.
2. In the repository, open **Settings > Pages**.
3. Set **Build and deployment > Source** to **GitHub Actions**.
4. Push to `main` (or run the workflow manually from the Actions tab). `.github/workflows/deploy.yml` builds `dist/` and publishes it with GitHub Pages actions.
5. Wait for the Pages deployment workflow to finish, then open the URL shown in the workflow or Pages settings.

`vite.config.ts` sets `base: './'` so generated assets use relative paths and work from a repository subpath. Hash-free section anchors do not require server routing. The workflow needs the repository's normal Pages deployment permissions; no API key or paid service is needed.

## Edit content

- `src/data/profile.ts`: name details, contact links, availability facts, stack, strengths, and footer stats.
- `src/data/projects.ts`: project summaries in English, French, and Arabic, tech stacks, highlights, categories, status, and optional links. Unknown links should be omitted; do not leave placeholder links in a published project.
- `src/data/timeline.ts`: localized timeline entries.
- `src/data/services.ts`: localized service cards, descriptions, and bullet points.
- `src/data/skills.ts`: skill groups and their items.
- `src/data/certificates.ts`: certificate title translations, issuer, date, file under `public/`, and optional verification URL. Each card uses the static first-page image at `public/certificates-thumbs/<id>.jpg`; the PDF is requested only after clicking View or Download. Add a matching thumbnail when adding a certificate.
- `src/data/github.ts`: static repository cards. The contribution chart is a progressive external image and has an error fallback; the page remains complete if it is unavailable.
- `src/i18n/en.json`, `fr.json`, `ar.json`: translated interface labels and page copy. To add a language, add its locale JSON, add its code to the `Lang` type and `translations` map in `src/lib/i18n.ts`, then provide translated `en/fr/ar`-style fields in project and timeline data (or expand the locale type accordingly). Update the language selector choices in the navbar and footer.
- `src/style.css`: layout, colors, responsive behavior, motion, and RTL adjustments.

The language preference and theme are stored in local storage when available; browser language is used on the first visit. Arabic automatically sets document `lang` and `dir` to Arabic and RTL.
