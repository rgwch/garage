# garage

Garagentoröffner per Raspberry Pi mit Relaisausgang und NodeJS-Express Server.
Der Server lässt sich per WebApp bedienen. Der Zustand des Tors (offen/zu) wird mit
einem Ultraschall-Sensor bestimmt. Wenn das Tor offen ist, wird ein weiterer Entfernungsmesser
eingeschaltet, der als Abstandswarner an der Stirnseite dient.

## Hardware

Raspberry Pi B+, 2 oder 3.
Relais oder Optokoppler
2 HC-SR04 oder HC-SR05 Ultraschall-Sensoren
1 Arduino Nano
3 Leuchtdioden grün/gelb/rot für Abstandswarner
1 Transistor BC-347 o.Ae.
3 Widerstände 220 Ohm
1 Widerstand 1.5 kOhm
1 Netzteil für Raspberry Pi (Der Arduino wird über den Raspberry versorgt)

3D-Drucker für die Gehäuse.

## Software

NodeJS 7.x, z.B. so:

      sudo apt-get remove nodejs
      cd
      mkdir apps
      cd apps
      wget https://nodejs.org/dist/v7.7.3/node-v7.7.3-linux-armv6l.tar.xz
      tar -xf node-v7.7.3-linux-armv6l.tar.xz
      mv node-v7.7.3-linux-armv6l node7
      sudo ln -s /home/pi/apps/node7/bin/node /usr/bin/node
      sudo ln -s /home/pi/apps/node7/bin/npm /usr/bin/npm
      echo export PATH=$PATH:/home/pi/apps/node7/bin >>../.profile

NodeJS Treiber für PiFace: https://www.npmjs.com/package/piface
