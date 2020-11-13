const Discord = require('discord.js');
const _ = require('lodash');
const path = require('path');
require('dotenv').config();
const ytdl = require('ytdl-core');
const Client = require('pg').Client;
const ffmpeg = require('ffmpeg-static');
const child_process = require('child_process');

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
});

const cutClip = async (ytdlVid, startTime, endTime) => {
  return new Promise((res, rej) => {
    const bufs = [];
    ytdlVid.on('data', (buffer) => bufs.push(buffer));
    ytdlVid.on('end', () => {
      const OUTPUT_FILEPATH = Date.now() + '.mp4'; //TODO: delete this file after playing or put it in heroku temp area so that I dont care if its left around
      const videoAsBuffer = Buffer.concat(bufs);
      try {
        child_process.execFileSync(ffmpeg, ['-i', 'pipe:', '-ss', startTime, '-to', endTime, OUTPUT_FILEPATH], { input: videoAsBuffer });
      } catch (e) {
        if (e.status != 0) {
          console.log("Non zero status after cutting clip: " + e.status);
          return rej(e);
        }
      }
      console.log("Done cutting clip");
      return res(OUTPUT_FILEPATH);
    });
  });
};

const playClip = async (clip, connection, channel, options) => {
  const dispatcher = connection.play(clip, { volume: options.volume });
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

const normalizeClip = async (clip, startTime, endTime) => {
  console.log(clip)
  if (Array.isArray(clip)) {
    return normalizeClip(_.sample(clip));
  } else if (clip.startsWith('http')) {
    const vid = ytdl(clip);
    return endTime ? await cutClip(vid, startTime, endTime) : vid;
  } else {
    return path.join(__dirname, clip);
  }
}
const makeOptions = (config) => ({
  volume: parseFloat(config.volume, 10),
  startTime: config.starttime,
  endTime: config.endtime,
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
      prepare(await normalizeClip(choice, options.startTime, options.endTime), channel, options);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
