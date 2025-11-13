import { Injectable, Logger } from '@nestjs/common';
import { SuiEvent } from '@mysten/sui/client';

/**
 * Event handler function type
 * Processes a single Sui event and returns success status
 */
export type EventHandler = (event: SuiEvent) => Promise<void>;

/**
 * Event handler registration
 */
export interface EventHandlerRegistration {
  eventType: string; // Format: "marketplace::EventName"
  handler: EventHandler;
  fullEventType: string; // Full package event type for filtering
}

@Injectable()
export class EventRegistryService {
  private readonly logger = new Logger(EventRegistryService.name);
  private readonly handlers = new Map<string, EventHandlerRegistration>();

  /**
   * Register an event handler
   * @param packageId The Sui package ID
   * @param moduleName The module name (e.g., "marketplace")
   * @param eventName The event struct name (e.g., "StorageListed")
   * @param handler The handler function
   */
  registerHandler(
    packageId: string,
    moduleName: string,
    eventName: string,
    handler: EventHandler,
  ): void {
    const eventType = `${moduleName}::${eventName}`;
    const fullEventType = `${packageId}::${moduleName}::${eventName}`;

    if (this.handlers.has(eventType)) {
      this.logger.warn(
        `Handler for ${eventType} already registered, overwriting...`,
      );
    }

    this.handlers.set(eventType, {
      eventType,
      handler,
      fullEventType,
    });

    this.logger.log(`✅ Registered handler for ${eventType}`);
  }

  /**
   * Get handler for an event type
   */
  getHandler(eventType: string): EventHandler | undefined {
    return this.handlers.get(eventType)?.handler;
  }

  /**
   * Get all registered event types
   */
  getAllEventTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Get all registered handlers
   */
  getAllHandlers(): EventHandlerRegistration[] {
    return Array.from(this.handlers.values());
  }

  /**
   * Get full event type for filtering (includes package ID)
   */
  getFullEventType(eventType: string): string | undefined {
    return this.handlers.get(eventType)?.fullEventType;
  }

  /**
   * Check if a handler is registered
   */
  hasHandler(eventType: string): boolean {
    return this.handlers.has(eventType);
  }

  /**
   * Unregister a handler (useful for testing)
   */
  unregisterHandler(eventType: string): boolean {
    const deleted = this.handlers.delete(eventType);
    if (deleted) {
      this.logger.log(`Unregistered handler for ${eventType}`);
    }
    return deleted;
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clearAllHandlers(): void {
    this.handlers.clear();
    this.logger.warn('All handlers cleared');
  }

  /**
   * Get handler count
   */
  getHandlerCount(): number {
    return this.handlers.size;
  }
}
