const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session')
const passport = require('passport');
const app = express();
const PORT = 8080
const db = require('./db');
db.init();
const marked = require('marked');
const sanitizeHtml = require('sanitize-html');

app.set('view engine', 'ejs');
app.use(session({
    secret: 'aDCLW,9MÖSD-C0ẞ'
}));
app.use(passport.initialize());
app.use(passport.session());


// TODO setup auth0 strategy

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    db.getUser(id, done);
});

app.use(function (req, res, next) {
    res.locals = {
        user: req.user
    };
    next();
});


// TODO define login route

app.get(
    '/logout',
    function (req, res) {
        req.logout();
        res.redirect(`https://${AUTH0_OPTIONS.domain}/v2/logout?client_id=${AUTH0_OPTIONS.clientID}&returnTo=${decodeURIComponent(AUTH0_OPTIONS.baseUrl)}`);
    }
)

const loggedIn = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

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

app.get('/newpost', loggedIn, (req, res) => {
    res.render('pages/newpost');
});

app.post('/newpost', loggedIn, bodyParser.urlencoded(), (req, res) => {
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

app.get('/post/:id/edit', loggedIn, (req, res) => {
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
        res.render('pages/editpost', {post});
    })
});

app.post('/post/:id/edit', loggedIn, bodyParser.urlencoded(), (req, res) => {
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