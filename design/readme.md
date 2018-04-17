# Design Dateien

## *.scad

Dies sind Programme im OpenScad-Format, 
um die Gehäuse für den Raspberry, den Arduino und die Sensoren zu drucken.

Vorgehen, zum Beispiel für Ubuntu 17.04:

* `sudo apt-get install openscad slic3r`
* slic3r starten und Default-Einstellungen passend zum 3D-Drucker einstellen. (Vor allem Druckbett-Grösse, Filament-Durchmesser, Heizung)
* `./build_all.sh`
* gcode Dateien zum Drucker schicken.

### Dateien

* hc-sr04.scad / png: Gehäuse für den Ultraschallsensor des Garentor-Öffners
* klammer.scad / png: Klammer, um den Sensor an der Schiene des Tors zu befestigen
* nano_sono.scad / png: Gehäuse für Ultraschallsensor, Arduino und LEDs des Abstanswarner
* garage.fzz / png: Schema des Elektronik Aufbaus (Frtitzing Format)

