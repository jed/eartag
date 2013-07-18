var http    = require("http")
var crypto  = require("crypto")
var request = require("request")
var assert  = require("assert")

var eartag = require("./")
var secret = crypto.randomBytes(20).toString("hex")
var tag    = eartag(secret)
var server = http.createServer()

server.on("request", function(req, res) {
  var id = tag(req, res)

  assert.equal(id, req.eartag)

  res.end(id)
})

server.listen(function() {
  var port = server.address().port
  var url = "http://127.0.0.1:" + port

  request(url, function(err, res, tag1) {
    request(url, function(err, res, tag2) {
      assert.ok(tag1)
      assert.ok(tag2)
      assert.equal(tag1, tag2)

      server.close()
    })
  })
})
