# garage

Garagentoröffner per Raspberry Pi mit Relaisausgang und NodeJS-Express Server.

## Hardware

Raspberry Pi B+, 2 oder 3.
PiFace

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
