// garage.js
// http://blog.mgechev.com/2014/02/19/create-https-tls-ssl-application-with-express-nodejs/

var pin=38            // Pin (not GPIO #) to handle
var realpi=false      // Set to true if running really on the Raspberry Pi (otherwise GPIO access is simulated)
var fs=require('fs')
var https=require('https')
var express=require('express')
var nconf=require('nconf')
var hash=require('crypto-js/sha256')
var path=require('path')
var salt="um Hackern mit 'rainbow tables' die Suppe zu versalzen"
nconf.env().argv().file('users.json')
var app=express()

https.createServer({
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
},app).listen(2017)

if(realpi) {
  var rpio = require('rpio')
  rpio.open(pin, rpio.OUTPUT, rpio.HIGH)
}else{
  var rpio={
    write: function(){},
    sleep: function(){}
  }
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.get("/",function(request,response){
  response.render("garage")
})

app.get("/garage",function(request,response){
  var user=JSON.stringify(hash(request.query.username+salt))
  var password=JSON.stringify(hash(request.query.password+salt))
  var valid=nconf.get(user)
  if(valid && valid == password){
    rpio.write(pin,rpio.HIGH)
    rpio.sleep(1)
    rpio.write(pin,rpio.LOW)
    response.send("Auftrag ausgeführt, "+request.query.username)
  }else{
    response.send("Wer bist denn du???")
  }
})

app.get("/adduser/:username/:password",function(req,resp){
  var user=JSON.stringify(hash(req.params['username']+salt))
  var password=JSON.stringify(hash(req.params['password']+salt))
  nconf.set(user,password)
  nconf.save()
  resp.send("Ok")
})

