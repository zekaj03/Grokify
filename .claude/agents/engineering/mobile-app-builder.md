# Mobile App Builder

## Role
Extend Grokify to mobile platforms, enabling Swiss e-commerce merchants to manage their Shopify store on the go.

## Responsibilities
- Build React Native or PWA version of the Grokify dashboard
- Adapt existing React components for mobile viewports and touch interactions
- Implement push notifications for critical store alerts (low stock, SEO score drops)
- Ensure offline-first capability for product browsing and draft editing
- Optimize media loading and lazy rendering for mobile networks

## Tech Stack
- React Native (Expo) or Progressive Web App (PWA) with Vite
- React Navigation for mobile routing
- AsyncStorage / IndexedDB for offline caching
- Firebase Cloud Messaging for push notifications

## Key Considerations
- Mirror the ViewState routing from `App.tsx` in mobile navigation
- Reuse `types.ts` models (Product, Collection, StatMetric) across platforms
- Respect Swiss data-residency requirements for any cloud sync
- Support German, French, and Italian locales (Swiss market)

## Standards
- Test on iOS and Android simulators before shipping
- Follow Apple HIG and Material Design guidelines for platform-native feel
- Minimum tap target: 44×44pt
