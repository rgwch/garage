# garage

Garagentoröffner per Raspberry Pi mit Relaisausgang und NodeJS-Express Server.
Der Server lässt sich per WebApp bedienen. Der Zustand des Tors (offen/zu) wird mit
einem Ultraschall-Sensor bestimmt. Wenn das Tor offen ist, wird ein weiterer Entfernungsmesser
eingeschaltet, der als Abstandswarner an der Stirnseite dient.

## Hardware

* Raspberry Pi Zero, B+, 2 oder 3.
* 2 Relais oder Optokoppler
* 2 HC-SR-04 oder HC-SR-05 Ultraschall-Sensoren
* 1 Arduino Nano
* 3 Leuchtdioden grün / gelb / rot für Abstandswarner
* 2 Widerstände 330 Ohm
* 1 Widerstand 470 Ohm
* 1 Netzteil für Raspberry Pi (Der Arduino wird über den Raspberry versorgt)

3D-Drucker für die Gehäuse.

## Software

NodeJS 10.x, z.B. so:

      sudo apt-get remove nodejs
      cd
      mkdir apps
      cd apps
      wget http://nodejs.org/dist/latest-v10.x/node-v10.1.0-linux-armv6l.tar.xz
      tar -xf node-v10.1.0-linux-armv6l.tar.xz
      mv node-v10.1.0-linux-armv6l node10
      sudo ln -s /home/pi/apps/node10/bin/node /usr/bin/node
      sudo ln -s /home/pi/apps/node10/bin/npm /usr/bin/npm
      echo export PATH=$PATH:/home/pi/apps/node10/bin >>../.profile

