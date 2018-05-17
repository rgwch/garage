const us = require('microseconds');

export async function ping(trigger, echo) {
  //const debug = true;
  trigger.writeSync(0); // Startzustand standardisieren
  await sleep(10);
  trigger.writeSync(1);
  // trigger muss mindestens 15us high sein. Wir geben ihm 5ms
  await sleep(5);
  // Wenn dann Trigger auf LOW gesetzt wird, wird ein Ultrachall-Impuls abgeschickt.
  trigger.writeSync(0);
  let start = us.now();
  let failure = start;
  // Danach setzt der Sensor ECHO  auf HIGH
  while (echo.readSync() != 1) {
    start = us.now();
    if (start - failure > 100000) {
      return ({ status: "error", message: "no begin"});
    }
  }
  let end = start;
  failure = end;
  // Wenn das Echo empfangen wird, geht ECHO auf LOW.
  while (echo.readSync() != 0) {
    end = us.now();
    if (end - failure > 200000) {
      return ({ status: "error", message: "no echo"});
    }
  }
  // Aus der Zeit zwischen ECHO-HIGH und ECHO-LOW errechnen wir die Distanz
  let time = end - start;
  let distance = time / 2 * 0.034;
  return ({ status: "ok", distance: distance })
}

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}