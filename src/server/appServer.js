const app = require('fastify')({
  logger: true,
});
const { getWorldBuffs } = require('./worldBuffs');
const cache = require('abstract-cache')({ useAwait: true });
 
require('dotenv-flow').config();

app.register(require('fastify-cors'), {
  origin: (origin, cb) => {
    if (origin === undefined || /localhost/.test(origin)) {
      cb(null, true);
      return
    }
    cb(new Error("Not allowed"), false);
  }
})

const cacheDuration = 60 * 1000;

app.get('/worldBuffs', async (request, reply) => {
  const cached = await cache.get('worldBuffs');
  if (cached) {
    return cached.item;
  }

  const worldBuffs = await getWorldBuffs(process.env.DISCORD_AUTH);
  cache.set('worldBuffs', worldBuffs, cacheDuration);
  return worldBuffs;
});


app.listen(5001, function (err, address) {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
  app.log.info(`server listening on ${address}`)
});