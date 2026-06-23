const { Core } = require('@adobe/aio-sdk');

async function main (params) {
  const logger = Core.Logger('validate-product', {
    level: params.LOG_LEVEL || 'info',
  });
  const startMs = Date.now();

  try {
    const product = params.product || params.data?.product;

    if (!product) {
      logger.warn(JSON.stringify({
        action: 'validate-product', message: 'No product data in webhook payload',
        durationMs: Date.now() - startMs, timestamp: new Date().toISOString(),
      }));
      return {
        statusCode: 200,
        body: { op: 'success' },
      };
    }

    const sku = product.sku || 'unknown';
    const name = product.name != null ? String(product.name) : '';

    if (name.toLowerCase().includes('invalid')) {
      const message =
        'Product validation failed: product name must not contain the word "invalid".';
      logger.warn(JSON.stringify({
        action: 'validate-product', message: 'Validation rejected',
        sku, reason: message,
        durationMs: Date.now() - startMs, timestamp: new Date().toISOString(),
      }));
      return {
        statusCode: 200,
        body: { op: 'exception', message },
      };
    }

    logger.info(JSON.stringify({
      action: 'validate-product', message: 'Product passed validation',
      sku, durationMs: Date.now() - startMs, timestamp: new Date().toISOString(),
    }));

    return {
      statusCode: 200,
      body: { op: 'success' },
    };
  } catch (error) {
    logger.error(JSON.stringify({
      action: 'validate-product', message: 'Webhook handler failed',
      error: error.message, durationMs: Date.now() - startMs,
      timestamp: new Date().toISOString(),
    }));
    return {
      statusCode: 200,
      body: { op: 'success' },
    };
  }
}

exports.main = main;
