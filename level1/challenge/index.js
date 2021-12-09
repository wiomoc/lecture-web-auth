const express = require('express');
const bodyParser = require('body-parser');
const basicAuth = require('express-basic-auth');
const app = express();
const PORT = 8080
// CSRF protection
const csurf = require('csurf');
const csrfProtection = csurf({cookie: true});
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const db = require('./db');
db.init();
const marked = require('marked');
const sanitizeHtml = require('sanitize-html');

app.set('view engine', 'ejs');


app.get('/', (req, res) => {
    db.getPostsSummary((err, posts) => {
        if (err) {
            res.status(500)
            res.end();
            return;
        }
        res.render('pages/index', {posts});
    })
});

app.get('/post/:id', (req, res) => {
    db.getPost(req.params.id, (err, post) => {
        if (err || !post) {
            res.status(404);
            res.end();
            return;
        }
        const htmlContent = marked.parse(sanitizeHtml(post.content));
        res.render('pages/post', {
            post,
            htmlContent
        });
    })
});

app.get('/newpost', csrfProtection, (req, res) => {
    res.render('pages/newpost', {csrfToken: req.csrfToken()});
});

app.post('/newpost', bodyParser.urlencoded(), csrfProtection, (req, res) => {
    // TODO validate
    db.createPost(req.body, (err, id) => {
        if (err) {
            res.status(500)
            res.end();
            return;
        }
        res.redirect('/post/' + id);
    })
});

app.get('/post/:id/edit', csrfProtection, (req, res) => {
    db.getPost(req.params.id, (err, post) => {
        if (err || !post) {
            res.status(404);
            res.end();
            return;
        }
        res.render('pages/editpost', {post, csrfToken: req.csrfToken()});
    })
});

app.post('/post/:id/edit', bodyParser.urlencoded(), csrfProtection, (req, res) => {
    // TODO validate
    db.updatePost(req.params.id, req.body, (err) => {
        if (err) {
            res.status(500)
            res.end();
            return;
        }
        res.redirect('/post/' + req.params.id);
    })
});

app.listen(PORT, () => console.log(`Started Server on Port ${PORT}`));