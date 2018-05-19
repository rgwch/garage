/**
 *  Garagentor-Fernbedienung mit Raspberry Pi
 *  (c) 2017-2018 by G. Weirich
 * 
 * Clientseitiges Skript
 */

$(function () {

  let doorstate = $('#opener').attr("data-status")
  setPicture(doorstate)
  let timer

  // Alle 2 Sekunden Status prüfen, solange die App läuft
  $(window).focus(function () {
    timer = setInterval(() => {
      doCall("/rest/state")
    }, 2000)

  })

  $(window).blur(function () {
    if (timer) {
      clearInterval(timer)
      timer = undefined;
    }
  })

  // User hat auf den Öffner geklickt. Wenn er abgewiesen wird: Credentials eintragen.
  $('#opener').click(function () {
    // console.log("vor:" + doorstate)
    // setPicture(parseInt(doorstate) === 0 ? 2 : 3)
    if (!doCall("/rest/operate")) {
      $('#opener').hide()
      $('#credentials').show()
      $('#setcred').click(function () {
        localStorage.setItem("garage_username", $('#uname').val())
        localStorage.setItem("garage_password", $('#pwd').val())
        $('#credentials').hide()
        $('#opener').show()
        $('#opener').click()
      })
    }
  })

  function clearPicture() {
    $('#garopen').hide()
    $('#garclosed').hide()
    $('#garquestion').hide()
    $('#garopening').hide()
    $('#garclosing').hide()
  }

  // Passendes Icon je nach Tor-Zustand setzen
  function setPicture(state) {
    clearPicture()
    switch (parseInt(state)) {
      case 0:
        $('#garclosed').show();
        break;
      case 1:
        $('#garopen').show();
        break;
      case 2:
        $('#garopening').show();
        break;
      case 3:
        $('#garclosing').show();
        break;
      default:
        $('#garquestion').show()
    }
  }

  // REST POST request mit Credentials absetzen
  function doCall(addr) {
    let user = localStorage.getItem("garage_username")
    let pwd = localStorage.getItem("garage_password")
    if (user && pwd) {
      $.ajax({
        type: "POST",
        url: addr,
        data: { "username": user, "password": pwd },
        success: function (res) {
          if (res.status === "ok") {
            // console.log("nach: " + res.state)
            doorstate = res.state
          } else {
            if (res.message.startsWith("Wer")) {
              doorstate = 4
              localStorage.removeItem("garage_password")
            }
            alert(res.message)
          }
          setPicture(doorstate)
        },
        error: function (err) {
          doorstate = 4
          setPicture(4)
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
