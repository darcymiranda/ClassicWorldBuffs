const Discord = require('discord.js');
const { getWorldBuffs } = require('../api/worldBuffs');
const moment = require('moment-timezone');
require('dotenv-flow').config();

const testChannel = '736808196127195216';
const worldBuffsChannel = '715234730962059334';

const interval = 3;

const colorByWbKind = {
    'ony': '#B54055',
    'nef': '#B54055',
    'hakkar': '#77CBB9',
    'rend': '#75B8C8'
};
const iconByWbKind = {
    'ony': 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_head_dragon_01.jpg',
    'nef': 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_head_dragon_01.jpg',
    'hakkar': 'https://wow.zamimg.com/images/wow/icons/large/ability_creature_poison_05.jpg',
    'rend': 'https://wow.zamimg.com/images/wow/icons/large/spell_arcane_teleportorgrimmar.jpg',
};

console.log(`Started at interval ${interval} min`);

setInterval(async () => {
    const now = moment();
    const client = new Discord.Client();
    client.login(process.env.DISCORD_APP_TOKEN);
    client.once('ready', async () => {
        const worldBuffs = await getWorldBuffs(process.env.DISCORD_AUTH);

        const messages = worldBuffs
            .filter(x => x.meta.timestamp.isSameOrAfter(now.subtract(interval, 'minutes')))
            .map(formatMessage);

        messages.forEach(x => client.channels.cache.get(worldBuffsChannel).send(x));

        console.log("Sent ", messages.length);
    });
}, interval * 60 * 1000);


const formatMessage = (wb) => {
    const title = wb.kind.charAt(0).toUpperCase() + wb.kind.slice(1);
    const formatedDate = moment(wb.when).tz('America/New_York').calendar({
        sameDay: '[Today] h:mm A',
        nextDay: '[Tomorrow] h:mm A',
    });
    return new Discord.MessageEmbed()
        .setColor(colorByWbKind[wb.kind])
        .setTitle(`${title} Scheduled`)
        .setURL('https://classic-world-buffs.herokuapp.com/')
        .setAuthor(`World Buffs - ${title}`, iconByWbKind[wb.kind], 'https://classic-world-buffs.herokuapp.com/')
        .setThumbnail(iconByWbKind[wb.kind])
        .addFields(
            { name: 'When', value: `${formatedDate} server time`, inline: true },
            { name: '\u200B', value: '\u200B' },
            { name: 'Confirmed by', value: wb.meta.username, inline: true },
            { name: 'Timestamp', value: moment(wb.meta.timestamp).toISOString(), inline: true },
            { name: 'Original message', value: truncate(wb.meta.original, 100), inline: true },
        )
        .setTimestamp()
        .setFooter("This data is extracted from user based conversation in Earthfury Discord and may be inaccurate.");
};

const truncate = (input, maxLength) => input && input.length > maxLength ? `${input.substring(0, maxLength)}...` : input;