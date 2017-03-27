/**
 *  Garagentor-Fernbedienung mit Raspberry Pi
 *  (c) 2017 by G. Weirich
 */

"use strict"
// Pin des piface für den output. pin 1 ist das linke Relais.
const output_pin = 1
// pin für den Schalter, der feststellt, ob das Garagentor offen ist
const input_pin = 0
// Dauer des simulierten Tastendrucks in Millisekunden
const time_to_push = 1500
// Damit wir das Programm auf einem normalen PC testen können. Wenn es auf dem echten Pi läuft, true setzen
const realpi = false
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
const failures={}

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
        digital_write: function() {},
        digital_read: function(pin) {
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
app.get("/", function(request, response) {
    response.render("garage")
})

/*
 Check ob der Server inaktiv geschaltet ist
*/
app.post("/*", function(req, resp, next) {
    if (disabled) {
        resp.render("answer", {
            message: "Sorry, server is paused"
        })
    } else {
        next()
    }
})

app.post("/garage/*", function(request, response, next) {
    let user = request.body.username.toLocaleLowerCase()
    let password = JSON.stringify(hash(request.body.password + salt))
    let valid = nconf.get(user)
    if (valid && valid === password) {
        delete failures[user]
        next()
    } else {
        console.log("Loginfehler mit Name " + user + ", " + new Date())
        let attempts=failures[user]
        if(attempts){
          attempts+=1
        }else{
          attempts=1
        }
        disabled=true
        setTimeout(function(){
          disabled=false
        },2000)
        response.render("answer", {
            message: "Wer bist denn du???"
        })
    }
})

app.get("/adm/*",function(req,resp,next){

})
/*
 Nach dem Login-Screen: Aktuellen Zustand des Tors anzeigen, wenn Username udn Passwort stimmen
 */
app.post("/garage/login", function(request, response) {
    let state = pfio.digital_read(input_pin)
    let action = state == 1 ? "Schliessen" : "Öffnen"
    response.render("confirm", {
        name: request.body.username,
        pwd: request.body.password,
        status: state == 1 ? "offen" : "geschlossen",
        action: action
    })

})

/*
 "Taste drücken", wenn username und passwort stimmen
 */
app.post("/garage/action", function(request, response) {
    console.log("Garage " + request.body.action + ", " + new Date())
    pfio.digital_write(output_pin, 1)
    setTimeout(function() {
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
app.get("/adduser/:username/:password/:master", function(req, resp) {
    let master = JSON.stringify(hash(req.params.master + salt))
    let stored = nconf.get("admin")
    if (!stored) {
        nconf.set("admin", master)
        stored = master
    }
    if (stored === master) {
        var user = req.params.username.toLocaleLowerCase()
        var password = JSON.stringify(hash(req.params['password'] + salt))
        nconf.set(user, password)
        nconf.save()
        resp.render("answer", {
            message: "Ok"
        })
    } else {
        console.log("Admin-Fehler bei adduser mit Name " + req.params.username + ", " + new Date())
        resp.render("answer", {
            message: "Insufficient rights"
        })
    }
})

/**
 * Einen User löschen. Als letzter Parameter muss das Master-Passwort angegeben werden.
 * Wenn bisher noch kein Master-Passwort existiert, wird es eingetragen..
 */
app.get("/remove/:username/:master", function(req, resp) {
    let master = JSON.stringify(hash(req.params.master + salt))
    let stored = nconf.get("admin")
    if (!stored) {
        nconf.set("admin", master)
        stored = master
    }
    if (stored === master) {
        nconf.set(req.params.username, undefined)
        nconf.save()
        resp.render("answer", {
            message: "ok"
        })
    } else {
        console.log("Admin-Fehler bei remove mit Name " + req.params.username + ", " + new Date())
        resp.render("answer", {
            message: "Insufficient rights"
        })
    }
})

/**
 * Server inaktiv schalten. Als Parameter muss das Master-Passwort angegeben werden.
 * Wenn bisher noch kein Master-Passwort existiert, wird es eingetragen.
 */
app.get("/disable/:master", function(req, resp) {
    let master = JSON.stringify(hash(req.params.master + salt))
    let stored = nconf.get("admin")
    if (stored === master) {
        disabled = true
        resp.render("answer", {
            message: "disabled"
        })
    } else {
        console.log("Admin-Fehler bei disable, " + new Date())
        resp.render("answer", {
            message: "Insufficient rights"
        })
    }
})

/**
 * Server aktiv schalten.  Als Parameter muss das Master-Passwort angegeben werden.
 * Wenn bisher noch kein Master-Passwort existiert, wird es eingetragen.
 */
app.get("/enable/:master", function(req, resp) {
    let master = JSON.stringify(hash(req.params.master + salt))
    let stored = nconf.get("admin")
    if (stored === master) {
        disabled = false
        resp.render("answer", {
            message: "enabled"
        })
    } else {
        console.log("Admin-Fehler bei enable, " + new Date())
        resp.render("answer", {
            message: "Insufficient rights"
        })
    }
})
