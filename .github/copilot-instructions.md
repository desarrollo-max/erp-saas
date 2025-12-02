# Copilot Instructions for ERP-SaaS Project

This document provides guidance for AI coding agents to effectively contribute to this Angular-based ERP codebase.

## 1. Core Architecture: Clean Architecture with Repository Pattern

The fundamental architectural principle is the separation of concerns between the UI layer (Angular Components) and the data access layer. We use the **Repository Pattern** to abstract the data source (currently Supabase).

- **Data Flow**: `Component` -> `Repository` -> `Data Source` (`SupabaseService`)
- **Key Rule**: **Components MUST NOT directly inject or use `SupabaseService`.** All data access must be delegated to a repository.

### Key Files:
- **Abstract Repositories**: Located in `src/app/core/repositories/`. Example: `src/app/core/repositories/product.repository.ts`.
- **Implementations**: Located in `src/app/core/repositories/implementations/`. Example: `src/app/core/repositories/implementations/supabase-product.repository.ts`.
- **Dependency Injection**: Repositories are provided in `src/app/app.config.ts`.

**Example:**
To fetch products, inject `ProductRepository` into a component, not `SupabaseService`.
```typescript
// In a component
import { ProductRepository } from '../../../core/repositories/product.repository';
// ...
export class ProductListComponent {
  private productRepo = inject(ProductRepository);

  async loadProducts(): Promise<void> {
    const data = await this.productRepo.getAll(tenantId);
    // ...
  }
}
```

## 2. Angular Architecture: Standalone Components

This project uses **Angular 18+ with Standalone Components**. Avoid creating modules (`@NgModule`). Every new component, directive, and pipe should be standalone.

- **Routing**: Use lazy loading with `loadComponent` in the route definitions (`src/app/app.routes.ts`).

## 3. UI Layer: Native HTML + TailwindCSS

- **Styling**: All UI is built using **TailwindCSS**.
- **Component Libraries**: **DO NOT** use Angular Material or any other UI component libraries to avoid introducing new dependencies.

## 4. State Management: Angular Signals

- **State**: Use **Angular Signals** for managing component state. Avoid `BehaviorSubject` or other state management libraries unless absolutely necessary.

**Example:**
```typescript
// In a component
import { signal } from '@angular/core';
// ...
export class ProductListComponent {
  products = signal<ScmProduct[]>([]);
  isLoading = signal<boolean>(true);
}
```

## 5. Developer Workflow

- **Run Development Server**: `npm start`
- **Build**: `npm run build`
- **Testing**: The project is set up for Vitest, but no tests are implemented yet. When adding tests, use Vitest.

By following these guidelines, you will help maintain the architectural integrity and consistency of the codebase.
