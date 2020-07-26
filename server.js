const path = require('path');
const fs = require('fs');
const app = require('fastify')({
  logger: true,
});
const { getWorldBuffs } = require('./src/api/worldBuffs');
const cache = require('abstract-cache')({ useAwait: true });

require('dotenv-flow').config();

app.register(require('fastify-static'), {
  root: path.join(__dirname, '../build')
});

app.register(require('fastify-cors'), {
  origin: (origin, cb) => {
    if (origin === undefined || /localhost/.test(origin)) {
      cb(null, true);
      return
    }
    cb(new Error("Not allowed"), false);
  }
});

const cacheDuration = 60 * 1000;

app.get('/api/worldBuffs', async (request, reply) => {
  const cached = await cache.get('worldBuffs');
  if (cached) {
    return cached.item;
  }

  const worldBuffs = await getWorldBuffs(process.env.DISCORD_AUTH);
  cache.set('worldBuffs', worldBuffs, cacheDuration);
  return worldBuffs;
});

app.get('*', async (request, reply) => {
  const stream = fs.createReadStream(__dirname + '../build/index.html');
  reply.type('text/html').send(stream);
});

app.listen(process.env.PORT || 80, function (err, address) {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
  app.log.info(`server listening on ${address}`)
});