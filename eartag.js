var crypto = require("crypto")

function Tagger(secret, opts) {
  if (!(this instanceof Tagger)) {
    return new Tagger(secret, opts)
  }

  if (!(typeof secret == "string")) {
    throw new Error("No secret specified.")
  }

  this.secret = secret

  Object
    .keys(opts || {})
    .forEach(function(key){ this[key] = opts[key] }, this)

  this.hmacLength    = this.hmac(Buffer(0)).length
  this.cookiePattern = RegExp("(?:^|;\\s*)" + this.cookieName + "=([^;]+)")

  return this.tag.bind(this)
}

Tagger.prototype.hmacAlgorithm   = "sha1"
Tagger.prototype.cipherAlgorithm = "aes-256-cbc"
Tagger.prototype.cookieName      = "eartag"

Tagger.prototype.cipher = function(data) {
  var stream = crypto.createCipher(this.cipherAlgorithm, this.secret)

  stream.end(data)
  return stream.read()
}

Tagger.prototype.decipher = function(data) {
  var stream = crypto.createDecipher(this.cipherAlgorithm, this.secret)

  stream.end(data)
  return stream.read()
}

Tagger.prototype.hmac = function(data) {
  var stream = crypto.createHmac(this.hmacAlgorithm, this.secret)

  stream.end(data)
  return stream.read()
}

Tagger.prototype.sign = function(data) {
  return Buffer.concat([data, this.hmac(data)])
}

Tagger.prototype.unsign = function(data) {
  var payload = data.slice(0, -this.hmacLength)
  var hash    = data.slice(-this.hmacLength)
  var match   = Tagger.compare(hash, this.hmac(payload))

  if (match) return payload
}

Tagger.prototype.read = function(req) {
  var data

  try {
    data = req.headers.cookie.match(this.cookiePattern)
    data = Tagger.parse(data[1])
    data = this.decipher(data)
    data = this.unsign(data)
    data = data.toString("hex")
  }

  catch (e) {}

  return data
}

Tagger.prototype.write = function(id, res) {
  var token   = Tagger.stringify(this.cipher(this.sign(id)))
  var expires = new Date(Date.now() + 2592000000)

  res.setHeader(
    "Set-Cookie",
    this.cookieName + "=1; path=/; expires=2; httponly" // add secure if secure
      .replace(2, expires.toGMTString())
      .replace(1, token)
  )

  return id.toString("hex")
}

Tagger.prototype.tag = function(req, res, next) {
  if (next) setImmediate(next)

  var id = this.read(req) || crypto.randomBytes(16).toString("hex")

  this.write(Buffer(id, "hex"), res)

  return req.eartag = id
}

Tagger.compare = function(a, b) {
  var i  = a.length > b.length ? a.length : b.length
  var ok = true

  while (i--) if (a[i] != b[i]) ok = false

  return ok
}

Tagger.parse = function(string) {
  return Buffer(
    string
      .replace(/_/g, "+")
      .replace(/-/g, "/")
      + Array(5 - string.length % 4).join("="),
    "base64"
  )
}

Tagger.stringify = function(buffer) {
  return buffer
    .toString("base64")
    .replace(/=+$/, "")
    .replace(/\+/g, "_")
    .replace(/\//g, "-")
}

module.exports = Tagger
