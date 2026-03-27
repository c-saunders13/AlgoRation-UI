# AlgoRation UI

Angular 20 starter workspace generated for a single-application repository with a feature-first structure and standalone APIs.

## Stack

- Angular 20
- Standalone components and router configuration
- SCSS styling
- Strict TypeScript configuration
- Default generator conventions for OnPush standalone components

## Run

```bash
npm install
npm start
```

The development server runs on `http://localhost:4200` by default.

## Build

```bash
npm run build
```

Production output is written to `dist/`.

## Test

```bash
npm test
```

## Suggested structure

```text
src/
  app/
    core/        # app-wide services, interceptors, infrastructure
    features/    # route-level feature areas
    layout/      # shells and navigation containers
    shared/      # reusable UI primitives and utilities
```

## Conventions

- Keep the root app component thin. It should usually host only application wiring.
- Put business logic in feature areas first. Promote code into `shared` only once reuse is proven.
- Keep `core` for singleton concerns only.
- Prefer lazy-loaded feature entry points for route boundaries.
- Use generated standalone components with `OnPush` change detection by default.

## Useful commands

```bash
npm start
npm run build
npm test
npm run pwa
npx ng generate component features/orders/components/order-list
```

## PWA local preview

```bash
npm run pwa
```

This command creates a production build with the service worker enabled and serves the generated files from `dist/algoration-ui/browser` at `http://localhost:4200`.
