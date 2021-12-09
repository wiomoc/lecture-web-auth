* install express-basic-auth
```js
const withBasicAuth = basicAuth({
    users: {'admin': 'donald'},
    challenge: true,
    realm: 'SecZero Admin Space',
})
```

* enable guard on certain routes
