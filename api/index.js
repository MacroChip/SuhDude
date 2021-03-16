const Koa = require('koa');
const Router = require('koa-router');
const koaStatic = require('koa-static');
require('dotenv').config({ path: '../.env' });
const join = require('path').join;
const cors = require('@koa/cors');
const mount = require('koa-mount');
const bodyparser = require('koa-bodyparser');
const Client = require('pg').Client;
const { v4: uuidv4 } = require('uuid');
const changeUserConfig = require('./changeUserConfig').changeUserConfig;

const results = new Map();

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
            ctx.response.body = { error: "Invalid volume" };
            ctx.response.status = 400;
            return;
        }
        const uuid = uuidv4();
        changeUserConfig(db, body)
            .then(result => results.set(uuid, result))
            .catch(err => {
                console.log(`error chaning user config`, err);
                results.set(uuid, err);
            })
        ctx.response.body = { uuid };
    } else {
        console.log(`Failed passphrase attempt. User attempted with passphrase: ${body.phrase}`);
        ctx.response.body = { error: `wrong secret phrase` };
        ctx.response.status = 403;
    }
});

router.get('/status', async ctx => {
    if (!ctx.request.query?.uuid) {
        ctx.status = 412;
        ctx.body = { error: "uuid is required" }
        return;
    }
    const state = results.get(ctx.request.query?.uuid);
    ctx.body = { state };
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
