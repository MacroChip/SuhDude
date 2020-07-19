const Discord = require('discord.js');
const _ = require('lodash');
const path = require('path');
require('dotenv').config();
const ytdl = require('ytdl-core');

const client = new Discord.Client();

client.on('ready', () => {
  console.log('** suh dude **');
})

const CHIP = '259184609051410432';
const WILL = '689128844015435792';
const RANDY = '260502471145816064';
const HUBB = '358252088104452098';
const KEVIN = '689121444428513363';
const KYLE = '420806317939228673';
const BEN = '184417096757673984';
const HARHAUSEN = '688133957979472060';
const JOEL = '322203270086918144';
const AMY = '383662184292417536';
const SCOTT = '691635103314608158';
const BRIGHT = '689118702016135209';
const ROB = '689129765042782284';

const fileResolvers = {
  'suhDude': async () => path.join(__dirname, `suh${_.sample([1, 2, 3])}.m4a`),
  'gucciGang': async () => path.join(__dirname, `gucciGang.ogg`),
  'ackshually': async () => ytdl(`https://www.youtube.com/watch?v=yoKwAK7fnNA`),
  'dillydilly': async () => ytdl(`https://www.youtube.com/watch?v=d7Vt3X4Jhsk`),
  'cena': async () => ytdl(`https://www.youtube.com/watch?v=abiNbJDpfp8`), //loud af
  'weed': async () => ytdl(`https://www.youtube.com/watch?v=2fbNyyrPrco`),
  'tacobell': async () => ytdl(`https://www.youtube.com/watch?v=Hx6n8Z-DbTk`),
  'shirley': async () => ytdl(`https://www.youtube.com/watch?v=WGU77QI0-9s`),
  'pee': async () => ytdl(`https://www.youtube.com/watch?v=SJlolhuyMKY`),
  'coffee': async () => ytdl(`https://www.youtube.com/watch?v=UdpMWbsdno0`),
  'pickle': async () => ytdl(`https://www.youtube.com/watch?v=ML5UI-0JS_Q`),
  'gotem': async () => ytdl(`https://www.youtube.com/watch?v=wnedkVrgFF0`),
  'asmr': async () => ytdl(`https://www.youtube.com/watch?v=F25pc-hb4PQ`),
}

const choiceByDiscordId = {}
choiceByDiscordId[CHIP] = 'ackshually'
choiceByDiscordId[WILL] = 'suhDude'
choiceByDiscordId[RANDY] = 'suhDude'
choiceByDiscordId[HUBB] = 'gucciGang'
choiceByDiscordId[BEN] = 'cena'
choiceByDiscordId[KEVIN] = 'shirley'
choiceByDiscordId[KYLE] = 'pee'
choiceByDiscordId[HARHAUSEN] = 'dillydilly'
choiceByDiscordId[JOEL] = 'pickle'
choiceByDiscordId[AMY] = 'tacobell'
choiceByDiscordId[SCOTT] = 'gotem'
choiceByDiscordId[BRIGHT] = 'weed'
choiceByDiscordId[ROB] = 'asmr'

const playClip = async (clip, connection, channel) => {
  const dispatcher = connection.play(clip);
  dispatcher.setVolume(0.7)
  dispatcher.on('finish', () => {
    setTimeout(() => {
      channel.leave();
      console.log(new Date(), 'finished');
    }, 1500);
  });
}

const prepare = (clip, channel) => {
  channel.join().then(connection => {
    setTimeout(() => {
      playClip(clip, connection, channel);
    }, 1000);
  }).catch(err => {
    console.log(err);
  });
}

client.on("voiceStateUpdate", async (oldState, newState) => {
  if (oldState.channelID !== newState.channelID) {
    const channel = newState.channel;
    if (!channel) {
      return;
    }
    const choice = choiceByDiscordId[newState.member.user.id];
    if (choice) {
      console.log(`Got choice ${choice} for ${newState.member.user.id}`);
      const clip = await fileResolvers[choice]();
      prepare(clip, channel);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
