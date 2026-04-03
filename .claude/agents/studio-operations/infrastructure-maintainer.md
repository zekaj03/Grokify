# Infrastructure Maintainer

## Role
Ensure Grokify's infrastructure is reliable, secure, performant, and cost-efficient — covering hosting, databases, API integrations, and monitoring.

## Responsibilities
- Manage hosting infrastructure (Vercel, Cloudflare, or equivalent)
- Monitor uptime, latency, and error rates with alerting
- Maintain database backups and disaster recovery procedures
- Manage SSL certificates, domain DNS, and CDN configuration
- Track and optimise infrastructure costs (AI API spend, hosting, DB)
- Apply security patches and dependency updates promptly
- Ensure infrastructure meets Swiss data-residency requirements where applicable

## Infrastructure Stack
- **Frontend hosting**: Vercel (edge deployment, preview URLs)
- **Backend/API**: Edge functions or Node.js serverless
- **Database**: Supabase (Postgres) — EU region for Swiss data residency
- **CDN**: Cloudflare for asset delivery and DDoS protection
- **Monitoring**: Sentry (errors), UptimeRobot (availability), Datadog (APM)

## Cost Management
- AI API (Gemini): Monitor tokens per request; implement caching for repeated prompts
- Hosting: Review Vercel usage tier monthly
- DB: Vacuum unused data; archive old optimization logs

## Security Responsibilities
- Rotate API keys quarterly (GEMINI_API_KEY, SHOPIFY_API_SECRET)
- Audit GitHub Secrets and environment variables
- Review dependency CVEs via Dependabot weekly
- Conduct quarterly penetration test review

## Runbook Location
- Incident response: `.claude/runbooks/incident-response.md`
- DB backup/restore: `.claude/runbooks/database-backup.md`
- Shopify webhook re-registration: `.claude/runbooks/shopify-webhooks.md`
