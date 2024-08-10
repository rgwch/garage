/**
 *  Garagentor-Fernbedienung mit Raspberry Pi
 *  (c) 2024 by G. Weirich
 * 
 * Clientseitiges Skript für moderne Browser
 */

let opener;
let credentials;
let garopen;
let garclosed;
let garquestion;
let garopening;
let garclosing;


document.onload = async () => {
    if (!await doCall("rest/state")) {
        askCredentials();
    }
    window.onfocus = () => {
        setTimer(true);
    }
    window.onblur = () => {
        setTimer(false);
    }
    opener = document.getElementById("opener");
    garopen = document.getElementById("garopen");
    garclosed = document.getElementById("garclosed");
    garquestion = document.getElementById("garquestion");
    garopening = document.getElementById("garopening");
    garclosing = document.getElementById("garclosing");

    opener.onclick = async () => {
        if (!await doCall("/rest/operate")) {
            askCredentials();
        }
    }
}


function askCredentials() {
    opener.style.display = "none";
    credentials = document.getElementById("credentials");
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
                //console.log("ping");
                if (!doCall("/rest/state")) {
                    askCredentials();
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

async function doCall(addr, extra) {
    let user = localStorage.getItem("garage_username")
    let pwd = localStorage.getItem("garage_password")
    if (user && pwd) {
        const result = await fetch(addr, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ "username": user, "password": pwd, "extra": extra })
        });
    }
    if (result.ok) {
        const res = await result.json();
        if (res.status === "ok") {
            setPicture(res);
        } else {
            if (res.message && res.message.startsWith("Wer")) {
                res.state = "unknown";
                localStorage.removeItem("garage_password");
            }
            alert(res.message);
        }
    } else {
        alert(result.statusText);
    }
    /*
    let xhr = new XMLHttpRequest();
    xhr.open("POST", addr, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            let res = JSON.parse(xhr.responseText);
            if (res.status === "ok") {
                setPicture(res);
            } else {
                if (res.message && res.message.startsWith("Wer")) {
                    res.state = "unknown";
                    localStorage.removeItem("garage_password");
                }
                alert(res.message);
            }
        }
    }
    xhr.send(JSON.stringify({ "username": user, "password": pwd, "extra": extra }));
    return true;
    */
}
return false;
}
