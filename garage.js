/**
 *  Garagentor-Fernbedienung mit Raspberry Pi
 *  (c) 2017 by G. Weirich
 */

"use strict"

// Damit wir das Programm auf einem normalen PC testen können. Wenn es auf dem echten Pi läuft, true setzen
const realpi = false

// Pin des piface für den output. pin 1 ist das linke Relais.
const output_pin = 1
// pin für den Schalter, der feststellt, ob das Garagentor offen ist
const input_pin = 0
// Dauer des simulierten Tastendrucks in Millisekunden
const time_to_push = 1200
const lock_time = 3000
const fs = require('fs')
const https = require('https')
const express = require('express')
const nconf = require('nconf')
const hash = require('crypto-js/sha256')
const path = require('path')
const bodyParser = require('body-parser');
const salt = "um Hackern mit 'rainbow tables' die Suppe zu versalzen"
const favicon = require('serve-favicon');

nconf.file('users.json')
const app = express()
// Dieses Flag nutzen wir später, um den Server temporär inaktiv zu schalten.
let disabled = false;
const failures = {}

app.set('view-cache', true)
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));

/*
 HTTPS-Server erstellen, damit Usernamen und Passwörter verschlüsselt übermittelt werden.
 Als Zertifikat kann man entweder ein self-signed certificate verwenden
 (wie hier gezeigt: http://blog.mgechev.com/2014/02/19/create-https-tls-ssl-application-with-express-nodejs/).
 Dann muss man allerdings damit leben, dass der Browser eine "Sicherheitswarnung" ausgibt.

 Oder man erstellt ein Zertifikat via letsencrypt, mit "sudo certbot certonly --manual" und kopiert
 "privkey.pem" nach "key.pem" und "fullchain.pem" nach "cert.pem".
 Dann muss man allerdings, das Zertifikat alle drei Monate erneuern, weil Letsencrypt keine länger gültigen
 Zertifikate ausstellt.

 Oder man kauft irgendwo ein kostenpflichtiges Zertifikat. Aber das scheint mir für einen Garagentorantrieb
 eigentlich zu aufwändig.
 */
https.createServer({
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
}, app).listen(2017)

