eartag
======

[![Build Status](https://travis-ci.org/jed/eartag.png?branch=master)](https://travis-ci.org/jed/eartag)

eartag is a small node.js library that lets you tag browsers like [farmers tag livestock](http://en.wikipedia.org/wiki/Ear_tag). It attaches an unforgeable cookie to the browser, allowing you to identify subsequent visits. Think of it as a [WeakMap](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap) for browsers: instead of using cookies to store authentication and other client state, you store an ID unique to that browser, from which state can be retrieved externally.

Example
-------

```javascript
var http   = require("http")
var eartag = require("eartag")
var tag    = eartag("YOUR-SECRET-KEY")

http.createServer(function(req, res) {
  // If an eartag cookie exists, the existing ID is returned.
  // Otherwise, a new ID is generated and returned.
  var id = tag(req, res)

  // Once you have an ID, use it with your backend to retrieve
  // client-specific information such as the user or locale.
  db.getClientData(id, function(err, clientData) {
    res.writeHead(200, {"Content-Type": "text/plain"})
    res.end("The current user is: " + clientData.user.fullname)
  })
}).listen(8000)
```

Installation
------------

    npm install eartag

Usage
-----

### var tag = eartag(secret, [options])

Returns a tagging function. `secret` a required string used as the key for signing and encryption. `options` is an optional object which can contain the following keys:

- `hmacAlgorithm`: The algorithm used to sign the browser's ID (`sha1` by default)
- `cipherAlgorithm`: The algorithm used to encrypt the signed ID (`aes-256-cbc` by default)
- `cookieName`: The name of the cookie used for persistence (`eartag` by default)

### tag(request, response, [next])

Returns the ID of the client, as parsed, decrypted, and verified from the incoming cookie. If no cookie exists, or the cookie is invalid, a new ID will be generated, returned, and added to the outgoing headers.

```javascript
var http   = require("http")
var eartag = require("eartag")("YOUR-SECRET-KEY")
var server = http.createServer()

server.on("request", function(req, res) {
  var id = tag(req, res) // a random ID like `092d4b5bcc293d641a3c8b1d6d58d36d`

  res.writeHead(200, {"Content-Type": "text/plain"})
  res.end("Your ID is: " + id)
})

server.listen(8000)
```

This ID (16 random bytes, encoded in hexadecimal) will also be assigned to the `eartag` property of the request. Since this function is synchronous, it can be also easily integrated with multiple vanilla HTTP server listeners as follows:

```javascript
var http   = require("http")
var eartag = require("eartag")("YOUR-SECRET-KEY")
var server = http.createServer()

server.on("request", eartag)
server.on("request", function(req, res) {
  res.writeHead(200, {"Content-Type": "text/plain"})
  res.end("Your ID is: " + req.eartag)
})

server.listen(8000)
```

A `next` continuation function can optionally be passed as the third argument, for uses with [Connect](https://github.com/senchalabs/connect)-compatible frameworks like [Express](http://expressjs.com/) and [Restify](https://github.com/mcavage/node-restify):

```javascript
var express = require("express")
var eartag  = require("eartag")("YOUR-SECRET-KEY")
var app     = express()

app.use(eartag)

app.get("/id", function(req, res) {
  res.send("Your ID is: " + req.eartag)
})

app.listen(8000)
```

Note that if cookies are disabled by the client, a new ID will be generated for every visit, preventing identification across requests.

LICENSE
-------

(The MIT License)

Copyright (c) 2013 Jed Schmidt &lt;where@jed.is&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
