const cutClip = require('./cutClip').cutClip;
const fs = require('fs/promises');
const ytdl = require('ytdl-core');

const changeUserConfig = async (db, body) => {
    if (!await clipIsValidLength(body.url, body.startTime, body.endTime)) {
        return Promise.reject({ error: `Clip needs to be less than ${process.env.LIMIT_IN_MS / 1000} seconds. Use the start and end time boxes to crop it.` });
    }
    let ytdlVid;
    try {
        ytdlVid = ytdl(body.url, { filter: 'audioonly', quality: 'highestaudio' });
    } catch (e) {
        console.log(`ytdl error`, e);
        return { error: "Error in ytdl: " + e.message };
    }
    const clip = await cutClip(ytdlVid, body.startTime, body.endTime);
    console.log(`done cutting clip`);
    const videoBinary = "\\x" + await fs.readFile(clip, 'hex');
    return db.query('INSERT INTO config VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO UPDATE SET name = $2, url = $3, volume = $4, startTime = $5, endTime = $6, clip = $7;', [body.id, body.name, body.url, body.volume, body.startTime, body.endTime, videoBinary])
        .then(response => {
            for (let row of response.rows) {
                console.log(JSON.stringify(row));
            }
            console.log(`${body.name} (ID ${body.id}) changed to ${body.url}`);
            return { success: `${body.name} (ID ${body.id}) changed to ${body.url}` };
        })
        .catch(err => {
            console.log(`Error making change`, err);
            return { error: `Error` };
        });
};

const clipIsValidLength = async (url, startTime, endTime) => {
    const limitInSeconds = (process.env.LIMIT_IN_MS || 5000) / 1000;
    //manually eneter start and end makes it ok
    if (endTime && startTime) {
        const endTimeInSeconds = durationStringToLengthSeconds(endTime);
        const startTimeInSeconds = durationStringToLengthSeconds(startTime);
        if (endTimeInSeconds - startTimeInSeconds <= limitInSeconds) {
            return true;
        }
    }
    //video length already makes it ok without cropping
    const lengthSeconds = (await ytdl.getBasicInfo(url)).player_response.videoDetails.lengthSeconds;
    if (lengthSeconds <= limitInSeconds) {
        return true;
    }
    //has a start time such that end of video results in ok length
    if (startTime) {
        const startTimeInSeconds = durationStringToLengthSeconds(startTime);
        if (lengthSeconds - startTimeInSeconds <= limitInSeconds) {
            return true;
        }
    }
    if (endTime) {
        const endTimeInSeconds = durationStringToLengthSeconds(endTime);
        if (endTimeInSeconds <= limitInSeconds) {
            return true;
        }
    }
    return false;
};

const durationStringToLengthSeconds = (durationString) => +(durationString.split(':').reduce((acc, time) => (60 * acc) + +time));

module.exports = {
    changeUserConfig,
}
