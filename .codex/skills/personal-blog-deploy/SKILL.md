---
name: personal-blog-deploy
description: 发布和部署 /Users/ddd/个人博客 的 VitePress 个人博客文章到 GitHub Pages。Use when the user asks to push a blog article, publish personal blog changes, deploy the VitePress site, check GitHub Pages deployment, or avoid repeating the manual GitHub push/deploy workflow for this repository.
---

# Personal Blog Deploy

Use this skill for the personal blog repository at `/Users/ddd/个人博客`.

The repository publishes to GitHub Pages from `main` through `.github/workflows/deploy.yml`. The workflow builds VitePress with `npm run docs:build`, uploads `docs/.vitepress/dist`, and deploys via `actions/deploy-pages`.

## Fast Path

1. Confirm the target change set.

   ```bash
   git status --short
   git branch --show-current
   git remote -v
   ```

   Only stage files related to the user's requested article or navigation update. Do not stage unrelated dirty files.

2. Build locally with Homebrew Node.

   ```bash
   PATH=/opt/homebrew/bin:$PATH npm run docs:build
   ```

   Use this exact prefix because the Codex App bundled Node has previously hit Rollup native module issues on macOS.

3. Check the article is discoverable.

   For a scenario article, verify both:

   ```bash
   rg -n "文章标题|article-slug" docs/scenarios/index.md docs/.vitepress/config.mts
   test -f docs/scenarios/article-slug.md
   ```

   Adjust paths for other sections.

4. Stage only the intended files.

   ```bash
   git add <article.md> docs/scenarios/index.md docs/.vitepress/config.mts
   git status --short
   ```

5. Commit using Lore format plus the required OmX co-author trailer.

   ```bash
   git commit \
     -m "Record <article/topic> case" \
     -m "Document the <why/context> so the blog captures the reusable engineering lesson and measured result." \
     -m "Constraint: Keep the VitePress article discoverable from the relevant index and sidebar." \
     -m "Rejected: Publishing as an isolated note | It would be harder to find from the knowledge base navigation." \
     -m "Confidence: high" \
     -m "Scope-risk: narrow" \
     -m "Directive: Keep future claims tied to measured production data or clearly labeled test data." \
     -m "Tested: PATH=/opt/homebrew/bin:$PATH npm run docs:build" \
     -m "Not-tested: GitHub Pages workflow execution before push" \
     -m "Co-authored-by: OmX <omx@oh-my-codex.dev>"
   ```

6. Push to `origin/main`.

   ```bash
   git push origin main
   ```

   If HTTPS push hangs or times out, check:

   ```bash
   curl -I --connect-timeout 10 https://github.com
   gh auth status
   gh auth setup-git
   git push origin main
   ```

   Do not print tokens. Do not put tokens into the remote URL.

7. Verify GitHub Actions deployment.

   ```bash
   gh run list --workflow deploy.yml --branch main --limit 5
   gh run watch <run-id> --exit-status
   ```

   If `gh run watch` is unavailable or slow, poll:

   ```bash
   gh run view <run-id> --json status,conclusion,url,displayTitle
   ```

8. Verify the live page when deployment succeeds.

   ```bash
   curl -I --connect-timeout 15 https://dingdingbing.github.io/
   ```

   For a known page:

   ```bash
   curl -L --connect-timeout 15 https://dingdingbing.github.io/scenarios/<slug> | rg "文章标题"
   ```

## Known Repository Facts

- Repository path: `/Users/ddd/个人博客`
- Remote: `https://github.com/dingdingbing/dingdingbing.github.io.git`
- Default branch: `main`
- Deploy workflow: `.github/workflows/deploy.yml`
- Build command: `PATH=/opt/homebrew/bin:$PATH npm run docs:build`
- Pages URL: `https://dingdingbing.github.io/`

## Previous Proven Flow

The earlier successful deployment flow in session `019e1a2f-995e-7fb1-805e-e3595124a779` established this pattern:

- Add or update the Markdown article under `docs/`.
- Add the article to the matching section index.
- Add the sidebar entry in `docs/.vitepress/config.mts`.
- Run the local VitePress build.
- Commit with Lore trailers and `Co-authored-by: OmX <omx@oh-my-codex.dev>`.
- Push `main` to GitHub.
- Let GitHub Actions deploy Pages from `.github/workflows/deploy.yml`.
- Check the Actions run or final Pages URL before claiming deployment.

## Failure Handling

- If local build fails, fix the Markdown/config problem before committing.
- If push fails because GitHub is unreachable, keep the local commit and report the exact commit hash plus the network evidence. Retry only when a different route is available.
- If GitHub Actions fails, inspect the run logs with `gh run view --log` and fix the source issue locally before pushing a follow-up commit.
- If only the deployment verification is blocked by network, report the successful push hash and the command that could not reach GitHub.
