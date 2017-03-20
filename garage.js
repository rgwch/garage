// garage.js
var pin=38
var express=require('express')
var nconf=require('nconf')
var hash=require('crypto-js/sha256')
var rpio=require('rpio')
var salt="um hackern mit rainbow tables die Suppe zu versalzen"
nconf.env().argv().file('users.json')
var app=express()
rpio.open(pin,rpio.OUTPUT,rpio.HIGH)

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

app.get("/adduser/:username/:password",function(req,resp){
  var user=JSON.stringify(hash(req.params['username']+salt))
  var password=JSON.stringify(hash(req.params['password']+salt))
  nconf.set(user,password)
  nconf.save()
  resp.send("Ok")
})
app.listen(3000,function(){
  console.log("Garagenserver läuft an port 3000")
})

