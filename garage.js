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
// Dauer des Öffnungs/Schliessvorgangs des Tors
const time_to_run = 4000
// Aussperren bei falscher Passworteingabe
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
// Dieses Flag zeigt an, dass das Garagentor gerade fährt
let running = false
// Hier sammeln wir schiefgegangene Login-Versuche
const failures = {}

app.set('view-cache', true)
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));

/*
 HTTPS-Server erstellen, damit Usernamen und Passwörter verschlüsselt übermittelt werden.
 Als Zertifikat kann man entweder ein self-signed certificate verwenden
 (openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes).
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

/**
 * Expressjs sagen, dass die Views im Verzeichnis "views" zu finden sind, und dass
 * pug benötigt wird, um sie nach HTML zu konvertieren.
 */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

/**
 * Expressjs mitteilen, dass wir json- und urlencoded Parameter im request body erwarten
 */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

/**
 * Endpoint für https://adresse:2017/
 *  Login-Screen anzeigen
 */
app.get("/", function (request, response) {
  response.render("garage")
})

/**
 Check ob der Server inaktiv geschaltet ist, oder das Garagentor gerade läuft.
 Wird vor jeden POST-Request ("/*") geschaltet.
 */
app.post("/*", function (req, resp, next) {
  if (disabled) {
    resp.render("answer", {
      message: "Der Server ist derzeit inaktiv geschaltet."
    })
  } else if (running) {
    resp.render("answer", {
      message: "Das Garagentor fährt gerade. Bitte warten."
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

/**
 * Aktuellen User sperren. Wenn er schon gesperrt ist, Sperrzeit verlängern
 * @param user user
 * @returns {number} Zahl an Sekunden der aktuellen Sperrzeit
 */
function setLock(user) {
  let now = new Date().getTime()
  let lockinf = failures[user] ? failures[user] : {"attempt": 0}
  lockinf["attempt"] += 1
  lockinf["time"] = now
  failures[user] = lockinf
  return Math.round((Math.pow(2, lockinf.attempt) * lock_time) / 1000)
}

/**
 * Zugriffstest; wird vor alle https://server:2017/garage/... Anfragen POST requessts geschaltet
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
      let secs = setLock(user)
      response.render("answer", {
        message: "Wer bist denn du??? Sperre " + secs + " Sekunden."
      })
    }
  }
})

/**
 * Zugriffstest für Admin-Funktionen. Wird vor alle https://server:2017/adm/... GET requests geschaltet.
 * Gemeinsame Syntax: /adm/masterpassword/funktion/parameter.
 * Bei falschem Masterpasswort: Sperre setzen bzw. verlängern.
 */
app.get("/adm/:master/*", function (req, resp, next) {
  if (isLocked(failures['admin'])) {
    resp.render("answer", {message: "Sperre wegen falscher Passworteingabe. Bitte etwas später nochmal versuchen."})
  } else {
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
      let secs = setLock("admin")
      resp.render("answer", {
        message: "Insufficient rights. Wait " + secs + " seconds."
      })
    }
  }
})

/*
 Nach dem Login-Screen und erfolgreicher Passworteingabe: Aktuellen Zustand des Tors anzeigen.
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
 "Taste drücken".  Kontakt wird für time_to_push Millisekunden geschlossen. Für time_to_run Millisekunden werden
 keine weiteren Kommandos entgegengenommen, um dem Tor Zeit zu geben, ganz hoch oder runter zu fahren.
 */
app.post("/garage/action", function (request, response) {
  console.log("Garage " + request.body.action + ", " + new Date())
  running=true
  pfio.digital_write(output_pin, 1)
  setTimeout(function () {
    pfio.digital_write(output_pin, 0)
  }, time_to_push);
  setTimeout(function(){
    running=false
  },time_to_run)
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
