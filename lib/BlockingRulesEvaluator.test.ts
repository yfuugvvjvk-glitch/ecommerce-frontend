/**
 * BlockingRulesEvaluator Tests
 * 
 * Unit tests for the BlockingRulesEvaluator class.
 */

import { describe, it, expect } from 'vitest';
import { BlockingRulesEvaluator } from './BlockingRulesEvaluator';
import { BlockRule } from '@/types/order-blocking';

describe('BlockingRulesEvaluator', () => {
  const evaluator = new BlockingRulesEvaluator();

  describe('evaluate', () => {
    it('should return empty result for empty rules array', () => {
      const result = evaluator.evaluate([]);

      expect(result.blockNewOrders).toBe(false);
      expect(result.blockedPaymentMethods.size).toBe(0);
      expect(result.blockedDeliveryMethods.size).toBe(0);
      expect(result.earliestBlockUntil).toBeNull();
      expect(result.blockReasons).toEqual([]);
      expect(result.deliveryScheduleBlocking).toBeNull();
    });

    it('should evaluate single rule correctly', () => {
      const rule: BlockRule = {
        id: 'rule1',
        blockNewOrders: true,
        blockReason: 'System maintenance',
        blockUntil: '2024-12-31T23:59:59Z',
        blockedPaymentMethods: ['card', 'cash'],
        blockedDeliveryMethods: ['courier'],
      };

      const result = evaluator.evaluate([rule]);

      expect(result.blockNewOrders).toBe(true);
      expect(result.blockedPaymentMethods).toEqual(new Set(['card', 'cash']));
      expect(result.blockedDeliveryMethods).toEqual(new Set(['courier']));
      expect(result.earliestBlockUntil).toEqual(new Date('2024-12-31T23:59:59Z'));
      expect(result.blockReasons).toEqual(['System maintenance']);
    });

    it('should apply OR logic for blockNewOrders', () => {
      const rules: BlockRule[] = [
        {
          id: 'rule1',
          blockNewOrders: false,
          blockReason: null,
          blockUntil: null,
          blockedPaymentMethods: [],
          blockedDeliveryMethods: [],
        },
        {
          id: 'rule2',
          blockNewOrders: true,
          blockReason: 'Holiday',
          blockUntil: null,
          blockedPaymentMethods: [],
          blockedDeliveryMethods: [],
        },
      ];

      const result = evaluator.evaluate(rules);

      expect(result.blockNewOrders).toBe(true);
    });

    it('should compute union of blocked payment methods', () => {
      const rules: BlockRule[] = [
        {
          id: 'rule1',
          blockNewOrders: false,
          blockReason: null,
          blockUntil: null,
          blockedPaymentMethods: ['card', 'cash'],
          blockedDeliveryMethods: [],
        },
        {
          id: 'rule2',
          blockNewOrders: false,
          blockReason: null,
          blockUntil: null,
          blockedPaymentMethods: ['cash', 'bank_transfer'],
          blockedDeliveryMethods: [],
        },
      ];

      const result = evaluator.evaluate(rules);

      expect(result.blockedPaymentMethods).toEqual(
        new Set(['card', 'cash', 'bank_transfer'])
      );
    });

    it('should compute union of blocked delivery methods', () => {
      const rules: BlockRule[] = [
        {
          id: 'rule1',
          blockNewOrders: false,
          blockReason: null,
          blockUntil: null,
          blockedPaymentMethods: [],
          blockedDeliveryMethods: ['courier', 'pickup'],
        },
        {
          id: 'rule2',
          blockNewOrders: false,
          blockReason: null,
          blockUntil: null,
          blockedPaymentMethods: [],
          blockedDeliveryMethods: ['pickup', 'scheduled'],
        },
      ];

      const result = evaluator.evaluate(rules);

      expect(result.blockedDeliveryMethods).toEqual(
        new Set(['courier', 'pickup', 'scheduled'])
      );
    });

    it('should find earliest blockUntil date', () => {
      const rules: BlockRule[] = [
        {
          id: 'rule1',
          blockNewOrders: false,
          blockReason: null,
          blockUntil: '2024-12-31T23:59:59Z',
          blockedPaymentMethods: [],
          blockedDeliveryMethods: [],
        },
        {
          id: 'rule2',
          blockNewOrders: false,
          blockReason: null,
          blockUntil: '2024-12-15T12:00:00Z',
          blockedPaymentMethods: [],
          blockedDeliveryMethods: [],
        },
        {
          id: 'rule3',
          blockNewOrders: false,
          blockReason: null,
          blockUntil: '2024-12-25T00:00:00Z',
          blockedPaymentMethods: [],
          blockedDeliveryMethods: [],
        },
      ];

      const result = evaluator.evaluate(rules);

      expect(result.earliestBlockUntil).toEqual(new Date('2024-12-15T12:00:00Z'));
    });

    it('should collect all block reasons', () => {
      const rules: BlockRule[] = [
        {
          id: 'rule1',
          blockNewOrders: false,
          blockReason: 'Maintenance',
          blockUntil: null,
          blockedPaymentMethods: [],
          blockedDeliveryMethods: [],
        },
        {
          id: 'rule2',
          blockNewOrders: false,
          blockReason: 'Holiday',
          blockUntil: null,
          blockedPaymentMethods: [],
          blockedDeliveryMethods: [],
        },
        {
          id: 'rule3',
          blockNewOrders: false,
          blockReason: null,
          blockUntil: null,
          blockedPaymentMethods: [],
          blockedDeliveryMethods: [],
        },
      ];

      const result = evaluator.evaluate(rules);

      expect(result.blockReasons).toEqual(['Maintenance', 'Holiday']);
    });

    it('should handle rules with null blockUntil', () => {
      const rules: BlockRule[] = [
        {
          id: 'rule1',
          blockNewOrders: false,
          blockReason: null,
          blockUntil: null,
          blockedPaymentMethods: [],
          blockedDeliveryMethods: [],
        },
        {
          id: 'rule2',
          blockNewOrders: false,
          blockReason: null,
          blockUntil: null,
          blockedPaymentMethods: [],
          blockedDeliveryMethods: [],
        },
      ];

      const result = evaluator.evaluate(rules);

      expect(result.earliestBlockUntil).toBeNull();
    });

    it('should handle mixed null and non-null blockUntil dates', () => {
      const rules: BlockRule[] = [
        {
          id: 'rule1',
          blockNewOrders: false,
          blockReason: null,
          blockUntil: null,
          blockedPaymentMethods: [],
          blockedDeliveryMethods: [],
        },
        {
          id: 'rule2',
          blockNewOrders: false,
          blockReason: null,
          blockUntil: '2024-12-20T10:00:00Z',
          blockedPaymentMethods: [],
          blockedDeliveryMethods: [],
        },
      ];

      const result = evaluator.evaluate(rules);

      expect(result.earliestBlockUntil).toEqual(new Date('2024-12-20T10:00:00Z'));
    });
  });

  describe('formatBlockDuration', () => {
    it('should return "Permanent" for null dates', () => {
      const result = evaluator.formatBlockDuration(null);
      expect(result).toBe('Permanent');
    });

    it('should format dates within 30 days as "X zile"', () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days from now
      
      const result = evaluator.formatBlockDuration(futureDate);
      
      expect(result).toMatch(/^\d+ zile \(până la .+\)$/);
      expect(result).toContain('zile');
    });

    it('should format dates beyond 30 days as "X luni"', () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days from now
      
      const result = evaluator.formatBlockDuration(futureDate);
      
      expect(result).toMatch(/^\d+ luni \(până la .+\)$/);
      expect(result).toContain('luni');
    });

    it('should include the specific blockUntil date and time', () => {
      const blockUntil = new Date('2024-12-31T23:59:00');
      
      const result = evaluator.formatBlockDuration(blockUntil);
      
      expect(result).toContain('până la');
      expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}/); // Date format
      expect(result).toMatch(/\d{2}:\d{2}/); // Time format
    });

    it('should round up days correctly', () => {
      const now = new Date();
      // 1.5 days from now should round up to 2 days
      const futureDate = new Date(now.getTime() + 1.5 * 24 * 60 * 60 * 1000);
      
      const result = evaluator.formatBlockDuration(futureDate);
      
      expect(result).toMatch(/^2 zile/);
    });

    it('should round up months correctly', () => {
      const now = new Date();
      // 35 days from now should round up to 2 months (35/30 = 1.17 -> 2)
      const futureDate = new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000);
      
      const result = evaluator.formatBlockDuration(futureDate);
      
      expect(result).toMatch(/^2 luni/);
    });

    it('should handle exactly 30 days as "30 zile"', () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const result = evaluator.formatBlockDuration(futureDate);
      
      expect(result).toMatch(/^30 zile/);
    });

    it('should handle exactly 31 days as "2 luni"', () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);
      
      const result = evaluator.formatBlockDuration(futureDate);
      
      expect(result).toMatch(/^2 luni/);
    });
  });
});
