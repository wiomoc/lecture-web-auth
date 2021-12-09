* Create user table
```js
  db.run(`CREATE TABLE IF NOT EXISTS users
                (
                    id       INTEGER PRIMARY KEY AUTOINCREMENT,
                    name     TEXT UNIQUE,
                    password TEXT
                )
`) 
```

* Create db accesors
```js
    createUser({name, password}, callback) {
        db.run('INSERT INTO users (name, password) VALUES (?, ?) ', name, password,
            function (err) {
                if (err) {
                    callback(err)
                } else {
                    callback(null, this.lastID)
                }
            })
    },
    getUserByName(name, callback) {
        db.get('SELECT * FROM users WHERE name = ?', name, callback)
    },
    getUser(id, callback) {
        db.get('SELECT * FROM users WHERE id = ?', id, callback)
    },
```

* `npm install passport passport-local`
```js
const passport = require('passport');

app.use(passport.initialize());
```
```js
passport.use(new LocalStrategy(function (username, password, done) {
    db.getUserByName(username, (err, user) => {
        if (!user || err) {
            done(err, false);
        } else {
            if (password === user.password) { // TODO
                done(null, user);
            } else {
                done(null, false);
            }
        }
    })
}))
```

* Create login
```html
<%- include('../partials/header', {subtitle: 'Login', hideNav: true}); %>
    <form class="col col-md-5" id="form" method="post">
        <h1>Login</h1>
        <div class="input-group has-validation mt-2">
            <span class="input-group-text" id="inputGroupPrepend">@</span>
            <input name="username" type="text" class="form-control" aria-describedby="inputGroupPrepend" required
                   placeholder="Username">
        </div>
        <div class="input-group has-validation mt-1">
            <input id="password" name="password" type="password" class="form-control" required
                   placeholder="Password">
        </div>
        <button type="submit" class="btn btn-primary mt-2">Login</button>
    </form>
```
* install body-parser
* Define login route
easy: 
```js
const bodyParser = require('body-parser');
app.get('/login', (req, res) => {
    res.render('pages/login')
})

app.post('/login',
  bodyParser.urlencoded(), // username & password are transmitted in body
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login' })
)
```

* install express-session
* Setup passport session


```js
const session = require('express-session');

app.use(session({
  secret: 'mysecret'
}));
app.use(passport.session());
passport.serializeUser(function (user, done) {
    done(null, user.id); // store only userId in session
});

passport.deserializeUser(function (id, done) {
    db.getUser(id, done);
});
```

* register user

```js
app.get('/register', (req, res) => {
    res.render('pages/register')
})

app.post(
    '/register',
    bodyParser.urlencoded(),
    (req, res) => {
        const user = {
            name: req.body.username,
            password: req.body.password,
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
```


* bcrypt
install bcrypt
```js
const bcrypt = require('bcrypt');
const password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync());
```

```js
if (bcrypt.compareSync(password, user.password))

```

* redirect not logged in 
```js
const loggedIn = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        res.redirect('/login');
    }
}
```
