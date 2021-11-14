const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 8080
const db = require('./db');
db.init();
const {auth} = require('express-oauth2-jwt-bearer');

const checkJwt = auth({
    audience: 'http://localhost:8080',
    issuerBaseURL: `https://wiomoc.eu.auth0.com/`,
});

app.get('/posts', (req, res) => {
    db.getPostsSummary((err, posts) => {
        if (err) {
            res.status(500)
            res.end();
            return;
        }
        res.json(posts);
    })
});

app.get('/post/:id', (req, res) => {
    db.getPost(req.params.id, (err, post) => {
        if (err || !post) {
            res.status(404);
            res.end();
            return;
        }
        res.json(post);
    })
});

app.post('/post', checkJwt, bodyParser.urlencoded(), (req, res) => {
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
        res.status(201);
        res.redirect('/post/' + id);
    })
});

app.put('/post/:id', checkJwt, bodyParser.urlencoded(), (req, res) => {
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
            res.status(202);
            res.end()
        })
    })
});

app.listen(PORT, () => console.log(`Started Server on Port ${PORT}`));