const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 8080
// CSRF protection
const csurf = require('csurf');
const csrfProtection = csurf();
const db = require('./db');
db.init();
const marked = require('marked');
const sanitizeHtml = require('sanitize-html');

app.set('view engine', 'ejs');
// 4. enable sessions
// 4. implement serialization of users

// 2. initialize passport

// 2.setup local strategy for passport



app.use(function (req, res, next) {
    res.locals = {
        user: req.user
    };
    next();
});


// 3. define login routes: get & post


app.get(
    '/logout',
    function (req, res) {
        req.logout();
        res.redirect('/');
    }
)

// 5. redirect if not loged in

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
    const post = {
        userId: req.user.id,
        ...req.body
    };
    db.createPost(post, (err, id) => {
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
        if (post.authorId !== req.user.id) {
            res.status(403);
            res.end();
            return;
        }
        res.render('pages/editpost', {post, csrfToken: req.csrfToken()});
    })
});

app.post('/post/:id/edit', bodyParser.urlencoded(), csrfProtection, (req, res) => {
    // TODO validate
    db.getPost(req.params.id, (err, post) => {
        if (post.authorId !== req.user.id) {
            res.status(403);
            res.end();
            return;
        }
        db.updatePost(req.params.id, req.body, (err) => {
            if (err) {
                res.status(500)
                res.end();
                return;
            }
            res.redirect('/post/' + req.params.id);
        })
    })
});

app.listen(PORT, () => console.log(`Started Server on Port ${PORT}`));