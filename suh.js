const Discord = require('discord.js');
const _ = require('lodash');
const path = require('path');
require('dotenv').config();
const ytdl = require('ytdl-core');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync(process.env.CONFIG_FILE, 'utf8'));
const COMMONS_CHANNEL_ID = '689101517503856778';

const client = new Discord.Client();

client.on('ready', () => {
  console.log('** suh dude **');
})

const playClip = async (clip, connection, channel, options) => {
  const dispatcher = connection.play(clip);
  dispatcher.setVolume(options.volume)
  dispatcher.on('finish', () => {
    setTimeout(() => {
      channel.leave();
      console.log(new Date(), 'finished');
    }, 1500);
  });
}

const prepare = (clip, channel, options) => {
  channel.join().then(connection => {
    setTimeout(() => {
      playClip(clip, connection, channel, options);
    }, 1000);
  }).catch(err => {
    console.log(err);
  });
}

const normalizeClip = (clip) => {
  console.log(clip)
  if (Array.isArray(clip)) {
    return normalizeClip(_.sample(clip));
  } else if (clip.startsWith('http')) {
    return ytdl(clip);
  } else {
    return path.join(__dirname, clip);
  }
}

const makeOptions = (choice) => {
  return {
    volume: choice === 'cena' ? 0.2 : 0.7
  }
}

const kevinInCommons = (username, channelID) => {
  if (channelID !== COMMONS_CHANNEL_ID) {
    return true
  } else {
    return username === 'KEVIN'
  }
}

client.on("voiceStateUpdate", async (oldState, newState) => {
  if (oldState.channelID !== newState.channelID) {
    const channel = newState.channel;
    if (!channel) {
      return;
    }
    const username = config.users[newState.member.user.id];
    if (username && kevinInCommons(username, newState.channelID)) {
      const choice = config.choiceByDiscordId[username];
      if (choice) {
        console.log(`Got choice ${choice} for ${username} (user id ${newState.member.user.id})`);
        const clip = config.fileResolvers[choice];
        const options = makeOptions(choice);
        prepare(normalizeClip(clip), channel, options);
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
