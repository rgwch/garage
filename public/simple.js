/**
 *  Garagentor-Fernbedienung mit Raspberry Pi
 *  (c) 2017 by G. Weirich
 */

function enterPwd() {
  var npwd = prompt("Neues Passwort eingeben")
  if (npwd != null) {
    var param = {
      "username": document.getElementById('uname').value,
      "password": document.getElementById('pwd').value,
      "npwd": npwd
    }
    req=new XMLHttpRequest()
    req.open("POST", "/garage/chpwd")
    req.setRequestHeader("Content-Type","application/json")
    /*
    req.addEventListener("load",function(event){
      console.log(event)
      console.log(req.response)
    })
    */
    req.onreadystatechange = function() {
      if (req.readyState == XMLHttpRequest.DONE) {
        document.open()
        document.write(req.responseText)
        document.close()
      }
    }
    req.send(JSON.stringify(param))
  }
}
