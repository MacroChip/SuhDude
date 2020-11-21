const Discord = require('discord.js');
require('dotenv').config({ path: '../.env' });
const Client = require('pg').Client;
const fs = require('fs/promises');

const client = new Discord.Client();

const db = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

db.connect();

client.on('ready', () => {
  console.log('bot up');
});

const playClip = async (clip, connection, channel, options) => {
  const dispatcher = connection.play(clip, { volume: options.volume });
  dispatcher.on('finish', () => {
    setTimeout(async () => {
      channel.leave();
      console.log(new Date(), 'finished');
      await fs.unlink(clip);
      console.log(`deleted`, clip);
    }, 1500);
  });
}

const prepare = (clip, channel, options) => {
  console.log(`preparing ${clip}`);
  channel.join().then(connection => {
    setTimeout(() => {
      playClip(clip, connection, channel, options);
    }, 1000);
  }).catch(err => {
    console.log(err);
  });
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
    console.log(`DB query`, result.rows);
    const resultRow = result.rows[0];
    console.log(`Got result row (minus clip) ${JSON.stringify({ ...resultRow, clip: undefined }, null, 2)} (user id ${newState.member.user.id})`);
    const clip = resultRow?.clip;
    if (clip) {
      const options = makeOptions(resultRow);
      const file = Date.now() + '.mp4';
      await fs.writeFile(file, clip);
      prepare(file, channel, options);
    } else {
      console.log(`User had no clip`);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