// Auf einem echten Pi ist pfio auf das piface (https://www.npmjs.com/package/piface) gesetzt
// Auf einem anderen PC wird es einfach mit leeren Funktionen simuliert.
let pfio
if (realpi) {
  pfio = require('piface')
  pfio.init()
} else {
  let pinstate = 1
  pfio = {
    digital_write: function () {
    },
    digital_read: function (pin) {
      pinstate = pinstate ? 0 : 1
      return pinstate
    }
  }
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

// Login-Screen anzeigen
app.get("/", function (request, response) {
  response.render("garage")
})

/**
 Check ob der Server inaktiv geschaltet ist
 */
app.post("/*", function (req, resp, next) {
  if (disabled) {
    resp.render("answer", {
      message: "Sorry, server is paused"
    })
  } else {
    next()
  }
})

/**
 Check, ob der aktuelle Anwender gesperrt ist
 */
function isLocked(lockinfo) {
  if (lockinfo) {
    let now = new Date().getTime()
    let locked_until = lockinfo.time + (Math.pow(2, lockinfo.attempt) * lock_time)
    if (now < locked_until) {
      return true;
    }
  }
  return false;
}

function setLock(user){    
 let now = new Date().getTime()  
 let lockinf = failures[user] ? failures[user] : {"attempt": 0} 
 lockinf["attempt"] += 1  
 lockinf["time"]=now    
 failures[user] = lockinf
 return Math.round((Math.pow(2,lockinf.attempt)*lock_time)/1000)
}
/**
 * Zugriffstest
 * Wenn ein user gesperrt ist, dann prüfe, ob die Sperre abgelaufen ist. Wenn nein, abweisen
 * Sonst:
 * Wenn das Passwort korrekt ist, allfällige Sperren löschen
 * Wenn das Passwort falsch ist, Sperre erneut setzen, Dauer erhöhen (2^attempt*lock_time)
 */
app.post("/garage/*", function (request, response, next) {
  let user = request.body.username.toLocaleLowerCase()
  if (isLocked(failures[user])) {
    response.render("answer", {message: "Sperre wegen falscher Passworteingabe. Bitte etwas später nochmal versuchen."})
  } else {
    let password = JSON.stringify(hash(request.body.password + salt))
    let valid = nconf.get(user)
    if (valid && valid === password) {
      delete failures[user]
      next()
    } else {
      console.log("Loginfehler mit Name " + user + ", " + new Date())
      secs=setLock(user)
     response.render("answer", {
        message: "Wer bist denn du??? Sperre " + secs + " Sekunden."
      })
    }
  }
})

app.get("/adm/:master/*", function (req, resp, next) {
  if(isLocked(failures['admin'])){
    resp.render("answer", {message: "Sperre wegen falscher Passworteingabe. Bitte etwas später nochmal versuchen."})
  }else {
    let master = JSON.stringify(hash(req.params.master + salt))
    let stored = nconf.get("admin")
    if (!stored) {
      nconf.set("admin", master)
      stored = master
    }
    if (stored === master) {
      delete failures['admin']
      next()
    } else {
      console.log("Admin-Fehler" + req.params.username + ", " + new Date())
     setLock("admin")
      resp.render("answer", {
        message: "Insufficient rights. Wait "+secs+" seconds."
      })
    }
  }
})

/*
 Nach dem Login-Screen: Aktuellen Zustand des Tors anzeigen, wenn Username udn Passwort stimmen
 */
app.post("/garage/login", function (request, response) {
  let state = pfio.digital_read(input_pin)
  let action = state === 1 ? "Schliessen" : "Öffnen"
  response.render("confirm", {
    name: request.body.username,
    pwd: request.body.password,
    status: state === 1 ? "offen" : "geschlossen",
    action: action
  })

})

/*
 "Taste drücken", wenn username und passwort stimmen
 */
app.post("/garage/action", function (request, response) {
  console.log("Garage " + request.body.action + ", " + new Date())
  pfio.digital_write(output_pin, 1)
  setTimeout(function () {
    pfio.digital_write(output_pin, 0)
  }, time_to_push);

  response.render("answer", {
    message: "Auftrag ausgeführt, " + request.body.username
  })
})

/**
 * Einen neuen User eintragen. Als letzter Parameter muss das Master-Passwort angegeben werden.
 * Wenn bisher noch kein Master-Passwort existiert, wird es eingetragen.
 */
app.get("/adm/:master/add/:username/:password", function (req, resp) {
  var user = req.params.username.toLocaleLowerCase()
  var password = JSON.stringify(hash(req.params['password'] + salt))
  nconf.set(user, password)
  nconf.save()
  resp.render("answer", {
    message: "Ok"
  })

})

/**
 * Einen User löschen. Als letzter Parameter muss das Master-Passwort angegeben werden.
 * Wenn bisher noch kein Master-Passwort existiert, wird es eingetragen..
 */
app.get("/adm/:master/remove/:username", function (req, resp) {
  nconf.set(req.params.username, undefined)
  nconf.save()
  resp.render("answer", {
    message: "ok"
  })
})

/**
 * Server inaktiv schalten. Als Parameter muss das Master-Passwort angegeben werden.
 * Wenn bisher noch kein Master-Passwort existiert, wird es eingetragen.
 */
app.get("/adm/:master/disable", function (req, resp) {
  disabled = true
  resp.render("answer", {
    message: "disabled"
  })
})

/**
 * Server aktiv schalten.  Als Parameter muss das Master-Passwort angegeben werden.
 * Wenn bisher noch kein Master-Passwort existiert, wird es eingetragen.
 */
app.get("/adm/:master/enable", function (req, resp) {
  disabled = false
  resp.render("answer", {
    message: "enabled"
  })
})
