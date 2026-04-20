const { Mutex } = require('async-mutex');
const fs = require('fs');
const path = require('path');

const mutex = new Mutex();
const LOG_FILE = path.join(__dirname, 'updates.log');

// Idempotency cache: requestId -> result
const idempotencyCache = new Map();

// Current queue depth counter
let queueDepth = 0;

async function enqueue(requestId, operation, payloadSummary, fn) {
  if (requestId && idempotencyCache.has(requestId)) {
    return idempotencyCache.get(requestId);
  }

  queueDepth++;
  const release = await mutex.acquire();
  try {
    // Re-check after acquiring lock in case a concurrent call just set it
    if (requestId && idempotencyCache.has(requestId)) {
      return idempotencyCache.get(requestId);
    }

    const result = await fn();

    const logEntry = JSON.stringify({
      timestamp: new Date().toISOString(),
      requestId: requestId || null,
      operation,
      payloadSummary,
    }) + '\n';
    fs.appendFileSync(LOG_FILE, logEntry, 'utf8');

    if (requestId) {
      idempotencyCache.set(requestId, result);
    }

    return result;
  } finally {
    release();
    queueDepth--;
  }
}

function getQueueDepth() {
  return queueDepth;
}

module.exports = { enqueue, getQueueDepth };
