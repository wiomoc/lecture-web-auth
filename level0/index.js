const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 8080
const db = require('./db');
db.init();
const marked = require('marked');
const sanitizeHtml = require('sanitize-html');

app.set('view engine', 'ejs');

app.use('/assets', express.static('assets'));

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


app.get('/newpost', (req, res) => {
    res.render('pages/newpost');
});

app.post('/newpost', bodyParser.urlencoded(), (req, res) => {
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

app.listen(PORT, () => console.log(`Started Server on Port ${PORT}`));