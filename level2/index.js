const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
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
app.use(session({
    secret: 'aDCLW,9MÖSD-C0ẞ'
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(function (username, password, done) {
    db.getUserByName(username, (err, user) => {
        if (!user || err) {
            done(err, false);
        } else {
            if (bcrypt.compareSync(password, user.password)) {
                done(null, user);
            } else {
                done(null, false);
            }
        }
    })
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

app.get('/login', (req, res) => {
    res.render('pages/login')
})

app.post(
    '/login',
    bodyParser.urlencoded(),
    function (req, res, next) {
        passport.authenticate('local', function (err, user) {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.render('pages/login', {username: req.body.username, invalid: true});
            }
            req.login(user, function () {
                return res.redirect('/');
            });
        })(req, res, next);
    }
)

app.get('/register', (req, res) => {
    res.render('pages/register')
})

app.post(
    '/register',
    bodyParser.urlencoded(),
    (req, res) => {
        const password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync());
        const user = {
            name: req.body.username,
            password,
        };
        // TODO validate
        db.createUser(user, (err, id) => {
            if (err) {
                // TODO report username conflict to user
                res.status(500);
                res.end();
                return;
            }
            user.id = id;
            req.login(user, function () {
                return res.redirect('/');
            });
        })

    }
)

app.get(
    '/logout',
    function (req, res) {
        req.logout();
        res.redirect('/');
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

app.get('/newpost', loggedIn, csrfProtection, (req, res) => {
    res.render('pages/newpost', {csrfToken: req.csrfToken()});
});

app.post('/newpost', loggedIn, bodyParser.urlencoded(), csrfProtection, (req, res) => {
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

app.get('/post/:id/edit', loggedIn, csrfProtection, (req, res) => {
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

app.post('/post/:id/edit', loggedIn, bodyParser.urlencoded(), csrfProtection, (req, res) => {
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