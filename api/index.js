const Koa = require('koa');
const Router = require('koa-router');
const koaStatic = require('koa-static');
require('dotenv').config({ path: '../.env' });
const join = require('path').join;
const cors = require('@koa/cors');
const mount = require('koa-mount');
const bodyparser = require('koa-bodyparser');
const Client = require('pg').Client;
const cutClip = require('./cutClip').cutClip;
const fs = require('fs/promises');
const ytdl = require('ytdl-core');

const app = new Koa();
const router = new Router();

if (!process.env.PASSWORD) {
    throw "Need to provide a passphrase in PASSWORD environment variable";
}

const db = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

db.connect();

db.query(`CREATE TABLE IF NOT EXISTS config (
    id varchar(64) PRIMARY KEY,
    name varchar(64) NOT NULL,
    url varchar(200) NOT NULL,
    volume varchar(10) NOT NULL
)`)
    .then(res => console.log(`Made or found config table`))
    .catch(err => console.log(`Error making config table`, err));

db.query(`ALTER TABLE config
        ADD COLUMN IF NOT EXISTS startTime varchar(64),
        ADD COLUMN IF NOT EXISTS endTime varchar(64)`)
    .then(res => console.log(`added startTime and endTime columns if they didn't exist`))
    .catch(err => console.log(`Error adding startTime and endTime columns`, err));

db.query(`ALTER TABLE config
        ADD COLUMN IF NOT EXISTS clip bytea`)
    .then(res => console.log(`added clip bytea column if it didn't exist`))
    .catch(err => console.log(`Error adding clip column`, err));

router.post('/change', async ctx => {
    const body = ctx.request.body;
    if (body.phrase === process.env.PASSWORD) {
        console.log(`Passphrase correct:`, body);
        const volume = parseFloat(body.volume, 10);
        if (volume > 1 || volume < 0) {
            ctx.response.body = "Invalid volume";
            ctx.response.status = 400;
            return;
        }
        const clip = await cutClip(ytdl(body.url), body.startTime, body.endTime); //can't wait for this. need a font end that polls for result or something
        console.log(`done cutting clip`);
        const videoBinary = "\\x" + await fs.readFile(clip, 'hex');
        db.query('INSERT INTO config VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO UPDATE SET name = $2, url = $3, volume = $4, startTime = $5, endTime = $6, clip = $7;', [body.id, body.name, body.url, body.volume, body.startTime, body.endTime, videoBinary])
            .then(res => {
                for (let row of res.rows) {
                    console.log(JSON.stringify(row));
                }
                ctx.response.body = `${body.name} (ID ${body.id}) changed to ${body.url}`;
                ctx.response.status = 200;
                console.log(`${body.name} (ID ${body.id}) changed to ${body.url}`);
            })
            .catch(err => {
                console.log(`Error making change`, err);
                ctx.response.body = `Error`;
                ctx.response.status = 500;
            });
    } else {
        console.log(`Failed passphrase attempt. User attempted with passphrase: ${body.phrase}`);
        ctx.response.body = `wrong secret phrase`;
        ctx.response.status = 403;
    }
});

const apiRoute = '/api'
app
    .use(bodyparser())
    .use(cors())
    .use(koaStatic(join(__dirname, 'public')))
    .use(mount(apiRoute, router.routes()))
    .use(mount(apiRoute, router.allowedMethods()));

const PORT = process.env.PORT || 8080;
app.listen(PORT);
console.log(`Server running on ${PORT}`);
