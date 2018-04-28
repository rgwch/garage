export function ping(trigger,echo){
  let prep;
  let failed = false;
  trigger.writeSync(0); // Startzustand standardisieren
  
  
  // trigger muss mindestens 15us high sein. Wir geben ihm 5ms
  trigger.writeSync(1);
  if (debug) {
    console.log("set trigger high");
    prep = us.now();
  }
  setTimeout(() => {
    if (debug) {
      console.log("set trigger low after " + (us.now() - prep) + " us");
    }
    // Wenn dann Trigger auf LOW gesetzt wird, wird ein Ultrachall-Impuls abgeschickt.
    trigger.writeSync(0);
    let start = us.now();
    let failure = start;
    // Danach setzt der Sensor ECHO  auf HIGH
    while (echo.readSync() != 1) {
      start = us.now();
      if (start - failure > 100000) {
        callback({ status: "error", message: "no begin", state: -1 });
        failed = true;
        break;
      }
    }
    if (!failed) {
      let end = start;
      failure = end;
      // Wenn das Echo empfangen wird, geht ECHO auf LOW.
      while (echo.readSync() != 0) {
        end = us.now();
        if (end - failure > 200000) {
          callback({ status: "error", message: "no echo", state: -2 });
          failed = true;
          break;
        }
      }
      if (!failed) {
        // Aus der Zeit zwischen ECHO-HIGH und ECHO-LOW errechnen wir die Distanz
        let time = end - start;
        let distance = time / 2 * 0.034;
        if (debug) {
          console.log("start: " + start + ", end: " + end);
          console.log("distance: " + distance);
        }
        let result = {
          status: "ok",
          distance: distance,
          open: distance < MAX_DISTANCE ? true : false
        }
        // Wenn das Tor offen ist, schalten wir den Arduino an (Distanzwarner an der Stirnwand)
        arduino.writeSync(result);
        // Und melden das Resultat an den client.
        callback(result);
      }
    }
  }, 5)
}

