const cutClip = require('./cutClip').cutClip;
const fs = require('fs/promises');
const ytdl = require('ytdl-core');

const changeUserConfig = async (db, body) => {
    let ytdlVid;
    try {
        ytdlVid = ytdl(body.url);
    } catch (e) {
        return { error: "Error in ytdl" + JSON.stringify(e) }; //why is e an empty object??
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

module.exports = {
    changeUserConfig,
}
