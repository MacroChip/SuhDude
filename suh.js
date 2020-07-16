const Discord = require('discord.js');
const _ = require('lodash');
const path = require('path');
require('dotenv').config();

const client = new Discord.Client();

client.on('ready', () => {
  console.log('** suh dude **');
})

const CHIP = '259184609051410432';
const WILL = '689128844015435792';
const RANDY = '260502471145816064';
const HUBB = '358252088104452098';

const suhDuders = [CHIP, WILL, RANDY];
const gucciGangsters = [HUBB];

const playClip = (clip, connection, channel) => {
  console.log(clip);
  const dispatcher = connection.play(clip);
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

client.on("voiceStateUpdate", (oldState, newState) => {
  const suhDuderMoved = () => suhDuders.includes(newState.member.user.id);
  const gucciGangsterMoved = () => gucciGangsters.includes(newState.member.user.id);
  if (oldState.channelID !== newState.channelID) {
    const channel = newState.channel;
    if (!channel) {
      return;
    }
    if (suhDuderMoved()) {
      const suhNumber = _.sample([1, 2, 3]);
      const clip = path.join(__dirname, `suh${suhNumber}.m4a`);
      prepare(clip, channel);
    } else if (gucciGangsterMoved()) {
      const clip = path.join(__dirname, `gucciGang.ogg`);
      prepare(clip, channel);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
