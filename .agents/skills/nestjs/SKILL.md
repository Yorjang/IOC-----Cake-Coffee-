---
name: nestjs-best-practices
description: Best practices for coding NestJS modules, controllers, services, guards, entities, and database transactions.
---
# NestJS Best Practices and Guidelines

This skill defines coding standards and best practices for developing modules, controllers, and services in this NestJS codebase.

## 1. DTO & Validation
- Always use explicit DTO (Data Transfer Object) classes for request payloads.
- Use `class-validator` and `class-transformer` decorators to enforce strict type checking and validation on all DTO properties.
- Decorate nested DTO arrays or objects with `@ValidateNested({ each: true })` and `@Type(() => TargetDto)` to ensure nested validation runs correctly.

## 2. Controller Design
- Keep controller methods clean and focused on HTTP request/response handling.
- Use path parameters (`:id`) with explicit pipe validations (e.g. `ParseUUIDPipe`).
- Use custom decorators like `@CurrentUser()` to safely retrieve the authenticated session user.
- Delegate all business logic, data calculations, and transactional operations to services.

## 3. Service & Transaction Modularity
- Place business logic in services.
- Recalculate or validate critical data (like prices, subtotals, or inventory status) on the backend rather than trusting values passed from the client.
- When performing database updates (like stock decrements and order creation) that must be atomic, wrap the operations in database transactions.

## 4. Modularity and Dependency Injection
- Keep modules clean and decouple them using `imports`, `exports`, and explicit dependency injection.
- Avoid duplicate enum declarations; reuse enums defined inside entities or core constants.
