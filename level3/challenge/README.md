
* change db

```js
db.run(`CREATE TABLE IF NOT EXISTS users
                (
                    id      INTEGER PRIMARY KEY AUTOINCREMENT,
                    name    TEXT,
                    picture TEXT,
                    auth0Id TEXT UNIQUE
                )`
);
```

```js
    createUser({auth0id, name}, callback) {
        db.run('INSERT OR IGNORE INTO users (name, auth0Id) VALUES (?, ?, ?) ', name, auth0id,
            function (err) {
                if (err) {
                    callback(err)
                } else if (this.changes === 0) {
                    db.get('SELECT id FROM users WHERE auth0Id = ?', auth0id, (err, user) => {
                        callback(null, user.id)
                    })
                } else {
                    callback(null, this.lastID)
                }
            })
    },
```

* Create Auth0 account

* npm install passport-auth0

```js
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
        name: profile.displayName
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

```

```js
app.get(
    '/login',
    passport.authenticate('auth0', {scope: 'openid email profile'}),
    function (req, res) {
        res.redirect('/');
    }
)

```