const Koa = require('koa');
const Router = require('koa-router');
const koaStatic = require('koa-static');
require('dotenv').config();
const join = require('path').join;
const cors = require('@koa/cors');
const mount = require('koa-mount');
const bodyparser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

if (!process.env.PASSWORD) {
    throw "Need to provide a password in PASSWORD environment variable";
}

router.get('/', ctx => {
    ctx.body = 'Hello Koa';
});

router.post('/change', ctx => {
    const body = ctx.request.body;
    if (body.word === process.env.PASSWORD) {
        console.log(`Password correct:`, body);
        ctx.response.status = 200;
        ctx.body = `${body.name} (ID ${body.id}) changed to ${body.url}`;
    } else {
        console.log(`Failed password attempt. User attempted with password: ${body.word}`);
        ctx.response.body = `wrong secret word`;
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
