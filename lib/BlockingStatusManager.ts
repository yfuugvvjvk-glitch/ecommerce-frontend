/**
 * BlockingStatusManager
 * 
 * Manages fetching and caching of order blocking status from the backend API.
 * Implements fail-open error handling to allow checkout on errors.
 */

import { BlockingStatus } from '@/types/order-blocking';

export class BlockingStatusManager {
  private currentStatus: BlockingStatus | null = null;
  private readonly apiEndpoint = '/api/public/order-blocking-status';

  /**
   * Fetches blocking status from the backend API.
   * Implements fail-open error handling: logs errors and returns empty blocking status.
   * 
   * @returns Promise resolving to BlockingStatus
   */
  async fetchBlockingStatus(): Promise<BlockingStatus> {
    try {
      const response = await fetch(this.apiEndpoint);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Validate response structure
      if (typeof data.isBlocked !== 'boolean' || !Array.isArray(data.blockRules)) {
        throw new Error('Invalid response structure from blocking status endpoint');
      }
      
      this.currentStatus = data;
      return data;
    } catch (error) {
      // Fail-open: log error and return empty blocking status
      console.error('Failed to fetch blocking status:', error);
      
      const emptyStatus: BlockingStatus = {
        isBlocked: false,
        blockRules: []
      };
      
      this.currentStatus = emptyStatus;
      return emptyStatus;
    }
  }

  /**
   * Gets the current cached blocking status.
   * 
   * @returns The cached BlockingStatus or null if not yet fetched
   */
  getCurrentStatus(): BlockingStatus | null {
    return this.currentStatus;
  }
}
