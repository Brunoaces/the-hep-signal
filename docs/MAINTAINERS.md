# Maintainer guide — The HEP Signal

This document describes the repository and publishing workflow for **authorized maintainers**. It is public for transparency but is **not** a public-contribution guide.

## Repository and website

- Repository: `Brunoaces/the-hep-signal`
- Production site: <https://thehepsignal.netlify.app/>
- Branch for approved production content: `main`
- Static build: Node.js 20+; `npm test` and `npm run build` (output in `dist/`)
- GitHub Actions runs tests and builds on pushes and pull requests.
- EmailOctopus handles subscriptions and sends approved newsletters.
- `site/index.html` is the existing homepage. Preserve its detector animation and live EmailOctopus form unless an intentional change is approved.

### First local checkout

```bash
git clone https://github.com/Brunoaces/the-hep-signal.git
cd the-hep-signal
npm test
npm run build
python3 -m http.server 8080 --directory dist
```

Open <http://localhost:8080>. Check the homepage, `/archive/`, `/issues/`, and topic links.

### Production deployment

The **existing** Netlify project must be linked to this repository's `main` branch (do not create a second site). The build command is `npm run build`, and the publish directory is `dist`; `netlify.toml` contains configuration. Git commits on `main` trigger publishing when Netlify's continuous deployment is enabled. Verify the build and subscription form after deployment.

### Internal editorial release

1. Thursday: prepare the newsletter and review candidates **outside public GitHub**, and verify exact bibliographic metadata.
2. Friday: obtain explicit editorial approval of the paper selection, writing, and topic classifications.
3. Only after approval, commit completed records to `content/issues.json` and `content/papers.json`. Never commit unpublished scientific deliberations, sensitive information, subscriber data, or credentials to a public repository—not even on a temporary branch or pull request.
4. Validate: `npm test && npm run build`. Review the generated pages and GitHub Actions checks before merging a release PR.
5. When the release is approved, merge to `main`. Check the live archive and send the reviewed email via EmailOctopus.

GitHub repository settings should be configured by an administrator under **Settings → General → Features**: disable public Issues (or restrict their creation to collaborators), leave Discussions disabled, and set Pull requests to **Collaborators only**. Changing this document does not set those access controls.

## Data model and archive behavior

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

## Production readiness checklist

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
