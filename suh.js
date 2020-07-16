const Discord = require('discord.js');
const _ = require('lodash');

const client = new Discord.Client();

client.on('ready', () => {
  console.log('** suh dude **');
})

const CHIP = '259184609051410432';
const WILL = '689128844015435792';

client.on("voiceStateUpdate", (oldState, newState) => {
    const moved = (dude) => oldState.member.user.id === dude && newState.member.user.id === dude
    if ((moved(CHIP) || moved(WILL)) && oldState.channelID !== newState.channelID
    ) {
        const channel = newState.channel;
        channel.join().then(connection => {
          setTimeout(() => {
                const clip = `/c/discord/audio/suh${_.sample([1, 2, 3])}.m4a`;
                console.log(clip);
                const player = connection.play(clip);
                player.on('finish', () => {
                  channel.leave();
                  console.log(new Date(), 'suh');
                });
            }, 1000);
        }).catch(err => {
          console.log(err);
        });
    }
  }
);
  
const token = 'NzAzMDA4NzIyNDM1MzA5NjU5.XqIW9Q.YbwkHJ2jZeMBQxPCB60pVKOzCDI';
client.login(token);
