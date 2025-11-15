/**
 * Backend API client for storage optimization and indexing
 */

import type {
  OptimizationRequest,
  OptimizationResult,
  ListedStorage,
  PaginatedListings,
} from '../types/index.js';
import { BackendError } from '../types/index.js';

/**
 * Client for interacting with the storage marketplace backend
 */
export class BackendClient {
  constructor(private baseUrl: string) {}

  /**
   * Get optimized storage purchase strategy
   *
   * @param params - Optimization request parameters
   * @returns Optimization result with operations and costs
   * @throws {BackendError} If the API request fails
   */
  async optimize(params: OptimizationRequest): Promise<OptimizationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/storage-optimizer/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new BackendError(
          `Optimization request failed: ${response.statusText}`,
          response.status,
          errorText,
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof BackendError) {
        throw error;
      }
      throw new BackendError(
        `Failed to connect to backend: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get marketplace listings
   *
   * @param params - Query parameters
   * @returns Paginated listings
   * @throws {BackendError} If the API request fails
   */
  async getListings(params: {
    seller?: string;
    cursor?: string;
    limit?: number;
  }): Promise<PaginatedListings> {
    try {
      const query = new URLSearchParams();
      if (params.seller) query.set('seller', params.seller);
      if (params.cursor) query.set('cursor', params.cursor);
      if (params.limit) query.set('limit', params.limit.toString());

      const url = `${this.baseUrl}/indexer/listings${query.toString() ? `?${query}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new BackendError(
          `Failed to fetch listings: ${response.statusText}`,
          response.status,
          errorText,
        );
      }

      const data = await response.json();

      // Transform the response to match our PaginatedListings type
      return {
        data: data.listings || data.data || [],
        nextCursor: data.nextCursor || null,
        hasMore: data.hasMore || false,
      };
    } catch (error) {
      if (error instanceof BackendError) {
        throw error;
      }
      throw new BackendError(
        `Failed to connect to backend: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get marketplace analytics (optional, for future use)
   *
   * @returns Marketplace analytics data
   * @throws {BackendError} If the API request fails
   */
  async getAnalytics(): Promise<unknown> {
    try {
      const response = await fetch(`${this.baseUrl}/indexer/analytics`);

      if (!response.ok) {
        throw new BackendError(
          `Failed to fetch analytics: ${response.statusText}`,
          response.status,
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof BackendError) {
        throw error;
      }
      throw new BackendError(
        `Failed to connect to backend: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
