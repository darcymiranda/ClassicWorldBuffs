const fetch = require('node-fetch');
const dayjs = require('dayjs');

const rends = [
  "rend",
  "WCB",
];
const onys = [
  "ony",
  "onyxia",
];
const nefs = [
  "nef",
  "nefarian",
];
const hakkars = [
  "hakar",
  "hakkar",
  "zg",
  "hoh",
  "heart",
];

const toWorldBuffKind = (wb) => {
  if (rends.includes(wb)) {
    return 'rend';
  }
  if (hakkars.includes(wb)) {
    return 'hakkar';
  }
  if (nefs.includes(wb)) {
    return 'nef';
  }
  if (onys.includes(wb)) {
    return 'ony';
  }
}

const wbTypeRegex = new RegExp([...rends, ...onys, ...nefs, ...hakkars].reduce((a, b) => `${a}|${b}`), 'i');

const getWorldBuffs = async (auth) => {

  const yesterday = dayjs().subtract(24, 'hour');

  const worldBuffsResponse = await fetch(`https://discord.com/api/v6/channels/697741587173605397/messages?limit=100`, {
    headers: {
      'authorization': auth
    }
  });

  const messages = await worldBuffsResponse.json();

  return messages.filter(x => dayjs(x.timestamp).isAfter(yesterday)).map(x => {

    // Ignore people say when something was dropped
    if (x.content.includes('dropped')) {
      return null;
    }

    // Ignore assholes
    if (['planned'].some(ignore => x.content.includes(ignore))) {
      return null;
    }

    if (x.test)
      console.log(x.timestamp);

    const type = x.content.match(wbTypeRegex);
    if (!type) {
      return null;
    }

    // TODO: Add support for "in x minutes" in the future, just drop for now
    if (x.content.match(/\b([0-9]{0,2})\s*(minutes|min|m)/i)) {
      return null;
    }

    const date = x.content.match(/([0-1]?[0-9]|2[0-3]):?([0-5][0-9])?/g);
    if (!date) {
      return null;
    }

    const serverTime = dayjs(new Date(x.timestamp).toLocaleString("en-US", { timeZone: "America/New_York" }));

    const [hours, minutes] = date
      .pop() // Always get last one because some people copy paste with timestamp in discord
      .split(':').map(Number);

    // Translate to 24 hour clock 
    const hoursAdjusted = (hours < 12 && serverTime.hour() >= 12) ? hours + 12 : hours;

    const nextDay = serverTime.isAfter(dayjs(serverTime).hour(hoursAdjusted));

    const when = serverTime
      .add(nextDay ? 1 : 0, 'day')
      .hour(hoursAdjusted - 1) // Subtract because of my discord using CST. TODO: Timezones, daylight saving and shit
      .minute(minutes ? minutes : 0);

    return {
      kind: toWorldBuffKind(type[0].toLowerCase()),
      when: when,
      meta: {
        timestamp: x.timestamp,
        original: x.content,
        username: `@${x.author.username}#${x.author.discriminator}`,
        debug: {
          hoursAdded: hoursAdjusted,
          minutesAdded: minutes,
        }
      }
    }
  }).filter(x => x).sort((a, b) => a.when - b.when);
}

module.exports = {
  getWorldBuffs: getWorldBuffs,
};