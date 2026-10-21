# The HEP Signal — Git-backed review archive

**Independent hep-ph research commentary · Newsletter via EmailOctopus · Website via Netlify.**

This repository extends the existing The HEP Signal homepage without redesigning it. The animated detector motif and **EmailOctopus embed remain in place**. Eight already-visible science topics now link to an **archive of our own reviews**, where each reviewed paper has its own shareable HTML page. Past newsletter issues have permanent pages too.

**No sample or fictitious scientific papers are published.** The initial data files are empty, ready for Issue #001.

> **Public repository warning:** HTML pages hide draft/unfinished entries, but GitHub's public source, commit history, branches and pull requests do **not**. Do not commit unpublished reviews, confidential deliberations, subscriber data or credentials to a public repository. Prepare drafts privately (e.g. in ChatGPT or on your machine), then add only the final approved material to GitHub. If you want an online private editorial workflow with branches/PRs containing drafts, keep the GitHub repository **private**. A published website can still be publicly accessible when built from a private repo.

## Quick start (locally)

Requires Node.js 20+; no `npm install` or external dependencies are needed.

```bash
npm run build
python3 -m http.server 8080 --directory dist
```

Open `http://localhost:8080`. Try the eight topic links on the homepage, `/archive/` and `/issues/`. (Open through a local server, not a `file://` URL.)

## Publish through the *existing* Netlify project

1. Create an **empty** GitHub repository called `the-hep-signal` (no generated README/initial commit).
2. Unzip the **source repository** package from ChatGPT. Open a terminal in the folder containing `netlify.toml` and `package.json`.
3. Initialize and upload Git:

   ```bash
   git init
   git add .
   git commit -m "Add The HEP Signal research review archive"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/the-hep-signal.git
   git push -u origin main
   ```

   Replace `YOUR_USERNAME` with your GitHub username; authenticate with GitHub if requested. Prefer a public repository for an open scientific project, but a private repository can also be used subject to your hosting plan limits.
4. In **Netlify**, select the **existing** project `thehepsignal.netlify.app`. Do **not** create a second Netlify project: we want to preserve its URL, forms, and deploy history.
5. Go to **Project configuration → Developer settings → Continuous deployment → Repository → Link repository**. Authorize Netlify's GitHub app to access the repository, then select `the-hep-signal`.
6. The repository's `netlify.toml` specifies **Build command:** `npm run build` and **Publish directory:** `dist`. Make sure the Netlify site's build settings don't override these values. Trigger the first deploy if it doesn't start automatically.
7. Verify these URLs after deployment:
   - `https://thehepsignal.netlify.app/` — original homepage, animated graphic, EmailOctopus subscription form.
   - `https://thehepsignal.netlify.app/archive/` — research archive (initially empty).
   - `https://thehepsignal.netlify.app/archive/?topic=dark-matter` — filtered archive.
   - `https://thehepsignal.netlify.app/issues/` — issue archive (initially empty).
8. **Test a subscription** after deployment. The original EmailOctopus script is preserved, but embedded scripts depend on external services and should be tested live.

> Avoid deploying this **source** ZIP to Netlify Drop as if it were a prebuilt site. For a manual deployment, use the separate **preview ZIP** containing generated `dist/` files. For ongoing automation, always connect GitHub to Netlify.

## Weekly scientific publication workflow

**Thursday (outside any public GitHub repo):** ChatGPT prepares a complete newsletter and candidate paper reviews. Editor examines originality, technical soundness, limitations, bibliographic metadata and topic assignments.

**Friday, after explicit scientific approval:** Update the content in `content/issues.json` and `content/papers.json` with **only publication-approved** entries. On a public repository, push approved content only (a PR can be used after approval); GitHub makes PR contents visible too. Netlify then builds the public site. If the repo is private, a PR and Netlify Deploy Preview can be used for private editorial drafts, subject to permissions and preview URL access restrictions. EmailOctopus is used separately to send the approved newsletter.

No homepage edits or manual Netlify ZIP uploads are required for weekly content updates.

**Important distinction:** Editing the content files still requires a Git commit, but Netlify handles rendering and publication automatically. If the GitHub app is connected to ChatGPT with write access, it may be possible to prepare these changes for editorial approval in GitHub. Without that connection, ChatGPT supplies edited JSON files or patches and the editor pushes them.

### Content schema

`content/issues.json` is an array of objects, one per weekly edition:

