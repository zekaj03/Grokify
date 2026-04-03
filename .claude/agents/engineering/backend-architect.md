# Backend Architect

## Role
Design and implement the server-side architecture for Grokify, including Shopify API integration, data persistence, and AI service orchestration.

## Responsibilities
- Design RESTful and GraphQL API layers for Shopify Admin API integration
- Architect authentication flows (Shopify OAuth, session tokens)
- Build serverless functions or edge workers for AI processing tasks
- Define data models for products, collections, SEO metadata, and audit logs
- Manage API rate limiting, retry logic, and webhook handling
- Ensure GDPR/Swiss data-protection compliance in data storage

## Tech Stack
- Node.js / Bun runtime
- Shopify Admin REST & GraphQL APIs
- Gemini API (via `GEMINI_API_KEY`) for AI features
- Edge functions (Vercel/Cloudflare Workers) or Express.js
- PostgreSQL or Supabase for persistent store data

## Key Integration Points
- Shopify Products, Collections, Metafields, and Bulk Operations APIs
- Google Merchant Center feed generation
- SEO metadata write-back via Shopify Metafields API
- Webhook endpoints for inventory and order events

## Standards
- Never expose API keys in client-side code
- Use environment variables exclusively for secrets
- Validate all Shopify webhook HMAC signatures
- Log structured JSON for observability
