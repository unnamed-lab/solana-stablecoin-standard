/**
 * Shared constants for the SSS backend.
 */

/** BullMQ queue names */
export const WEBHOOK_QUEUE = 'webhooks';

/** Default webhook retry configuration */
export const WEBHOOK_RETRY_ATTEMPTS = 5;
export const WEBHOOK_RETRY_DELAY_MS = 1000;

/** Default pagination values */
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;