```json
{
  "number": "001",
  "date": "2026-10-23",
  "title": "An editorial headline for the issue",
  "intro": "The issue's approved opening editorial.",
  "closing": "The Beyond the Background editorial.",
  "email_archive_url": "https://www.example.org/verified-campaign-archive-url",
  "status": "draft"
}
```

`email_archive_url` is optional. When EmailOctopus provides a real online issue URL after sending, add it; do **not** use the example URL. Only set `"status": "published"` when the issue has been approved. A draft issue will not appear on the public **website**, but it **will** appear in the GitHub source if committed to a public repository; keep editorial drafts outside a public repo.

`content/papers.json` is an array of paper reviews:

```json
{
  "id": "2610.12345",
  "title": "Exact, verified arXiv paper title",
  "authors": ["First Author", "Second Author"],
  "announced": "2026-10-22",
  "issue": "001",
  "tier": "cover",
  "status": "draft",
  "headline": "Our short editorial headline (not a replacement for the paper title)",
  "summary": "The substantial approved review of what the authors calculated and found.",
  "why_it_matters": "The contribution and context, including comparison with earlier work.",
  "what_to_watch": "Questions, limitations, and concrete future tests.",
  "caveats": "Optional caveats paragraph.",
  "topics": ["dark-matter", "cosmology-baryogenesis"]
}
```

**This is illustrative schema, not an actual bibliographic record or published research claim.** Use a genuine arXiv identifier and validate the content before changing `status` to `approved`. A review becomes visible on the **website** only if both its own status is `approved` and its issue is `published`. A public GitHub repository exposes any content committed to it regardless of status.

No fixed quotas are imposed **per research field**. A published issue **must** have exactly one cover feature, 7–10 main selections (including the cover), and 3–5 honorable mentions; the build blocks incomplete issues. A paper may be filed under multiple research topics, but its review is stored only once.

### Supported research topic IDs

| Topic label | JSON ID |
|---|---|
| QCD & hadron physics | `qcd` |
| Collider phenomenology | `colliders` |
| Higgs & electroweak physics | `higgs-electroweak` |
| Flavor & precision tests | `flavor-precision` |
| Neutrinos & astroparticle physics | `neutrinos-astroparticle` |
| Cosmology & baryogenesis | `cosmology-baryogenesis` |
| Dark matter & hidden sectors | `dark-matter` |
| Effective field theory & BSM | `eft-bsm` |

### Built pages

- `/` — existing homepage, with topic links and an automatically refreshed Latest Issue panel.
- `/archive/` — all published reviews, searchable by title, author, arXiv ID, keywords, and topic, with filters for field and selection tier.
- `/reviews/2610.12345/` — individual permanent review pages (real arXiv ID substituted after approval).
- `/issues/` — index of all published issues.
- `/issues/001/` — permanent page for each issue, including selected-paper links and editorial.
- `/sitemap.xml` — automatically generated for discoverability.

**Security and quality:** Review pages are statically generated; dynamic data is HTML-escaped, external paper links are constructed only from validated arXiv IDs, and the build fails on invalid IDs, missing required scientific text, invalid topic tags or duplicate entries. The automated Node test suite (`npm test`) covers eight validation and output cases; a GitHub Actions workflow runs tests and builds on every push or PR. These checks validate website behavior and metadata structure, **not the scientific truth of any manuscript**. All material remains subject to editorial verification. Footer disclaimers clarify that the project is neither peer review nor affiliated with arXiv.

## Before connecting to production

1. Run `npm test` and `npm run build`; both must succeed.
2. For an **existing Netlify site** choose **Project configuration → Developer settings → Continuous deployment → Repository → Link repository**, rather than creating a second Netlify site. Netlify's current setup instructions: <https://docs.netlify.com/build/git-workflows/repo-permissions-linking/>.
3. Confirm the production branch is `main`, the build command is `npm run build`, the publish directory is `dist`, and the Node version is 22.
4. After deployment test the homepage animation, **all eight topic links**, archive empty state, past-issues empty state, and live EmailOctopus double-opt-in from a controlled test email. A successful local build does not prove the external EmailOctopus form can register subscribers.
5. Compare the deployed site URLs with the expected ones. If the old homepage persists, inspect the latest Netlify deploy log and which repository/branch is linked.
6. Archive pages currently support plain text, not LaTeX math typesetting. Before publishing analyses with equations we should decide on a safe equation-rendering strategy.

## Automated test commands

```bash
npm test       # content validation, publishing rules, HTML escaping, links
npm run build  # write the website into dist/
```
