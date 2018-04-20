/**
 *  Garagentor-Fernbedienung mit Raspberry Pi
 *  (c) 2017-2018 by G. Weirich
 * 
 * 8.4.2018: Verwende Ulztraschall Sensor HC SR 04 zum feststellen, wo das Garagentor steht anstelle des 
 * Mikroschalters. Damit wird das Problem behoben, dass die Anzeige unzuverlässig ist, weil das Garagentor
 * nicht immer exakt am selben Ort anhält (abhängig von Temperatur, Luftfeuchtigkeit, Gespenstern usw.
 * Wir vereinfachen das: Wenn die Oberkante des Garagentors näher als MIN_DIST vom Sensor ist, betrachten wir es 
 * als offen.)
 * 15.4.2018: Wechsel vom PiFace auf ein Standard-Relais, das mit onoff geschaltet wird. 
 * Ausserdem neue Funktion: Abstandswarner an der Stirnseite der Garage einschalten, wenn das Tor offen ist.
 */

/* eslint-disable no-console*/
"use strict"

// Damit wir das Programm auf einem normalen PC ohne GPIO testen können. Wenn es auf dem echten Pi läuft, true setzen
const realpi = true
const debug = true;

// Pin-Definitionen
const GPIO_GARAGE = 14;
const GPIO_ARDUINO = 15;
const GPIO_ECHO = 23;
const GPIO_TRIGGER = 24

// Maximaldistanz, bis zu der das Garagentor als offen erkannt wird.
const MAX_DISTANCE = 100;

// Dauer des simulierten Tastendrucks in Millisekunden
const time_to_push = 900
// Dauer des Öffnungs/Schliessvorgangs des Tors
const time_to_run = 18000
// Aussperren bei falscher Passworteingabe
const lock_time = 3000

const fs = require('fs')
const https = require('https')
const express = require('express')
const nconf = require('nconf')
const hash = require('crypto-js/sha256')
const path = require('path')
const bodyParser = require('body-parser');
const us = require('microseconds');
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

// Auf einem echten Pi ist Gpio auf onoff (https://www.npmjs.com/package/onoff) gesetzt
// Auf einem anderen PC wird es einfach mit leeren Funktionen simuliert.
let Gpio;
if (realpi) {
  Gpio = require('onoff').Gpio;
} else {
  Gpio = {
    writeSync: function () { },
    readSync: function () { return true }
  }
}

const relay = new Gpio(GPIO_GARAGE, 'out');
const hc_trigger = new Gpio(GPIO_TRIGGER, 'out');
const hc_echo = new Gpio(GPIO_ECHO, 'in');
const arduino = new Gpio(GPIO_ARDUINO, 'out');

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

/************************
 * Hilfsfunktionen
 *
 ************************/

/**
 * Password hashen
 * @param pwd
 */
function encode(pwd) {
  const encoded = JSON.stringify(hash(pwd + salt))
  return encoded
}

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
  let lockinf = failures[user] ? failures[user] : { "attempt": 0 }
  lockinf.attempt += 1
  lockinf.time = now
  failures[user] = lockinf
  return Math.round((Math.pow(2, lockinf.attempt) * lock_time) / 1000)
}

/**
 "Taste drücken".  Kontakt wird für time_to_push Millisekunden geschlossen. Für time_to_run Millisekunden werden
 keine weiteren Kommandos entgegengenommen, um dem Tor Zeit zu geben, ganz hoch oder runter zu fahren.
 */
function operateGarage(done) {
  if (running) {
    return false
  } else {
    running = true
    relay.writeSync(1);
    setTimeout(function () {
      relay.writeSync(0)
    }, time_to_push);
    setTimeout(function () {
      running = false
      done()
    }, time_to_run)
    return true
  }
}

/**
 * Entfernung mit dem HC-SR04 Ultraschall-Sensor messen. 
 * Wenn das Tor offen ist, Arduino einschalten, sonst ausschalten.
 * @param callback: Wird mit true für offen und false für geschlossen aufgerufen.
 */
function doorState(callback) {
  let prep;
  let failed = false;
  hc_trigger.writeSync(1);
  if (debug) {
    console.log("set trigger high");
    prep = us.now();
  }
  setTimeout(() => {
    if (debug) {
      console.log("set trigger low after " + (us.now() - prep) + " us");
    }
    hc_trigger.writeSync(0);
    let start = us.now();
    let failure = start;
    while (hc_echo.readSync() != 1) {
      start = us.now();
      if (start - failure > 100000) {
        callback({ status: "error", message: "no begin", state: -1 });
        failed = true;
        break;
      }
    }
    if (!failed) {
      let end = start;
      failure = end;
      while (hc_echo.readSync() != 0) {
        end = us.now();
        if (end - failure > 200000) {
          callback({ status: "error", message: "no echo", state: -2 });
          failed = true;
          break;
        }
      }
      if (!failed) {
        let time = end - start;
        let distance = time / 2 * 0.034;
        if (debug) {
          console.log("start: " + start + ", end: " + end);
          console.log("distance: " + distance);
        }
        let result = {
          status: "ok",
          distance: distance,
          open: distance < MAX_DISTANCE ? true : false
        }
        arduino.writeSync(result);
        callback(result);
      }
    }
  }, 15)
}


/***********************************
 * Endpoints
 *********************************/

/**
 * Endpoint für https://adresse:2015/
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
  } else {
    next()
  }
})


/**
 * Zugriffstest; wird vor alle https://server:2015/garage/... Anfragen POST requessts geschaltet
 * Wenn ein user gesperrt ist, dann prüfe, ob die Sperre abgelaufen ist. Wenn nein, abweisen
 * Sonst:
 * Wenn das Passwort korrekt ist, allfällige Sperren löschen
 * Wenn das Passwort falsch ist, Sperre erneut setzen, Dauer erhöhen (2^attempt*lock_time)
 */
