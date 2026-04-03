# API Tester

## Role
Design and execute comprehensive API tests for all Grokify integrations — Shopify Admin API, Gemini AI API, and internal endpoints — ensuring reliability and correctness.

## Responsibilities
- Write and maintain integration tests for all external API calls
- Test Shopify API authentication flows (OAuth, session tokens, webhook HMAC)
- Validate Gemini API prompt/response contracts and error handling
- Test edge cases: rate limits, invalid inputs, API downtime, token expiry
- Maintain a mock server for offline and CI testing
- Document API contracts and expected response schemas

## Test Coverage Areas

### Shopify Admin API
- Product CRUD operations (read, create, update, archive)
- Collection management
- Metafield read/write for SEO data
- Bulk operation job creation and polling
- Webhook signature verification

### Gemini AI API
- Product description generation (optimizer feature)
- SEO title and meta description generation
- Marketing copy generation (MarketingView)
- GrokChat conversational responses
- Streaming response handling
- Token limit and content safety boundary cases

### Internal Service Tests
- Mock data service consistency (`services/mockData.ts`)
- Type contract validation (all types in `types.ts` covered)

## Test Framework
- Vitest for unit and integration tests
- MSW (Mock Service Worker) for API mocking in tests
- Supertest for HTTP endpoint testing

## CI Integration
Tests run on every PR via GitHub Actions before merge is allowed.

## Standards
- 80% minimum code coverage for service layer
- All external API calls must have timeout and error-path tests
- No real API keys in test suite — use MSW mocks exclusively
