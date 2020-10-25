const Discord = require('discord.js');
const _ = require('lodash');
const path = require('path');
require('dotenv').config();
const ytdl = require('ytdl-core');
const Client = require('pg').Client;

const client = new Discord.Client();

const db = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

db.connect();

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
const makeOptions = (config) => ({
  volume: parseFloat(config.volume, 10),
});

client.on("voiceStateUpdate", async (oldState, newState) => {
  if (oldState.channelID !== newState.channelID) {
    const channel = newState.channel;
    if (!channel) {
      return;
    }
    const result = await db.query(`SELECT * FROM config WHERE ID = $1;`, [newState.member.user.id]);
    console.log(`DB query`, result);
    const resultRow = result.rows[0];
    if (resultRow) {
      const choice = resultRow.url;
      console.log(`Got result row ${JSON.stringify(resultRow, null, 2)} (user id ${newState.member.user.id})`);
      const options = makeOptions(resultRow);
      prepare(normalizeClip(choice), channel, options);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
