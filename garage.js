/**
 *  Garagentor-Fernbedienung mit Raspberry Pi
 *  (c) 2017-2018 by G. Weirich
 * 
 * 8.4.2018: Verwende Ultraschall Sensor HC SR 04 zum feststellen, wo das Garagentor steht anstelle des 
 * Mikroschalters. Damit wird das Problem behoben, dass die Anzeige unzuverlässig ist, weil das Garagentor
 * nicht immer exakt am selben Ort anhält (abhängig von Temperatur, Luftfeuchtigkeit, Gespenstern usw.)
 * Wir vereinfachen das: Wenn die Oberkante des Garagentors näher als MAX_DISTANCE vom Sensor ist, 
 * betrachten wir es als offen.
 * 15.4.2018: Wechsel vom PiFace auf ein Standard-Relais, das mit onoff geschaltet wird. 
 * Ausserdem neue Funktion: Abstandswarner an der Stirnseite der Garage einschalten, wenn das Tor offen ist.
 */

/* eslint-disable no-console*/
"use strict"

// Damit wir das Programm auf einem normalen PC ohne GPIO testen können. Wenn es auf dem echten Pi läuft, true setzen
const realpi = false;
//const debug = false;

// Pin-Definitionen
const GPIO_GARAGE = 18;   // Relais für Garagentorantrieb
const GPIO_ARDUINO = 23;  // Relais für Strom für den Abstandswarner
const GPIO_ECHO = 15;     // Echo vom HC-SR-04
const GPIO_TRIGGER = 14;  // Trigger für den HC-SR-04

// Welcher Pin-Zustand den Aktor einschaltet. Hängt vom verwendeten Relais-Typ ab
const ON = 0;
const OFF = 1;

// Maximaldistanz, bis zu der das Garagentor als offen erkannt wird.
const MAX_DISTANCE = 100;

// Dauer des simulierten Tastendrucks in Millisekunden
const time_to_push = 900
// Dauer des Öffnungs/Schliessvorgangs des Tors in ms
const time_to_run = 17000
// Aussperren bei falscher Passworteingabe in ms
const lock_time = 3000

const fs = require('fs')
const ping = require('./measure');
const https = require('https')
const express = require('express')
const nconf = require('nconf')
const hash = require('crypto-js/sha256')
const path = require('path')
const bodyParser = require('body-parser');
const salt = "um Hackern mit 'rainbow tables' die Suppe zu versalzen"
const favicon = require('serve-favicon');

nconf.file(__dirname + '/users.json')
const app = express()
// Dieses Flag nutzen wir später, um den Server temporär inaktiv zu schalten.
let disabled = false;
// Dieses Flag zeigt an, dass das Garagentor gerade fährt
let running = false
// Hier sammeln wir schiefgegangene Login-Versuche
const failures = {}
// wenn true, wird der Arduino nicht automatisch ausgeschaltet.
let arduino_manual = false;

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

let src = __dirname
https.createServer({
  key: fs.readFileSync(src + '/key.pem'),
  cert: fs.readFileSync(src + '/cert.pem')
}, app).listen(2017)

// Auf einem echten Pi ist Gpio auf onoff (https://www.npmjs.com/package/onoff) gesetzt
// Auf einem anderen PC wird es einfach mit leeren Funktionen simuliert.

let relay
let hc_trigger
let hc_echo
let arduino

if (realpi) {
  const Gpio = require('onoff').Gpio;

  relay = new Gpio(GPIO_GARAGE, 'high');
  hc_trigger = new Gpio(GPIO_TRIGGER, 'out');
  hc_echo = new Gpio(GPIO_ECHO, 'in');
  arduino = new Gpio(GPIO_ARDUINO, 'high');
} else {
  let Fake = require('./fakegpio')
  relay = new Fake(GPIO_GARAGE, 'out');
  hc_trigger = new Fake(GPIO_TRIGGER, 'out');
  hc_echo = new Fake(GPIO_ECHO, 'in');
  arduino = new Fake(GPIO_ARDUINO, 'out');

}

