const Koa = require('koa');
const Router = require('koa-router');
const koaStatic = require('koa-static');
require('dotenv').config();
const join = require('path').join;
const cors = require('@koa/cors');
const mount = require('koa-mount');
const bodyparser = require('koa-bodyparser');
const Client = require('pg').Client;

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

router.post('/change', ctx => {
    const body = ctx.request.body;
    if (body.phrase === process.env.PASSWORD) {
        console.log(`Passphrase correct:`, body);
        const volume = parseFloat(body.volume, 10);
        if (volume > 1 || volume < 0) {
            ctx.response.body = "Invalid volume";
            ctx.response.status = 400;
            return;
        }
        db.query('INSERT INTO config VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET name = $2, url = $3, volume = $4;', [body.id, body.name, body.url, body.volume])
            .then(res => {
                for (let row of res.rows) {
                    console.log(JSON.stringify(row));
                }
                ctx.response.status = 200;
                ctx.body = `${body.name} (ID ${body.id}) changed to ${body.url}`;
            })
            .catch(err => {
                console.log(`Error making change`, err);
                ctx.body = `Error`;
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