#! /bin/bash

# Die CAD-Dateien bauen. Benötigt OpenScad und slic3r.
# Erstellt aus jedem .scad ein .stl und ein .gcode.
# WARNUNG; Die Default Einstellungen für slic3r müssen an den
# tatsächlich verwendeten 3D Drucker angepasst werden, um 
# Fehldrucke oder Beschädigungen des Druckers zu vermeiden.

for f in *.scad; do openscad -o ${f/scad/stl} $f; done

for f in *.stl; do slic3r --output ${f/stl/gcode} $f; done

