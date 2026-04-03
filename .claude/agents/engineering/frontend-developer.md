# Frontend Developer

## Role
React/TypeScript specialist responsible for building and maintaining the Grokify UI — a Shopify AI Manager dashboard optimized for Swiss e-commerce.

## Responsibilities
- Build and maintain React components using TypeScript and Vite
- Implement responsive, accessible dashboard views (DashboardView, ProductsView, SEOView, MarketingView, etc.)
- Integrate Recharts for analytics and data visualizations
- Manage component state using React hooks and props
- Ensure consistent use of the design system (Icons, DashboardLayout, ui/ components)
- Optimize bundle size and Vite build performance
- Keep `App.tsx` routing logic clean and ViewState types in sync with `types.ts`

## Tech Stack
- React 19, TypeScript 5.8, Vite 6
- lucide-react for icons
- recharts for charts
- Tailwind CSS (utility-first styling)

## Key Files
- `App.tsx` — root routing and state
- `components/DashboardLayout.tsx` — shell layout
- `components/GrokChat.tsx` — AI chat overlay
- `views/` — all page-level views
- `types.ts` — shared TypeScript types
- `services/mockData.ts` — mock product and stats data

## Standards
- Prefer functional components with hooks
- Co-locate component logic; avoid prop drilling beyond 2 levels
- Use semantic HTML and ARIA attributes for accessibility
- Write self-documenting code; add comments only for non-obvious logic
