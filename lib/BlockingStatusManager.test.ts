/**
 * Unit tests for BlockingStatusManager
 * 
 * Tests the fetch method, error handling, and caching functionality.
 */

import { BlockingStatusManager } from './BlockingStatusManager';
import { BlockingStatus } from '@/types/order-blocking';

// Mock fetch globally
global.fetch = jest.fn();

describe('BlockingStatusManager', () => {
  let manager: BlockingStatusManager;

  beforeEach(() => {
    manager = new BlockingStatusManager();
    jest.clearAllMocks();
  });

  describe('fetchBlockingStatus', () => {
    it('should fetch and return blocking status successfully', async () => {
      const mockResponse: BlockingStatus = {
        isBlocked: true,
        blockRules: [
          {
            id: 'rule1',
            blockNewOrders: true,
            blockReason: 'System maintenance',
            blockUntil: '2024-12-31T23:59:59Z',
            blockedPaymentMethods: ['card'],
            blockedDeliveryMethods: ['courier']
          }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await manager.fetchBlockingStatus();

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith('/api/public/order-blocking-status');
    });

    it('should cache the fetched status', async () => {
      const mockResponse: BlockingStatus = {
        isBlocked: false,
        blockRules: []
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await manager.fetchBlockingStatus();
      const cached = manager.getCurrentStatus();

      expect(cached).toEqual(mockResponse);
    });

    it('should handle HTTP errors and return empty blocking status', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const result = await manager.fetchBlockingStatus();

      expect(result).toEqual({
        isBlocked: false,
        blockRules: []
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch blocking status:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle network errors and return empty blocking status', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await manager.fetchBlockingStatus();

      expect(result).toEqual({
        isBlocked: false,
        blockRules: []
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch blocking status:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle invalid response structure and return empty blocking status', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'data' })
      });

      const result = await manager.fetchBlockingStatus();

      expect(result).toEqual({
        isBlocked: false,
        blockRules: []
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch blocking status:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle missing blockRules array and return empty blocking status', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ isBlocked: true })
      });

      const result = await manager.fetchBlockingStatus();

      expect(result).toEqual({
        isBlocked: false,
        blockRules: []
      });
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should update cached status on error to empty status', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await manager.fetchBlockingStatus();
      const cached = manager.getCurrentStatus();

      expect(cached).toEqual({
        isBlocked: false,
        blockRules: []
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getCurrentStatus', () => {
    it('should return null when no status has been fetched', () => {
      const result = manager.getCurrentStatus();
      expect(result).toBeNull();
    });

    it('should return cached status after successful fetch', async () => {
      const mockResponse: BlockingStatus = {
        isBlocked: true,
        blockRules: [
          {
            id: 'rule1',
            blockNewOrders: false,
            blockReason: null,
            blockUntil: null,
            blockedPaymentMethods: ['cash'],
            blockedDeliveryMethods: []
          }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await manager.fetchBlockingStatus();
      const cached = manager.getCurrentStatus();

      expect(cached).toEqual(mockResponse);
    });

    it('should return empty status after failed fetch', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await manager.fetchBlockingStatus();
      const cached = manager.getCurrentStatus();

      expect(cached).toEqual({
        isBlocked: false,
        blockRules: []
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty blockRules array', async () => {
      const mockResponse: BlockingStatus = {
        isBlocked: false,
        blockRules: []
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await manager.fetchBlockingStatus();

      expect(result).toEqual(mockResponse);
    });

    it('should handle multiple block rules', async () => {
      const mockResponse: BlockingStatus = {
        isBlocked: true,
        blockRules: [
          {
            id: 'rule1',
            blockNewOrders: true,
            blockReason: 'Maintenance',
            blockUntil: '2024-12-31T23:59:59Z',
            blockedPaymentMethods: ['card'],
            blockedDeliveryMethods: ['courier']
          },
          {
            id: 'rule2',
            blockNewOrders: false,
            blockReason: 'Holiday',
            blockUntil: '2024-12-25T23:59:59Z',
            blockedPaymentMethods: ['cash'],
            blockedDeliveryMethods: ['pickup']
          }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await manager.fetchBlockingStatus();

      expect(result).toEqual(mockResponse);
      expect(result.blockRules).toHaveLength(2);
    });

    it('should handle null values in block rules', async () => {
      const mockResponse: BlockingStatus = {
        isBlocked: false,
        blockRules: [
          {
            id: 'rule1',
            blockNewOrders: false,
            blockReason: null,
            blockUntil: null,
            blockedPaymentMethods: [],
            blockedDeliveryMethods: []
          }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await manager.fetchBlockingStatus();

      expect(result).toEqual(mockResponse);
    });
  });
});