relay.writeSync(OFF);
arduino.writeSync(OFF);

/**
 * Expressjs sagen, dass die Views im Verzeichnis "views" zu finden sind, und dass
 * pug (ex-Jade) benötigt wird, um sie nach HTML zu konvertieren.
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
 * @param pwd Klartext-Passwort
 * @returns sha256 gehashtes mit salt modifiziertes Passwort
 */
function encode(pwd) {
  const encoded = JSON.stringify(hash(pwd + salt))
  return encoded
}

/**
 Check, ob der aktuelle Anwender gesperrt ist
 @returns {boolean} true, wenn er gesperrt ist
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
 * Sicherstellen, dass der Abstandswarner maximal 5 Minuten lang eingeschaltet ist.
 * Ausser, wenn er erneut eingeschaltet wird, dann Timeout neu starten.
 */
let time_on;
function arduino_switch(newstate){
  if(newstate){
  if(arduino.readSync()==ON){
    clearTimeout(time_on);
  }else{
    arduino.writeSync(ON);
  }
  
  time_on=setTimeout(function(){
    arduino.writeSync(OFF);
  },60000)
}else{
  clearTimeout(time_on);
  arduino.writeSync(OFF);
}
 
}
/**
 "Taste drücken".  Kontakt wird für time_to_push Millisekunden geschlossen. Für time_to_run Millisekunden werden
 keine weiteren Kommandos entgegengenommen, um dem Tor Zeit zu geben, ganz hoch oder runter zu fahren.
 @returns true, wenn der Befehl ausgeführt wurde, false, wenn das Garagentor schon fährt.
 */
function operateGarage() {
  if (running) {
    return false
  } else {
    running = true
    relay.writeSync(ON);
    setTimeout(function () {
      relay.writeSync(OFF)
    }, time_to_push);
    setTimeout(function () {
      running = false
    }, time_to_run)
    return true
  }
}

/**
 * Entfernung messen. Wir messen mehrmals
 * und nehmen dann den Median als Resultat.
 * Wenn das Tor offen ist, Arduino-Abstandswarner einschalten, sonst ausschalten.
 * @param callback: Wird mit einer state-Meldung:
 * {
 *    status: "ok"|"error",
 *    distance: (distanz in cm),
 *    state: "open"|"running"|"closed" ,
 *    warner: true, wenn der Abstandswarner eingeschaltet ist
 *    message: (Fehlermeldung bei Fehler)
 * }
 * aufgerufen
 */
