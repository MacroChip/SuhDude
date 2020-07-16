const Discord = require('discord.js');
const _ = require('lodash');
const path = require('path');
require('dotenv').config()

const client = new Discord.Client();

client.on('ready', () => {
  console.log('** suh dude **');
})

const CHIP = '259184609051410432';
const WILL = '689128844015435792';
const RANDY = '260502471145816064';

const suhDuders = [CHIP, WILL, RANDY];

client.on("voiceStateUpdate", (oldState, newState) => {
  const suhDuderMoved = () => suhDuders.includes(newState.member.user.id);
  if (suhDuderMoved() && oldState.channelID !== newState.channelID) {
    const channel = newState.channel;
    if (!channel) {
      return;
    }
    channel.join().then(connection => {
      setTimeout(() => {
        const suhNumber = _.sample([1, 2, 3]);
        const clip = path.join(__dirname, `suh${suhNumber}.m4a`);
        console.log(clip);
        const dispatcher = connection.play(clip);
        dispatcher.on('finish', () => {
          setTimeout(() => {
            channel.leave();
            console.log(new Date(), 'suh');
          }, 1500);
        });
      }, 1000);
    }).catch(err => {
      console.log(err);
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
