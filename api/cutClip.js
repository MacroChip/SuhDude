const child_process = require('child_process');
const ffmpeg = require('ffmpeg-static');
const fs = require('fs/promises');

const cutClip = async (ytdlVid, startTime, endTime) => {
    return new Promise((res, rej) => {
        const bufs = [];
        ytdlVid.on('data', (buffer) => bufs.push(buffer));
        ytdlVid.on('end', async () => {
            console.log(`got to end of file`);
            const OUTPUT_FILEPATH = Date.now() + '.mp4'; //TODO: delete this file after playing or put it in heroku temp area so that I dont care if its left around
            const videoAsBuffer = Buffer.concat(bufs);
            if (endTime || startTime) {
                if (!endTime) {
                    endTime = "59:59";
                }
                if (!startTime) {
                    startTime = "0:0";
                }
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
            } else {
                await fs.writeFile(OUTPUT_FILEPATH, videoAsBuffer);
                console.log("Done writing uncut clip");
                return res(OUTPUT_FILEPATH);
            }
        });
    });
};

module.exports = {
    cutClip,
}
