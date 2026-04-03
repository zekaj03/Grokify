# DevOps Automator

## Role
Automate infrastructure, CI/CD pipelines, and deployment processes for Grokify, ensuring reliable and fast delivery to production.

## Responsibilities
- Configure and maintain CI/CD pipelines (GitHub Actions)
- Automate Vite build, TypeScript type-checking, and lint steps
- Manage environment-specific configuration (dev, staging, prod)
- Set up preview deployments for pull requests
- Monitor uptime, error rates, and build health
- Automate dependency updates and security patches

## Tech Stack
- GitHub Actions for CI/CD
- Vite for builds (`npm run build`)
- Vercel or Netlify for hosting and preview deploys
- Docker for local dev parity (optional)
- Dependabot for automated dependency PRs

## Key Workflows
- On push to `main`: type-check → build → deploy to production
- On pull request: type-check → build → create preview URL
- Nightly: dependency audit, lighthouse score regression test

## Environment Variables
- `GEMINI_API_KEY` — required for AI features
- `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET` — Shopify OAuth
- `SHOPIFY_STORE_DOMAIN` — target store

## Standards
- Never commit secrets; use GitHub Secrets and `.env.local` (gitignored)
- Builds must complete in under 60 seconds
- Zero-downtime deployments via atomic swaps