async function getDoorState() {
  if (running) {
    return {
      status: "ok",
      state: "running",
      warner: arduino.readSync() == ON ? true : false
    }
  } else {
    let measurements = []
    const num = 3;  // Zahl der Messungen
    for (let i = 0; i <= num; i++) {
      measurements.push(await ping(hc_trigger, hc_echo));
    }
    // Median der Messungen ist das Endresultat
    let sorted = measurements.sort((a, b) => a.distance - b.distance)
    // console.log(JSON.stringify(sorted));
    let result = sorted[Math.floor(num / 2)];
    result.state = result.distance < MAX_DISTANCE ? "open" : "closed"
    if (!arduino_manual) {
      arduino_switch(result.state=="open");
      //let setarduino = result.state == "open" ? ON : OFF
      //arduino.writeSync(setarduino);
      result.warner =  (result.state=="open")
    } else {
      result.warner = true;
    }
    return result;
  }
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
 * Zugriffstest; wird vor alle https://server:2015/garage/... POST requests geschaltet
 * Wenn ein User gesperrt ist, dann prüfe, ob die Sperre abgelaufen ist. Wenn nein, abweisen
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
  getDoorState().then(doorstate => {
    let action = doorstate.state=="open" ? "Schliessen" : "Öffnen";
    response.render("confirm", {
      name: request.body.username,
      pwd: request.body.password,
      status: doorstate.state=="open" ? "offen" : "geschlossen",
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
 * Einen neuen User eintragen. Als :master muss das Master-Passwort angegeben werden.
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
 * Einen User löschen. Als :master muss das Master-Passwort angegeben werden.
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
 * Server inaktiv schalten. Als :master muss das Master-Passwort angegeben werden.
 * Wenn bisher noch kein Master-Passwort existiert, wird es eingetragen.
 */
app.get("/adm/:master/disable", function (req, resp) {
  disabled = true
  resp.render("answer", {
    message: "disabled"
  })
})

/**
 * Server aktiv schalten.  Als :master muss das Master-Passwort angegeben werden.
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
  fs.readFile("/var/logs/garage.log", function (err, data) {
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

/**
 * Username und Passwort prüfen
 * @param request das Request-Objekt
 * @returns "" wenn alls iO ist, sonst eine Fehlermeldung
 */
function checkCredentials(request) {
  if (request.body.username) {
    let user = request.body.username.toLocaleLowerCase()
    if (isLocked(failures[user])) {
      console.log(new Date() + " locked user tries to login " + request.body.username);
      return "Sperre wegen falscher Passworteingabe. Bitte etwas später nochmal versuchen."
    } else {
      let password = encode(request.body.password)
      let valid = nconf.get(user)
      if (valid && valid === password) {
        // console.log(new Date() + "- userok: " + request.body.username);
        delete failures[user]
        return ""
      } else {
        let secs = setLock(user)
        console.log(new Date() + " - user failed: " + request.body.username + "," + request.body.password);
        return "Wer bist denn du??? Sperre " + secs + " Sekunden."
      }
    }
  } else {
    return "Kein Username oder Passwort angegeben."
  }
}

/**
 * Web-App-Script und View holen
 */
app.get("/rest", function (req, resp) {
  getDoorState().then(doorState => {
    resp.render("direct", { doorState: doorState });
  })
})


/**
 * Garagentor fahren
 */
app.post("/rest/operate", function (request, response) {
  let auth = checkCredentials(request)
  if (auth == "") {
    if (operateGarage()) {
      response.json({status: "ok",state: "running", warner: arduino.readSync() == ON ? true : false})
    }else{
      response.json({ "status": "error", message: "Das Garagentor fährt gerade. Bitte warten" })
    }
  } else {
    response.json({ status: "error", message: auth })
  }
})

/**
 * Arduino-Abstandswarner ein oder ausschalten
 */
app.post("/rest/warner", async function (req, resp) {
  let auth = checkCredentials(req);
  if (auth == "") {
    if (req.body.extra === "on") {
      arduino_manual = true;
    } else {
      arduino_manual = false;
    }
    arduino_switch(arduino_manual);
    resp.json(await getDoorState());
  } else {
    resp.json({ status: "error", message: auth })
  }
})

/**
 * Status des Garagentors abfragen
 */
app.post("/rest/state", async function (request, response) {
  let auth = checkCredentials(request)
  if (auth == "") {
    response.json(await getDoorState());
  } else {
    response.json({ status: "error", message: auth })
  }
})


/** comment out functions below in productive code */

app.get("/rest/checkecho", async function (req, resp) {
  console.log("check doorstate");
  resp.json(await getDoorState());
  })

app.get("/rest/checkrelais", function (rea, resp) {
  console.log("check relay");
  if (operateGarage(() => {
    resp.json({ status: "ok" });
  }) == false) {
    resp.json("status: running");
  }

});

app.get("/rest/checkarduino", (req, resp) => {
  console.log("checkarduino");
  arduino.writeSync(ON);
  resp.json({ status: "arduino on" });
});

app.get("/rest/stoparduino", (req, resp) => {
  console.log("stop arduino");
  arduino.writeSync(OFF);
  resp.json({ status: "arduino off" });
});
