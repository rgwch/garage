/**
 *  Garagentor-Fernbedienung mit Raspberry Pi
 *  (c) 2017-2018 by G. Weirich
 * 
 * Mock als Ersatz für die RaspberryGPIOS
 **/
module.exports = class Gpio {
  constructor(pin, dir) {
    this.pin = pin
    this.dir = dir
  }
  digitalWrite(val) {
    return this.writeSync(val)
  }
  digitalRead() {
    return this.readSync()
  }
  writeSync(val) {
    if (this.dir === 'in') {
      throw new Error("only Input for " + this.pin)
    } else {
      this.value = val;
    }
  }
  readSync() {
    return this.value ? 1 : 0;
  }
}