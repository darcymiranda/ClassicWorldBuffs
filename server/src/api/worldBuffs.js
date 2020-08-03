const fetch = require('node-fetch');
const moment = require('moment-timezone');

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

  const yesterday = moment().utc().subtract(24, 'hour');

  const worldBuffsResponse = await fetch(`https://discord.com/api/v6/channels/697741587173605397/messages?limit=100`, {
    headers: {
      'authorization': auth
    }
  });

  if (!worldBuffsResponse.ok) {
    throw Error(`Could not fetch world buff info from discord; ${worldBuffsResponse.status}`);
  }

  const messages = await worldBuffsResponse.json();

  return messages
    .map(x => { return { ...x, timestamp: moment(x.timestamp) } })
    .filter(x => x.timestamp.isAfter(yesterday))
    .map(x => {

      const timestamp = x.timestamp.tz('America/New_York');

      const type = getType(x.content);
      if (type == null) {
        return null;
      }

      const when = adjustTimestamp(timestamp, x.content);
      if (when == null) {
        return null;
      }

      return {
        kind: toWorldBuffKind(type[0].toLowerCase()),
        when: when.toISOString(),
        meta: {
          timestamp: x.timestamp,
          original: x.content,
          username: `@${x.author.username}#${x.author.discriminator}`,
        }
      }
    })
    .filter(x => x)
    .sort((a, b) => a.when - b.when);
};

function getType(content) {
  // Sometimes people copy paste other people with discord timestamps
  if (content[0] === '[') {
    return null;
  }

  // Ignore people say when something was dropped
  if (content.includes('dropped')) {
    return null;
  }
  // Ignore these as they can provide everything needed to schedule a buff without actually intending to
  if (['planned', 'h0h', 'dropped'].some(ignore => content.toLowerCase().includes(ignore))) {
    return null;
  }

  // Too lazy to figure out how to ignore these fools
  if ([
    'I have a nef head to drop on CD',
    'until next'
  ].map(x => x.toLowerCase()).some(x => content.toLowerCase().includes(x))) {
    return null;
  }

  const type = content.match(wbTypeRegex);
  if (!type) {
    return null;
  }

  return type;
}

// Usually on tuesdays, someone creates a nicely formated post and just edits new drops in
function getInfoFromOrganizedPost(content) {

}

function adjustTimestamp(timestamp, content) {
  const inMinutes = getMinutes(content);
  if (inMinutes > 0) {
    return moment(timestamp).add(inMinutes, 'minute');
  }

  const time = getTime(content);
  if (time == null) {
    return;
  }

  const [, hours = 0, minutes = 0, ampm] = time[0].map(x => x == Number(x) ? Number(x) : !x ? x : x.toLowerCase());

  const hoursAdjusted = to24Clock(hours, timestamp, ampm);

  let timestampAdjusted = moment(timestamp).hour(hoursAdjusted);

  // Midnight edge case. This is a guess to most likely be correct
  if (!ampm) {
    const hoursDifference = timestamp.diff(timestampAdjusted, 'hours', true);
    if (Math.abs(hoursDifference) >= 6) {
      timestampAdjusted = timestampAdjusted.hour(hoursAdjusted - 12);
    }
  }

  const nextDay = hoursAdjusted > 0 && timestamp.isAfter(timestampAdjusted);

  return timestampAdjusted
    .add(nextDay ? 1 : 0, 'day')
    .minute(minutes ? minutes : 0);
}

function getOnCd(content) {
  if (content.toLowerCase().includes('on cd')) {

  }
}

function getMinutes(content) {
  const min = content.match(/in\s([0-9]{0,2})(?!.*(:))/i);
  console.log(min);
  if (min && min[1] !== undefined) {
    return parseInt(min[1]);
  }

  return null;
}

function getTime(content) {
  const date = [...content.matchAll(/([0-1]?[0-9]|2[0-3])[:h]?([0-5][0-9])?\s*([APap][Mm])?/g)];
  if (date.length > 0) {
    return date;
  }
  return null;
}

function to24Clock(hours, timestamp, ampm) {
  if (ampm) {
    return ampm === 'am' ? hours : hours + 12;
  }
  return ((hours < 12 && timestamp.hour() >= 12) ? hours + 12 : hours);
}

module.exports = {
  getWorldBuffs: getWorldBuffs,
};