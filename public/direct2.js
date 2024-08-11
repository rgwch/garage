/**
 *  Garagentor-Fernbedienung mit Raspberry Pi
 *  (c) 2024 by G. Weirich
 * 
 * Clientseitiges Skript für moderne Browser
 */
"use strict";

let timer;
let waiting = false;
const credentials = document.getElementById("credentials");
const opener = document.getElementById("opener");
const garopen = document.getElementById("garopen");
const garclosed = document.getElementById("garclosed");
const garquestion = document.getElementById("garquestion");
const garopening = document.getElementById("garopening");
const garclosing = document.getElementById("garclosing");

setPicture({ state: "unknown" });
doCall("rest/state");

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
    credentials.style.display = "block";
    const setcred = document.getElementById("setcred");
    setcred.onclick = () => {
        let user = document.getElementById("uname").value;
        let pwd = document.getElementById("pwd").value;
        if (user && pwd) {
            localStorage.setItem("garage_username", user)
            localStorage.setItem("garage_password", pwd)
            credentials.style.display = "none";
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
        if (!timer) {
            timer = setInterval(() => {
                if (!waiting) {
                    doCall("/rest/state")
                }
            }, 2000)
        }
    } else {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }
}

async function doCall(addr) {
    let user = localStorage.getItem("garage_username")
    let pwd = localStorage.getItem("garage_password")
    if (user && pwd) {
        const result = await fetch(addr, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ "u": user, "p": pwd })
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
