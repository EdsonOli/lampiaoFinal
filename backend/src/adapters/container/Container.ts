/**
 * Dependency Injection Container
 * Central registry for all services, repositories, and use cases
 * Enforces hexagonal architecture boundaries
 */

import { infrastructure } from './infrastructure';
import { getUseCases, type UseCases } from './useCaseFactory';

export class Container {
  /**
   * Get all use cases (singleton)
   * Routes should ONLY use this to access business logic
   */
  static get useCases(): UseCases {
    return getUseCases();
  }

  /**
   * Get infrastructure layer directly (only for middleware/entrypoints)
   * DO NOT use in domain/application layers
   */
  static get infra() {
    return infrastructure;
  }

  /**
   * Convenient access to repositories
   */
  static get repositories() {
    return infrastructure.repositories;
  }

  /**
   * Convenient access to services
   */
  static get services() {
    return infrastructure.services;
  }
}
