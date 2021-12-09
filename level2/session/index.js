const express = require('express');
const app = express();
const PORT = 8081;
const session = require('express-session');
app.use(session({ secret: 'mysecret'}));

app.get('/store', (req, res) => {
  if(req.query.content) {
    req.session.content = req.query.content;
    res.end("Saved to session");
  } else {
    res.end("Saved content: " + req.session.content);
  }
})

app.listen(PORT, () => console.log(`Started Server on Port ${PORT}`));
