// garage.js
// http://blog.mgechev.com/2014/02/19/create-https-tls-ssl-application-with-express-nodejs/
var pin=38
var realpi
var fs=require('fs')
var https=require('https')
var express=require('express')
var nconf=require('nconf')
var hash=require('crypto-js/sha256')
var path=require('path')
var salt="um hackern mit rainbow tables die Suppe zu versalzen"
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
    console.log("Das Garagentor tut etwas!")
    rpio.write(pin,rpio.HIGH)
    rpio.sleep(1)
    rpio.write(pin,rpio.LOW)
    response.send("Auftrag ausgeführt, "+request.query.username)
  }else{
    response.send("Wer bist denn du???")
  }
})

/*
app.get("/garage/:user/:password",function(request,response){
  var user=JSON.stringify(hash(request.params['user']+salt))
  var password=JSON.stringify(hash(request.params['password']+salt))
  var valid=nconf.get(user)
  if(valid && valid == password){
    console.log("Das Garagentor tut etwas!")
    rpio.write(pin,rpio.HIGH)
    rpio.sleep(1)
    rpio.write(pin,rpio.LOW)
    response.send("Auftrag ausgeführt, "+request.params['user'])
  }else{
    response.send("Wer bist denn du???")
  }
})
*/
app.get("/adduser/:username/:password",function(req,resp){
  var user=JSON.stringify(hash(req.params['username']+salt))
  var password=JSON.stringify(hash(req.params['password']+salt))
  nconf.set(user,password)
  nconf.save()
  resp.send("Ok")
})

/*
app.listen(3000,function(){
  console.log("Garagenserver läuft an port 3000")
})
*/
