/**
 * order-state-machine.ts
 * ─────────────────────
 * Defines the legal OrderStatus transitions for this platform.
 *
 * Usage:
 *   import { isValidTransition, assertValidTransition } from './order-state-machine';
 *
 *   // In admin order-update handlers:
 *   assertValidTransition(order.status, newStatus); // throws if illegal
 *
 * ponytail: plain Record lookup — no OOP state machine lib needed.
 */
import { OrderStatus } from '@prisma/client';

/**
 * Adjacency map: for each status, the set of statuses it may legally transition to.
 * DELIVERED, CANCELLED, REJECTED are terminal — no further transitions allowed.
 */
export const VALID_TRANSITIONS: Readonly<Record<OrderStatus, OrderStatus[]>> = {
  PENDING:          ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED:         ['PREPARING', 'CANCELLED'],
  PREPARING:        ['READY', 'CANCELLED'],
  READY:            ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED:        [],
  CANCELLED:        [],
  REJECTED:         [],
};

/** Returns true if transitioning from → to is a legal business operation. */
export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Throws a structured error (with .status = 409) if the transition is illegal.
 * Drop this into any admin/rider handler that changes order status.
 */
export function assertValidTransition(from: OrderStatus, to: OrderStatus): void {
  if (!isValidTransition(from, to)) {
    const err = new Error(
      `Invalid order status transition: ${from} → ${to}. ` +
      `Allowed next states: [${(VALID_TRANSITIONS[from] || []).join(', ') || 'none — terminal status'}].`
    );
    (err as any).status = 409;
    throw err;
  }
}

/**
 * Returns the allowed next statuses for a given status.
 * Useful for frontend display logic or validation messages.
 */
export function getAllowedTransitions(from: OrderStatus): OrderStatus[] {
  return [...(VALID_TRANSITIONS[from] || [])];
}

/** Returns true if the status is a terminal state (no further transitions). */
export function isTerminalStatus(status: OrderStatus): boolean {
  return VALID_TRANSITIONS[status]?.length === 0;
}
