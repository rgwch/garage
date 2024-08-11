/**
 *  Garagentor-Fernbedienung mit Raspberry Pi
 *  (c) 2024 by G. Weirich
 * 
 * Clientseitiges Skript für moderne Browser
 */
"use strict";

let t;
let waiting = false;
const cred = document.getElementById("credentials");
const opener = document.getElementById("opener");
const garopen = document.getElementById("garopen");
const garclosed = document.getElementById("garclosed");
const garquestion = document.getElementById("garquestion");
const garopening = document.getElementById("garopening");
const garclosing = document.getElementById("garclosing");

setPicture({ state: "unknown" });
doCall("/rest/state");

window.onfocus = () => {
    if (!waiting) {
        setTimer(true);
    }
}
window.onblur = () => {
    setTimer(false);
}

opener.onclick = async () => {
    await doCall("/rest/operate")
}



function askCredentials() {
    waiting = true
    setTimer(false);
    opener.style.display = "none";
    cred.style.display = "block";
    const setcred = document.getElementById("setcred");
    setcred.onclick = () => {
        let u = document.getElementById("uname").value;
        let p = document.getElementById("pwd").value;
        if (u && p) {
            localStorage.setItem("garage_username", u)
            localStorage.setItem("garage_password", p)
            cred.style.display = "none";
            opener.style.display = "block";
            setTimer(true);
            waiting = false
        }
    }
}

function clearPicture() {
    garopen.style.display = "none";
    garclosed.style.display = "none";
    garquestion.style.display = "none";
    garopening.style.display = "none";
    garclosing.style.display = "none";
}

function setPicture(status) {
    clearPicture();
    switch (status.state) {
        case "running":
            garopening.style.display = "block";
            break;
        case "open":
            garopen.style.display = "block";
            break;
        case "closed":
            garclosed.style.display = "block";
            break;
        default:
            garquestion.style.display = "block";
            break;
    }
}
function setTimer(on) {
    if (on) {
        if (!t) {
            t = setInterval(() => {
                if (!waiting) {
                    doCall("/rest/state")
                }
            }, 2000)
        }
    } else {
        if (t) {
            clearInterval(t);
            t = null;
        }
    }
}

async function doCall(addr) {
    const u = localStorage.getItem("garage_username")
    const p = localStorage.getItem("garage_password")
    if (u && p) {
        const result = await fetch(addr, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ u, p })
        });

        if (result.ok) {
            const res = await result.json();
            if (res.status === "ok") {
                setPicture(res);
            } else {
                if (res.message && res.message.startsWith("Wer")) {
                    res.state = "unknown";
                    localStorage.removeItem("garage_password");
                    askCredentials();
                } else {
                    alert(res.message);
                }
            }

        } else {
            alert(result.statusText);
        }
        return true;
    } else {
        askCredentials();
    }
}
