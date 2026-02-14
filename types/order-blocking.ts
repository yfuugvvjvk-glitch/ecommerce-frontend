/**
 * Order Blocking Integration Types
 * 
 * These types define the data models for the order blocking functionality
 * that prevents order placement based on configurable block rules.
 */

/**
 * Delivery schedule configuration defining when orders can be placed
 * for specific delivery days.
 */
export interface DeliverySchedule {
  /** The day of the week for delivery (e.g., "Monday", "Tuesday") */
  deliveryDay: string;
  /** Time string in HH:MM format after which orders are blocked */
  blockOrdersAfter: string;
}

/**
 * A block rule configuration that defines blocking conditions.
 * Stored in SiteConfig table and fetched from the backend API.
 */
export interface BlockRule {
  /** Unique identifier for the block rule */
  id: string;
  /** Whether all new orders should be blocked */
  blockNewOrders: boolean;
  /** Human-readable reason for the blocking (optional) */
  blockReason: string | null;
  /** ISO 8601 date string indicating when blocking ends (null = permanent) */
  blockUntil: string | null;
  /** Array of payment method identifiers that are blocked (e.g., ["card", "cash"]) */
  blockedPaymentMethods: string[];
  /** Array of delivery method identifiers that are blocked (e.g., ["courier", "pickup"]) */
  blockedDeliveryMethods: string[];
  /** Optional delivery schedule configuration */
  deliverySchedule?: DeliverySchedule;
}

/**
 * Response from the blocking status API endpoint.
 * Contains all active block rules.
 */
export interface BlockingStatus {
  /** Whether any blocking is currently active */
  isBlocked: boolean;
  /** Array of active block rules */
  blockRules: BlockRule[];
}

/**
 * Information about delivery schedule blocking.
 */
export interface DeliveryScheduleBlock {
  /** The delivery day that is blocked */
  blockedDay: string;
  /** The cutoff time after which orders are blocked */
  cutoffTime: string;
  /** The next available delivery day */
  nextAvailableDay: string;
}

/**
 * Evaluated blocking result after processing all active block rules.
 * This is the computed state used by the UI to determine what to block.
 */
export interface EvaluatedBlocking {
  /** Whether all new orders should be blocked (OR of all rules) */
  blockNewOrders: boolean;
  /** Set of payment method identifiers that are blocked (union of all rules) */
  blockedPaymentMethods: Set<string>;
  /** Set of delivery method identifiers that are blocked (union of all rules) */
  blockedDeliveryMethods: Set<string>;
  /** The earliest blockUntil date across all rules (null if no rules have dates) */
  earliestBlockUntil: Date | null;
  /** Array of all block reasons from active rules */
  blockReasons: string[];
  /** Delivery schedule blocking information (if applicable) */
  deliveryScheduleBlocking: DeliveryScheduleBlock | null;
}
