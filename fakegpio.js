/**
 *  Garagentor-Fernbedienung mit Raspberry Pi
 *  (c) 2017-2018 by G. Weirich
 * 
 * Mock als Ersatz für die RaspberryGPIOS
 **/
module.exports=class Gpio{
    constructor(pin,dir){}
    writeSync(){}
    readSync(){
        return false;
    }
}