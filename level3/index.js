const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session')
const passport = require('passport');
const Auth0Strategy = require('passport-auth0');
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

const AUTH0_OPTIONS = {
    domain: 'wiomoc.eu.auth0.com',
    clientID: '3wv5uj6rDOtlb7OhbVcReygcAqqiIkB7',
    clientSecret: 'f34Ft-vJFFuMl1eQIcy4e5_iVf9dabGM8lo6MQRL0u_qPnrVJ5N7r96ZSsRThdmg',
    callbackURL: 'http://localhost:8080/login',
    baseUrl: 'http://localhost:8080/'
}
passport.use(new Auth0Strategy(AUTH0_OPTIONS, function (accessToken, refreshToken, extraParams, profile, done) {
    const user = {
        auth0id: profile.id,
        name: profile.displayName,
        picture: profile.picture
    }
    console.log("Logged in:", profile);
    db.createUser(user, (err, id) => {
        if (err) {
            done(err);
        } else {
            user.id = id;
            done(null, user)
        }
    });
}))

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


app.get(
    '/login',
    passport.authenticate('auth0', {scope: 'openid email profile'}),
    function (req, res) {
        res.redirect('/');
    }
)

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