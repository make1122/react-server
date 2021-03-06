import express from 'express';
import proxy from 'express-http-proxy';
import { render } from './utils';
import routes from '../Routes';
import { getStore } from '../store';
import { matchRoutes } from 'react-router-config';

// 客户端渲染
// react代码在浏览器上执行，消耗的是用户浏览器的性能

// 服务器端渲染
// react代码在服务器上执行，消耗的是服务器端的性能

const app = express();
app.use(express.static('public'));

app.use('/react_ssr', proxy('https://www.easy-mock.com', {
    proxyReqPathResolver: function (req) {
        return '/mock/5c7103f8dcf13129127978cc/react_ssr' + req.url;
    }
  }));

app.get('*', (req, res) => {
    const store = getStore(req);

    // 根据路由的路径，来往store里面加数据
    const matchedRoutes = matchRoutes(routes, req.path);

    // 让matchedRoutes里面所有的组件，对应的loadData方法执行一次
    const promises = [];
    matchedRoutes.forEach(item => {
        if(item.route.loadData) {
            promises.push(item.route.loadData(store))
        }
    })

    Promise.all(promises).then(() => {
        const context = {
            css: []
        };
        const html = render(store, routes, req, context);
        // 服务器端渲染301重定向
        if(context.action === 'REPLACE') {
            res.redirect(301,context.url)
        } else if(context.NOT_FOUND) {
            res.status(404);
            res.send(html)
        } else {
            res.send(html)
        }
    })
})

app.listen(3000, () => console.log('Example app listening on port 3000!'))