/**
 *  Garagentor-Fernbedienung mit Raspberry Pi
 *  (c) 2017-2021 by G. Weirich
 * 
 * Clientseitiges Skript
 */

$(function () {
  let lastState;
  let timer;
  // $('#abstandaus').show();

  function setTimer(on) {
    if (on) {
      if (!timer) {
        timer = setInterval(() => {
          //console.log("ping");
          if (!doCall("/rest/state")) {
            askCredentials();
          }
        }, 4000)
      }
    } else {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }
  }

  if (!doCall("rest/state")) {
    askCredentials();
  }
  setTimer(true);

  $(window).focus(function () {
    // Alle 4 Sekunden Status prüfen, solange das Programm den Focus hat
    setTimer(true)
  })

  $(window).blur(function () {
    setTimer(false);
  })

  // User hat auf den Öffner geklickt. Wenn er abgewiesen wird: Credentials eintragen.
  $('#opener').click(function () {
    // console.log("vor:" + doorstate)
    // setPicture(parseInt(doorstate) === 0 ? 2 : 3)
    if (!doCall("/rest/operate")) {
      askCredentials();
    }
  })

  // User hat auf den Lichtschalter geklickt. Licht ein oder ausschalten
  $('#light').click(function () {
    if (!doCall("/rest/light")) {
      askCredentials();
    }
  })

  function askCredentials() {
    $('#opener').hide()
    $('#credentials').show()
    $('#setcred').click(function () {
      localStorage.setItem("garage_username", $('#uname').val())
      localStorage.setItem("garage_password", $('#pwd').val())
      $('#credentials').hide()
      $('#opener').show()
    })

  }
  function clearPicture() {
    $('#garopen').hide()
    $('#garclosed').hide()
    $('#garquestion').hide()
    $('#garopening').hide()
    $('#garclosing').hide()
    $('#licht_aus').hide()
    $('#licht_an').hide()
  }

  // Passende Icons je nach Tor-Zustand setzen
  function setPicture(status) {
    clearPicture()
    if (status.state == "running") {
      $('#garopening').show();
    } else if (status.state == "open") {
      $('#garopen').show();
    } else if (status.state == "closed") {
      $('#garclosed').show();
    } else {
      $('#garquestion').show();
    }
    if (status.light) {
      $('#licht_an').show();
    } else {
      $('#licht_aus').show();
    }

  }

  // REST POST request mit Credentials absetzen
  function doCall(addr, extra) {
    let user = localStorage.getItem("garage_username")
    let pwd = localStorage.getItem("garage_password")
    if (user && pwd) {
      $.ajax({
        type: "POST",
        url: addr,
        data: { "username": user, "password": pwd, "extra": extra },
        success: function (res) {
          if (res.status === "ok") {
            //console.log("nach: " + res.state)
          } else {
            if (res.message && res.message.startsWith("Wer")) {
              res.state = "unknown"
              localStorage.removeItem("garage_password")
            }
            alert(res.message)
          }
          lastState = res;
          setPicture(res);
        },
        error: function (err) {
          lastState = { status: "error", state: "unknown", warner: false }
          setPicture(lastState);
          alert(JSON.stringify(err))
        },
        dataType: "json"
      });
      return true
    } else {
      return false
    }

  }

})
