const Koa = require('koa');
const Router = require('koa-router');
const koaStatic = require('koa-static');
const join = require('path').join;
const cors = require('@koa/cors');
const mount = require('koa-mount');
const bodyparser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

router.get('/', ctx => {
    ctx.body = 'Hello Koa';
});

router.post('/change', ctx => {
    const body = ctx.request.body;
    ctx.response.code = 200;
    ctx.body = `${body.name} (ID ${body.id}) changed to ${body.url}`;
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
