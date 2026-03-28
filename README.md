# Assessment Specification

## Instruction:

Please solve the problem in the most effective way possible, use this assessment to show case your skills as a developer, preferably use Angular and C# .net to complete this assessment.
Please provide a GitHub link or similar alternative to view the code on completion,
expected completion is 7 days from receiving the assessment.

Given the available ingredients shown and the list of recipes below, determine the optimal
combination of foods that can be created in order to feed as many people as possible.

## Ingredients:

Cucumber x 2
Olives x2
Lettuce x3
Meat x6
Tomato x6
Cheese x8
Dough x10

## Recipes

### Burger

Servings: 1

Meat x1
Lettuce x1
Tomato x1
Cheese x1
Dough x1

### Pie

Servings: 1

Dough x2
Meat x2

### Sandwich

Servings: 1

Dough x1
Cucumber x1

### Pasta

Servings: 2

Dough x2
Tomato x1
Cheese x2
Meat x1

### Salad

Servings: 3

Lettuce x2
Tomato x2
Cucumber x1
Cheese x2
Olives x1

### Pizza

Servings: 4

Dough x3
Tomato x2
Cheese x3
Olives x1

# AlgoRation UI

## Implementation

The Angular/UI section of the assessment is meant to be a presentation layer of the application as a whole. All logic for performing the calculation and for CRUDing the ingredients and recipes are contained in the web API app. A number of Angular/UI techniques and features were included in this app:

### Features

- Angular 20 implementation with separation of concerns using the shell, core, and feature architecture.
- Routes:
  - Home page -> shows summaries and allows the user to trigger the calculation
  - Ingredients page -> allows the user to CRUD ingredients (Note: ingredients that are linked to a recipe cannot be removed)
  - Recipes page -> allows the user to CRUD recipes
- Services for consumption of the web API.
- Modal custom component because I didn't want to have a route for every CRUD operation, because it is reminicent of C# MVC, and think that this is more modern.
- Alert custom component so that I do not have to use the native browser Alert, and can provide my own styling and behaviour.
- Stores for ingredient and recipe data so that when navigating between the different routes, unnecessary requests do not need to be made.
- Basic testing suite.
- The UI elements and design is based off of the default Angular 20 template created when you create an application from scratch. It looks good, so I mostly copied and modified the styling slightly.
- Added functionality to build the app as a PWA.

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

## Useful commands

```bash
npm start
npm run build
npm test
npm run pwa
```

## PWA local preview

```bash
npm run pwa
```

This command creates a production build with the service worker enabled and serves the generated files from `dist/algoration-ui/browser` at `http://localhost:4200`.