app.post("/garage/*", function (request, response, next) {
  let user = request.body.username.toLocaleLowerCase()
  if (isLocked(failures[user])) {
    response.render("answer", { message: "Sperre wegen falscher Passworteingabe. Bitte etwas später nochmal versuchen." })
  } else {
    let password = encode(request.body.password)
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
 * Zugriffstest für Admin-Funktionen. Wird vor alle https://server:2015/adm/... GET requests geschaltet.
 * Gemeinsame Syntax: /adm/masterpassword/funktion/parameter.
 * Bei falschem Masterpasswort: Sperre setzen bzw. verlängern.
 */
app.get("/adm/:master/*", function (req, resp, next) {
  if (isLocked(failures.admin)) {
    resp.render("answer", { message: "Sperre wegen falscher Passworteingabe. Bitte etwas später nochmal versuchen." })
  } else {
    const master = encode(req.params.master)
    let stored = nconf.get("admin")
    if (!stored) {
      nconf.set("admin", master)
      stored = master
    }
    if (stored === master) {
      delete failures.admin
      next()
    } else {
      console.log("Admin-Fehler" + req.params.username + ", " + new Date())
      const secs = setLock("admin")
      resp.render("answer", {
        message: "Insufficient rights. Wait " + secs + " seconds."
      })
    }
  }
})

/**
 Nach dem Login-Screen und erfolgreicher Passworteingabe: Aktuellen Zustand des Tors anzeigen.
 */
app.post("/garage/login", function (request, response) {
  doorState(doorstate => {
    let action = doorstate.open ? "Schliessen" : "Öffnen";
    response.render("confirm", {
      name: request.body.username,
      pwd: request.body.password,
      status: doorstate.open ? "offen" : "geschlossen",
      action: action
    });

  })
})

/**
 * Tastendruck simulieren
 */
app.post("/garage/action", function (request, response) {
  console.log("Garage " + request.body.action + ", " + new Date())
  if (!operateGarage(function () {
    response.render("answer", {
      message: "Auftrag ausgeführt, " + request.body.username
    })
  })) {
    response.render("answer", { message: "Das Garagentor fährt gerade. Bitte warten." })
  }
})

/**
 * Einen neuen User eintragen. Als letzter Parameter muss das Master-Passwort angegeben werden.
 * Wenn bisher noch kein Master-Passwort existiert, wird es eingetragen.
 */
app.get("/adm/:master/add/:username/:password", function (req, resp) {
  const user = req.params.username.toLocaleLowerCase()
  const password = encode(req.params.password)
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

/**
 * Passwort ändern
 */
app.post("/garage/chpwd", function (req, resp) {
  let npwd = req.body.npwd
  if (npwd && npwd.length > 4 && /\d/.test(npwd) && /[a-zA-Z]/.test(npwd)) {
    nconf.set(req.body.username, encode(req.body.npwd))
    nconf.save()
    console.log(req.body.username + " changed password, " + new Date())
    resp.render("answer", { message: "Ab sofort gilt das neue Passwort" })
  } else {
    resp.render("answer", { message: "Das neue Passwort muss mindestens 5 Zeichen lang sein und sowohl Zahlen als auch Buchstaben enthalten." })
  }
})

/**
 * Logfile auslesen
 */
app.get("/adm/:master/log", function (req, resp) {
  fs.readFile("../forever.log", function (err, data) {
    if (err) {
      resp.render("answer", { message: err })
    } else {
      const lines = data.toString().split("\n")
      resp.render("answer", { message: "<p>" + lines.join("<br>") + "</p>" })
    }
  })
})

/****************************************************************
 * JSON Rest interface für Anwendung mit reinen Javascript Apps
 **************************************************************/

function checkCredentials(request) {
  if (request.body.username) {
    let user = request.body.username.toLocaleLowerCase()
    if (isLocked(failures[user])) {
      return "Sperre wegen falscher Passworteingabe. Bitte etwas später nochmal versuchen."
    } else {
      let password = encode(request.body.password)
      let valid = nconf.get(user)
      if (valid && valid === password) {
        console.log(new Date() + "- userok: " + request.body.username);
        delete failures[user]
        return ""
      } else {
        let secs = setLock(user)
        return "Wer bist denn du??? Sperre " + secs + " Sekunden."
      }
    }
  } else {
    return "Kein Username oder Passwort angegeben."
  }
}

/**
 * Script und View holen
 */
app.get("/rest", function (req, resp) {
  doorState(doorstate => {
    let state = doorstate.open ? 1 : 0;
    resp.render("direct", { state: state });
  })
})


/**
 * Garagentor fahren
 */
app.post("/rest/operate", function (request, response) {
  let auth = checkCredentials(request)
  if (auth == "") {
    if (!operateGarage(function () {
      doorState(state => {
        response.json({ "status": "ok", "state": state.open ? 1 : 0 })

      })
    })) {
      response.json({ "status": "error", message: "Das Garagentor fährt gerade. Bitte warten" })
    }
  } else {
    response.json({ status: "error", message: auth })
  }
})

/**
 * Status des Garagentors abfragen (0 geschlossen,1 offen)
 */
app.post("/rest/state", function (request, response) {
  let auth = checkCredentials(request)
  if (auth == "") {
    doorState(state => {
      response.json({ "status": "ok", "state": state.open ? 1 : 0 });
    })
  } else {
    response.json({ status: "error", message: auth })
  }
})

app.get("/rest/check", function (req, resp) {
  console.log("check doorstate");
  doorState(state => {
    resp.json({ "state": state });
  })
})

