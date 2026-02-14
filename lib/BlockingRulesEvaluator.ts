/**
 * BlockingRulesEvaluator
 * 
 * Evaluates multiple block rules and combines them into a single EvaluatedBlocking result.
 * Implements union logic for blocked methods and OR logic for blockNewOrders.
 */

import { BlockRule, EvaluatedBlocking } from '@/types/order-blocking';

export class BlockingRulesEvaluator {
  /**
   * Evaluates all block rules and returns combined result.
   * 
   * Logic:
   * - Union of all blocked payment methods across all rules
   * - Union of all blocked delivery methods across all rules
   * - OR logic for blockNewOrders (true if ANY rule blocks)
   * - Earliest blockUntil date across all rules
   * - All block reasons from all rules
   * 
   * @param blockRules Array of block rules to evaluate
   * @returns EvaluatedBlocking result
   */
  evaluate(blockRules: BlockRule[]): EvaluatedBlocking {
    // Initialize result with empty values
    const result: EvaluatedBlocking = {
      blockNewOrders: false,
      blockedPaymentMethods: new Set<string>(),
      blockedDeliveryMethods: new Set<string>(),
      earliestBlockUntil: null,
      blockReasons: [],
      deliveryScheduleBlocking: null,
    };

    // Handle empty rules array
    if (blockRules.length === 0) {
      return result;
    }

    // Process each rule
    for (const rule of blockRules) {
      // OR logic: if ANY rule blocks new orders, all orders are blocked
      if (rule.blockNewOrders) {
        result.blockNewOrders = true;
      }

      // Union logic: combine all blocked payment methods
      for (const method of rule.blockedPaymentMethods) {
        result.blockedPaymentMethods.add(method);
      }

      // Union logic: combine all blocked delivery methods
      for (const method of rule.blockedDeliveryMethods) {
        result.blockedDeliveryMethods.add(method);
      }

      // Find earliest blockUntil date
      if (rule.blockUntil) {
        const blockUntilDate = new Date(rule.blockUntil);
        if (!result.earliestBlockUntil || blockUntilDate < result.earliestBlockUntil) {
          result.earliestBlockUntil = blockUntilDate;
        }
      }

      // Collect all block reasons
      if (rule.blockReason) {
        result.blockReasons.push(rule.blockReason);
      }
    }

    return result;
  }

  /**
   * Formats a block duration into a human-readable string.
   *
   * Rules:
   * - Returns "Permanent" for null dates
   * - Returns "X zile" for dates within 30 days
   * - Returns "X luni" for dates beyond 30 days (rounded up)
   * - Includes the specific blockUntil date and time in output
   *
   * @param blockUntil The date until which blocking is active, or null for permanent
   * @returns Formatted duration string
   */
  formatBlockDuration(blockUntil: Date | null): string {
    // Handle permanent blocking (null date)
    if (blockUntil === null) {
      return 'Permanent';
    }

    // Calculate difference from now
    const now = new Date();
    const diffMs = blockUntil.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Format the blockUntil date and time
    const formattedDate = blockUntil.toLocaleString('ro-RO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Within 30 days: show days
    if (diffDays <= 30) {
      return `${diffDays} zile (până la ${formattedDate})`;
    }

    // Beyond 30 days: show months (rounded up)
    const diffMonths = Math.ceil(diffDays / 30);
    return `${diffMonths} luni (până la ${formattedDate})`;
  }
}
