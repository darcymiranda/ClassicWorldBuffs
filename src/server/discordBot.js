const Discord = require('discord.js');
const client = new Discord.Client();

require('dotenv-flow').config();

client.on('ready', () => {
    console.log("logged in");
});

console.log(process.env.DISCORD_APP_TOKEN);

client.login(process.env.DISCORD_APP_TOKEN);