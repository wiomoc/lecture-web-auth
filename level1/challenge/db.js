const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('database.db');

module.exports = {
    init() {
        db.run(`CREATE TABLE IF NOT EXISTS posts
                (
                    id      INTEGER PRIMARY KEY AUTOINCREMENT,
                    title   TEXT,
                    summary TEXT,
                    author  TEXT,
                    content TEXT
                )`)
    },
    createPost({title, summary, author, content}, callback) {
        db.run('INSERT INTO posts (title, summary, author, content)  VALUES (?, ?, ?, ?)',
            title, summary, author, content,
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
        db.get('SELECT * FROM posts WHERE id = ?', id, callback)
    },
    getPostsSummary(callback) {
        db.all('SELECT id, title, summary, author FROM posts ORDER BY ID DESC', callback)
    }
}