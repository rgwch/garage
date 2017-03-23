// garage.js
// http://blog.mgechev.com/2014/02/19/create-https-tls-ssl-application-with-express-nodejs/

const pin = 1
const time_to_push = 1500
const realpi = false      // Set to true if running really on the Raspberry Pi (otherwise pfio access is simulated)
const fs = require('fs')
const https = require('https')
const express = require('express')
const nconf = require('nconf')
const hash = require('crypto-js/sha256')
const path = require('path')
const bodyParser = require('body-parser');
const salt = "um Hackern mit 'rainbow tables' die Suppe zu versalzen"
nconf.file('users.json')
const app = express()
let pfio
app.set('view-cache', true)

https.createServer({
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
}, app).listen(2017)

if (realpi) {
  pfio = require('piface')
  pfio.init()
} else {
  pfio = {
    digital_write: function () {
    },
  }
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get("/", function (request, response) {
  response.render("garage")
})

app.post("/garage", function (request, response) {
  let user = request.body.username
  let password = JSON.stringify(hash(request.body.password + salt))
  let valid = nconf.get(user)
  if (valid && valid === password) {
    pfio.digital_write(pin, 1)
    setTimeout(function () {
      pfio.digital_write(pin, 0)
    }, time_to_push);

    response.render("answer", {message: "Auftrag ausgeführt, " + request.body.username})
  } else {
    response.render("answer", {message: "Wer bist denn du???"})
  }
})


app.get("/adduser/:username/:password", function (req, resp) {
  var user = req.params.username
  var password = JSON.stringify(hash(req.params['password'] + salt))
  nconf.set(user, password)
  nconf.save()
  resp.render("answer", {message: "Ok"})
})


