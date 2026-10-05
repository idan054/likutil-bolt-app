import { stateStore } from './lib/locker-core.mjs';
import { flushPendingNotes } from './lib/locker-order-notes.mjs';

// Keep WooCommerce latency and retries outside the customer-send job's time limit.
// Continue saving pending notes even when WhatsApp automation is switched off.
export const config = { schedule: '2-59/5 * * * *' };

export default async function handler() {
  const result = await flushPendingNotes(stateStore());
  return Response.json(result);
}
