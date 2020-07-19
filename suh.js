const Discord = require('discord.js');
const _ = require('lodash');
const path = require('path');
require('dotenv').config();
const ytdl = require('ytdl-core');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

const client = new Discord.Client();

client.on('ready', () => {
  console.log('** suh dude **');
})

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

const normalizeClip = (clip) => {
  if (clip.startsWith('http')) {
    return ytdl(clip);
  } else {
    return path.join(__dirname, clip);
  }
}

client.on("voiceStateUpdate", async (oldState, newState) => {
  if (oldState.channelID !== newState.channelID) {
    const channel = newState.channel;
    if (!channel) {
      return;
    }
    const username = config.users[newState.member.user.id];
    if (username) {
      const choice = config.choiceByDiscordId[username];
      if (choice) {
        console.log(`Got choice ${choice} for ${username} with id ${newState.member.user.id}`);
        const clip = config.fileResolvers[choice];
        prepare(normalizeClip(clip), channel);
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
