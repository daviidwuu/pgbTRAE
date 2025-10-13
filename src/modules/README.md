# Modular Architecture Documentation

## Overview

This document describes the new centralized modular architecture implemented for the PiggyBank application. The architecture follows clean separation of concerns principles with well-defined interfaces and consistent naming conventions.

## Architecture Principles

### 1. Single Responsibility
Each module has a single, well-defined responsibility:
- **Auth**: User authentication and profile management
- **Transactions**: Transaction CRUD operations and analytics
- **Budgets**: Budget management and tracking
- **Dashboard**: Data aggregation and UI coordination
- **Reports**: Financial reporting and data visualization
- **Wallet**: Account balance and wallet operations
- **Savings**: Savings goals and tracking

### 2. Clean Interfaces
All modules expose clean, consistent interfaces through their index files:
```typescript
// Module structure
export * from './services/ModuleService';
export * from './hooks/useModule';
export * from './types/module.types';
export * from './constants/module.constants';
export * from './utils/module.utils';
```

### 3. Dependency Management
Modules declare their dependencies explicitly:
```typescript
export const ModuleName = {
  name: 'ModuleName',
  version: '1.0.0',
  dependencies: ['Firebase', 'Services'],
  // ...
} as const;
```

## Module Structure

### Core Modules

#### Auth Module (`/src/modules/auth/`)
- **Services**: `AuthService`, `UserProfileService`
- **Hooks**: `useAuth`, `useUserProfile`
- **Types**: Authentication and user profile types
- **Constants**: Auth-specific constants and error messages

#### Transactions Module (`/src/modules/transactions/`)
- **Services**: `TransactionService`, `RecurringTransactionService`
- **Hooks**: `useTransactions`, `useRecurringTransactions`
- **Types**: Transaction and recurring transaction types
- **Utils**: Transaction filtering, sorting, and analytics
- **Constants**: Transaction-specific constants

#### Budgets Module (`/src/modules/budgets/`)
- **Services**: `BudgetService`
- **Hooks**: `useBudgets`
- **Types**: Budget and budget analytics types
- **Utils**: Budget calculations and status tracking
- **Constants**: Budget-specific constants

### Shared Modules

#### Services Module (`/src/modules/services/`)
- **BaseService**: Abstract base class for all services
- **CacheService**: Centralized caching functionality
- **EventService**: Inter-module communication
- **LoggerService**: Centralized logging
- **NotificationService**: Push notification management

#### Utils Module (`/src/modules/utils/`)
- **DateUtils**: Date formatting and manipulation
- **CurrencyUtils**: Currency formatting and parsing
- **ValidationUtils**: Input validation helpers
- **ArrayUtils**: Array manipulation utilities
- **StorageUtils**: Local storage management
- **AsyncUtils**: Async operation helpers

#### Types Module (`/src/modules/types/`)
- Centralized type definitions
- Module-specific type namespaces
- Common utility types

#### Constants Module (`/src/modules/constants/`)
- Application-wide constants
- API endpoints
- Error and success messages
- Feature flags

#### Hooks Module (`/src/modules/hooks/`)
- Reusable custom React hooks
- Generic async state management
- Local storage hooks
- Utility hooks

#### UI Module (`/src/modules/ui/`)
- Re-exports of all UI components
- Component categorization
- Design system configuration

## Usage Examples

### Importing from Modules

```typescript
// Import entire module
import { Auth } from '@/modules';

// Import specific functionality
import { AuthService, useAuth } from '@/modules/auth';
import { TransactionUtils } from '@/modules/transactions';
import { CurrencyUtils } from '@/modules/utils';
```

### Using Module Services

```typescript
// Initialize services
const authService = new AuthService(auth);
const userProfileService = new UserProfileService(firestore);

// Use with hooks
const authState = useAuth({
  authService,
  userProfileService,
  onAuthStateChange: (user) => console.log('Auth state changed:', user),
});
```

### Dynamic Module Loading

```typescript
// Load modules dynamically
const { AuthService } = await ModuleRegistry.Auth();
const { TransactionUtils } = await ModuleRegistry.Transactions();
```

## Migration Guide

### From Old Structure to New Modules

1. **Update Imports**:
   ```typescript
   // Old
   import { useUserProfile } from '@/features/auth/hooks/useUserProfile';
   
   // New
   import { useUserProfile } from '@/modules/auth';
   ```

2. **Service Initialization**:
   ```typescript
   // Old
   import { UserService } from '@/features/auth/services/UserService';
   
   // New
   import { UserProfileService } from '@/modules/auth';
   const userProfileService = new UserProfileService(firestore);
   ```

3. **Type Imports**:
   ```typescript
   // Old
   import { Transaction } from '@/shared/types';
   
   // New
   import { Transaction } from '@/modules/types';
   // or
   import { Transaction } from '@/modules/transactions';
   ```

## Benefits

### 1. **Improved Maintainability**
- Clear separation of concerns
- Single responsibility per module
- Consistent interfaces

### 2. **Better Scalability**
- Easy to add new modules
- Modular dependency management
- Clean import/export structure

### 3. **Enhanced Developer Experience**
- Predictable module structure
- Consistent naming conventions
- Clear documentation

### 4. **Easier Testing**
- Isolated module testing
- Mock-friendly interfaces
- Clear dependency injection

## Best Practices

### 1. **Module Design**
- Keep modules focused on single responsibility
- Define clear interfaces
- Minimize inter-module dependencies

### 2. **Naming Conventions**
- Use PascalCase for module names
- Use camelCase for functions and variables
- Use UPPER_CASE for constants

### 3. **Error Handling**
- Use consistent error types across modules
- Provide meaningful error messages
- Handle errors at module boundaries

### 4. **Performance**
- Use dynamic imports for large modules
- Implement proper caching strategies
- Optimize bundle splitting

## Future Enhancements

1. **Module Hot Reloading**: Enable hot reloading for individual modules
2. **Module Versioning**: Implement semantic versioning for modules
3. **Plugin System**: Allow third-party modules
4. **Module Analytics**: Track module usage and performance
5. **Automated Testing**: Module-specific test suites

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure all module files are properly exported in index files
2. **Circular Dependencies**: Check for circular imports between modules
3. **Type Errors**: Verify type definitions are properly exported
4. **Missing Dependencies**: Check module dependency declarations

### Debug Tools

```typescript
// Check module metadata
console.log(ModuleMetadata);

// Verify module loading
const moduleNames = Object.keys(ModuleRegistry);
console.log('Available modules:', moduleNames);
```

## Contributing

When adding new modules or modifying existing ones:

1. Follow the established module structure
2. Update this documentation
3. Add appropriate tests
4. Update type definitions
5. Consider backward compatibility