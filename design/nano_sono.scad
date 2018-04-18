/**********************************************************
    Gehäuse für einen HC-SR04 oder 05 Ultraschall Sensor, 
    einen Arduino Nano und 3 LEDs
    
    Schichtdicke: 0.3 mm, Filament PLA 1.75 mm
*********************************************************/
include <toolbox.scad>

thick=1.8;              // Wanddicke. 
length=46+2*thick;      // Platzbedarf für den HC-SR 04
width=21+2*thick;
depth=17+thick;
diameter=17;            // Durchmesser der Sender/Empfänger
offset=1.9;             // Abstand Sender/Empfänger von Wand
steps=100;              // Schritte für Kreisberechnung
platine_t=1.5;          // Masse der Platine mit dem Arduino
platine_w=38;
platine_l=51;
height=40;
clearance_floor=10;      // Abstand von der Unterseite für Verdrahtungen etc.
racksize=1.5;           // Grösse der Führungsschienen für die Platine
level_y=clearance_floor+thick+platine_t+racksize;
ledsize=5.4;            // Durchmesser der LEDs (inkl. Schrumpfkorrektur)

/*
    Die Box
*/    
union(){
    difference(){
         roundedBox([platine_l,height,platine_w+thick],3,thick);  
         translate([
                diameter/2+offset+thick,
                diameter/2+center(width,diameter)+level_y+platine_t,
                -offset])
                    cylinder(r=diameter/2,h=depth+5,$fn=steps);
         translate([length-diameter/2-offset-thick,
                    diameter/2+center(width,diameter)+level_y+platine_t,
                    -offset])
                    cylinder(r=diameter/2,h=depth+5,$fn=steps);
        ledspace=platine_l/3;
        ledoffs=4+center(ledspace,ledsize)+ledsize/2;
        led(ledoffs);
        led(ledspace+ledoffs);
        led(2*ledspace+ledoffs);
        buchse(platine_w-2.8-8);
        buchse(platine_w-2.8-20);
    }

    rack([thick,clearance_floor+thick,thick]);
    rack([platine_l+thick-racksize,clearance_floor+thick,thick]); 
}

/*
    Der Deckel
*/
union(){
        difference(){
            translate([0,-(height+10),0]){
                roundedCover([platine_l,height,0],3,thick);
            }
            /* Kabel-Durchführung
            translate([10,-(height+10),-5]){
                 cube([9,4,10]);
            }
            */
        }
        translate([center(platine_l,10)+thick,thick-(height+10),2*thick]){
            cube([10,1.8,3]);
            translate([0,height-thick,0]) cube([10,1.8,3]);
        }
        translate([thick,thick-(height+10)+center(height,10),2*thick]){
            cube([1.8,10,3]);
            translate([platine_l-thick,0,0]) cube([1.8,10,3]);
       
        }
        
    
}
module led(x){
        translate([x-thick,platine_w,3*platine_w/4])
            rotate([0,90,90])
                cylinder(r=ledsize/2,h=10,$fn=steps);           

}
    
module buchse(x){
    translate([-5,thick+5.2,thick+4+x])
        rotate([0,90,0])
            cylinder(r=4.1,h=10,$fn=steps);
    
}

module rack(pos){
translate(pos) 
    cube([racksize,racksize,platine_w-thick]);

}
