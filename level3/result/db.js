const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('database.db');

module.exports = {
    init() {
        db.run(`CREATE TABLE IF NOT EXISTS users
                (
                    id      INTEGER PRIMARY KEY AUTOINCREMENT,
                    name    TEXT,
                    picture TEXT,
                    auth0Id TEXT UNIQUE
                )`, () =>
            db.run(`CREATE TABLE IF NOT EXISTS posts
                    (
                        id       INTEGER PRIMARY KEY AUTOINCREMENT,
                        title    TEXT,
                        summary  TEXT,
                        authorId INTEGER REFERENCES users (id),
                        content  TEXT
                    ); `));

    },
    createPost({title, summary, userId, content}, callback) {
        db.run('INSERT INTO posts (title, summary, authorId, content)  VALUES (?, ?, ?, ?)',
            title, summary, userId, content,
            function (err) {
                if (err) {
                    callback(err)
                } else {
                    callback(null, this.lastID)
                }
            })
    },
    updatePost(id, {title, summary, content}, callback) {
        db.run('UPDATE posts SET title = ?, summary = ?, content = ? WHERE id = ?',
            title, summary, content, id, callback)
    },
    getPost(id, callback) {
        db.get('SELECT posts.id as id, title, summary, content, authorId, users.name as author FROM posts JOIN users ON posts.authorId = users.id WHERE posts.id = ?', id, callback)
    },
    getPostsSummary(callback) {
        db.all('SELECT posts.id as id, title, summary, users.name as author FROM posts JOIN users ON authorId = users.id ORDER BY posts.id DESC', callback)
    },
    createUser({auth0id, name, picture}, callback) {
        db.run('INSERT OR IGNORE INTO users (name, picture, auth0Id) VALUES (?, ?, ?) ', name, picture, auth0id,
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
    getUser(id, callback) {
        db.get('SELECT * FROM users WHERE id = ?', id, callback)
    },
}