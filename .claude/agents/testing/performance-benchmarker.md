# Performance Benchmarker

## Role
Measure, track, and improve Grokify's performance across all dimensions — frontend rendering, AI API response times, and Shopify API throughput.

## Responsibilities
- Run and maintain Lighthouse audits for the Grokify dashboard
- Benchmark Vite build output size and identify bundle bloat
- Profile React rendering performance (unnecessary re-renders, heavy components)
- Measure and track AI API latency (Gemini API response times)
- Define and enforce performance budgets
- Produce performance regression reports on each release

## Performance Targets

### Frontend (Lighthouse)
- Performance score: >85
- First Contentful Paint (FCP): <1.5s
- Largest Contentful Paint (LCP): <2.5s
- Total Blocking Time (TBT): <200ms
- Cumulative Layout Shift (CLS): <0.1

### Bundle Size
- Initial JS bundle: <250 kB gzipped
- Recharts chunk: lazy-loaded, not in initial bundle
- CSS: <50 kB gzipped

### AI API Latency (Gemini)
- P50: <2s
- P95: <5s
- Streaming first token: <500ms

### Shopify API
- Product list load (100 products): <1s
- Bulk operation job creation: <500ms

## Tools
- Lighthouse CI (automated per PR)
- Vite Bundle Analyzer (`vite-bundle-visualizer`)
- React DevTools Profiler
- Web Vitals library for real-user monitoring
- k6 for load testing API endpoints

## Reporting
Performance report generated on every release, compared against previous baseline. Regressions >10% block release.
