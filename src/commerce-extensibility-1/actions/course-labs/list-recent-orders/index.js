const { Core } = require('@adobe/aio-sdk');

const IMS_TOKEN_URL = 'https://ims-na1.adobelogin.com/ims/token/v3';

function normalizeScopes (raw) {
  if (!raw) return null;
  let arr = raw;
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (s.startsWith('[')) { try { arr = JSON.parse(s); } catch (_) { arr = s; } }
    if (typeof arr === 'string') arr = arr.split(/[\s,]+/);
  }
  if (Array.isArray(arr)) return arr.map((x) => String(x).trim()).filter(Boolean).join(',');
  return String(arr);
}

async function getToken (params) {
  const body = new URLSearchParams({
    client_id: params.IMS_OAUTH_S2S_CLIENT_ID,
    client_secret: params.IMS_OAUTH_S2S_CLIENT_SECRET,
    grant_type: 'client_credentials',
    scope: normalizeScopes(params.IMS_OAUTH_S2S_SCOPES),
  });
  const res = await fetch(IMS_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`IMS token failed: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

// Utility (NOT course material): list recent Commerce orders so we know which
// entity_ids to process. Safe to delete after diagnosis.
async function main (params) {
  const logger = Core.Logger('list-recent-orders', { level: params.LOG_LEVEL || 'info' });
  try {
    const token = await getToken(params);
    const base = params.COMMERCE_API_BASE_URL.replace(/\/$/, '');
    const pageSize = params.pageSize || 15;
    const q = [
      'searchCriteria[sortOrders][0][field]=entity_id',
      'searchCriteria[sortOrders][0][direction]=DESC',
      `searchCriteria[pageSize]=${pageSize}`,
      'searchCriteria[currentPage]=1',
    ].join('&');
    const url = `${base}/V1/orders?${q}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-api-key': params.IMS_OAUTH_S2S_CLIENT_ID,
        'x-gw-ims-org-id': params.IMS_OAUTH_S2S_ORG_ID,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      return { statusCode: 500, body: { error: `orders list failed: ${res.status}`, detail: await res.text() } };
    }
    const data = await res.json();
    const orders = (data.items || []).map((o) => ({
      entity_id: o.entity_id,
      increment_id: o.increment_id,
      status: o.status,
      grand_total: o.grand_total,
      updated_at: o.updated_at,
      created_at: o.created_at,
    }));
    return { statusCode: 200, body: { total: data.total_count, count: orders.length, orders } };
  } catch (error) {
    logger.error('list-recent-orders failed:', error.message);
    return { statusCode: 500, body: { error: error.message } };
  }
}

exports.main = main;
