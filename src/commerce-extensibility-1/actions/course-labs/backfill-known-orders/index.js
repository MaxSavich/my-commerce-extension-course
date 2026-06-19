const { Core } = require('@adobe/aio-sdk');
const stateLib = require('@adobe/aio-lib-state');

// Utility (NOT course material): one-off backfill of the `known-order-ids` index
// from existing `order-*` keys. Needed because orders processed before the
// Activity 5-2 Step 2 consumer update have no index entry. Safe to delete after use.
async function main (params) {
  const logger = Core.Logger('backfill-known-orders', { level: params.LOG_LEVEL || 'info' });
  try {
    const state = await stateLib.init();

    // Collect all order-* keys.
    const orderKeys = [];
    const iterator = state.list({ match: 'order-*' });
    for await (const { keys: batch } of iterator) {
      orderKeys.push(...batch);
    }

    // order-<id> -> <id>
    const ids = orderKeys
      .map((k) => k.replace(/^order-/, ''))
      .filter(Boolean);

    // Merge with any existing index (don't clobber).
    let existing = [];
    const cur = await state.get('known-order-ids');
    if (cur && cur.value) {
      try { existing = JSON.parse(cur.value); } catch (_) { existing = []; }
    }
    const merged = Array.from(new Set([...existing.map(String), ...ids.map(String)]));

    await state.put('known-order-ids', JSON.stringify(merged), { ttl: 604800 });

    return {
      statusCode: 200,
      body: { backfilled: merged, fromOrderKeys: orderKeys, count: merged.length },
    };
  } catch (error) {
    logger.error('backfill failed:', error.message);
    return { statusCode: 500, body: { error: error.message } };
  }
}

exports.main = main;
