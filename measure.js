/**
 *  Garagentor-Fernbedienung mit Raspberry Pi
 *  (c) 2017-2018 by G. Weirich
 *
 *  Ultraschall-Ping Modul   
 */
const us = require('microseconds');

/**
 * Modernisiertes "sleep" mit async/await bzw. Promises: 
 * Die Promise resolved nach der gewünschten Zeit.
 * @param ms: Zeit in Millisekunden
 */
const sleep = function (ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

/**
 * Einen einzelnen Echo-Pin absetzen und die gemessene Distanz zurückliefern
 * @param {*} trigger Pin, auf dem der Trigger liegt
 * @param {*} echo Pin, auf dem das Echo ankommt
 * @returns eine Promise mit einer Rückmeldung:
 * {
 *  status: "ok" | "error"
 *  distance: (gemessene distanz in cm) 
 *  message: "in range" | "too short" | "too far"
 * }
 */
module.exports = async function ping(trigger, echo) {
  const debug = false;
  await sleep(10)
  trigger.writeSync(0); // Startzustand standardisieren
  await sleep(5);
  trigger.writeSync(1);
  // trigger muss mindestens 15us high sein. Wir geben ihm 2ms
  await sleep(2);
  // Wenn dann Trigger auf LOW gesetzt wird, wird ein Ultrachall-Impuls abgeschickt.
  trigger.writeSync(0);
  // Der Sensor setzt ECHO  auf HIGH, wenn der Impuls abgeht
  // Wenn allerdings die Distanz zu kurz ist, ist ECHO schon wieder LOW, bevor wir hier sind
  // wir "faken" dann eine 10cm  Distanz.

  let start = us.now();
  let failure = start;

  while (echo.readSync() != 1) {
    start = us.now();
    if (start - failure > 10000) {
      if (debug == true) {
        console.log(start - failure)
      }
      return ({ status: "ok", distance: 10, message: "too short" });
    }
  }

  let end = start;
  failure = end;
  // Wenn das Echo empfangen wird, geht ECHO auf wieder LOW. Die maximale messbare Distanz ist irgendwo bei 
  // 300cm, entsprechend 8800 us bzw. rund 18000 us für hin und zurück
  while (echo.readSync() != 0) {
    end = us.now();
    if (end - failure > 18000) {
      return ({ status: "ok", distance: 300, message: "too far" });
    }
  }
  // Aus der Zeit zwischen ECHO-HIGH und ECHO-LOW errechnen wir die Distanz
  // (Schallgeschwindigkeit: 340 m/s = 340mm/ms = 0.34 mm/us = 0.034 cm/us )
  let time = end - start;
  let distance = time / 2 * 0.034;
  return ({ status: "ok", distance: distance, message: "in range" })
}

