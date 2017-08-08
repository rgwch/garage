$(function () {

  let state = $('#opener').attr("data-status")
  console.log("state is " + state)
  setState(state)

  $(window).focus(function(){
    let user = localStorage.getItem("garage_username")
    let pwd = localStorage.getItem("garage_password")
    console.log("focus")
    $.ajax({
      type: "POST",
      url: "/rest/state",
      data: {"username": user, "password": pwd},
      success: function (res) {
        if (res.status === "ok") {
          setState(res.state)
        }else{
          alert(res.message)
        }
      },
      error: function (err) {
        alert(JSON.stringify(err))
      },
      dataType: "json"
    });
  })

  $('#opener').click(function () {
    let user = localStorage.getItem("garage_username")
    let pwd = localStorage.getItem("garage_password")
    if (user && pwd) {
      setState(2)
      $.ajax({
        type: "POST",
        url: "/rest/operate",
        data: {"username": user, "password": pwd},
        success: function (res) {
          if (res.status === "ok") {
            setState(res.state)
          }else{
            alert(res.message)
          }
        },
        error: function (err) {
          alert(JSON.stringify(err))
        },
        dataType: "json"
      });
    } else {
      $('#opener').hide()
      $('#credentials').show()
      $('#setcred').click(function () {
        localStorage.setItem("garage_username", $('#uname').val())
        localStorage.setItem("garage_password", $('#pwd').val())
        $('#credentials').hide()
        $('#opener').show()
      })
    }
  })

  function clearState() {
    $('#garopen').hide()
    $('#garclosed').hide()
    $('#garquestion').hide()
    $('#garunning').hide()
  }

  function setState(state) {
    clearState()
    if (state == 1) {
      $('#garopen').show()
    } else if (state == 0) {
      $('#garclosed').show()
    } else if(state==2){
      $('#garunning').show()
    }else {
      $('#garquestion').show()
    }
  }
})
