# garage

Garagentoröffner per Raspberry Pi mit Relaisausgang und NodeJS-Express Server.
Der Server lässt sich per WebApp bedienen. Der Zustand des Tors (offen/zu) wird mit
einem Ultraschall-Sensor bestimmt. 

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
Raspbian installieren


Je nach Pi Version (Pi Zero, Pi Zero W) muss node für armv6 installiert werden. Das geht nur mit älteren Versionen.
Neuere (Pi Zero W2) sind armv7 kompatibel

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

Node 10 (genauer gesagt node-gyp) braucht Python 2. Raspbian kommt aber mit Python 3.
Also Python 2 installieren, wird nur zum kompilieren gebraucht.

```
wget https://www.python.org/ftp/python/2.7.9/Python-2.7.9.tgz
sudo tar xzf Python-2.7.9.tgz
cd Python-2.7.9
sudo ./configure --enable-optimizations
sudo make altinstall
python2.7 -V
~ Python 2.7.9
sudo ln -sfn '/usr/local/bin/python2.7' '/usr/bin/python2'
sudo update-alternatives --install /usr/bin/python python /usr/bin/python2 1

sudo update-alternatives --config python
* 0            /usr/bin/python3   2         auto mode
1            /usr/bin/python2   1         manual mode
2            /usr/bin/python3   2         manual mode

Press <enter> to keep the current choice[*], or type selection number:
```
Umschalten dann jeweils mit sudo update-alternatives --config python
