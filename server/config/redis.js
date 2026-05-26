const Redis = require('ioredis');

let redis;

const connectRedis = async () => {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
  });

  redis.on('connect', () => console.log('✅ Redis connected'));
  redis.on('error', (err) => console.error('❌ Redis error:', err.message));

  await redis.connect();
  return redis;
};

const getRedis = () => {
  if (!redis) throw new Error('Redis not initialised. Call connectRedis() first.');
  return redis;
};

module.exports = { connectRedis, getRedis };
