/**
 *  Garagentor-Fernbedienung mit Raspberry Pi
 *  (c) 2017 by G. Weirich
 */

$(function () {

  let doorstate = $('#opener').attr("data-status")
  setPicture(doorstate)

  $(window).focus(function () {
    doCall("/rest/state")
  })
  $('#opener').click(function () {
    console.log("vor:" +doorstate)
    setPicture(parseInt(doorstate) === 0 ? 2 : 3)
    if (!doCall("/rest/operate")){
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

  function doCall(addr) {
    let user = localStorage.getItem("garage_username")
    let pwd = localStorage.getItem("garage_password")
    if (user && pwd) {
      $.ajax({
        type: "POST",
        url: addr,
        data: {"username": user, "password": pwd},
        success: function (res) {
          if (res.status === "ok") {
            console.log("nach: "+res.state)
            doorstate = res.state
          } else {
            if(res.message.startsWith("Wer")) {
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
