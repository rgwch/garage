/**********************************************************
    Gehäuse für einen HC-SR04 oder 05 Ultraschall Sensor, 
    einen Arduino Nano und 3 LEDs
    
    Schichtdicke: 0.3 mm, Filament PLA 1.75 mm
*********************************************************/
include <toolbox.scad>

thick=2.1;           // Wanddicke. 
length=46+2*thick;
width=21+2*thick;
depth=17+thick;
diameter=17;        // Durchmesser der Sender/Empfänger
offset=1.9;             // Abstand Sender/Empfänger von Wand
steps=100;           // Schritte für Kreisberechnung
platine_t=1.5;
platine_w=37;
platine_l=51;
clearance_floor=7;
racksize=1.5;
level_y=clearance_floor+thick+platine_t+racksize;
ledsize=5.4;

/*
    Die Box
*/    
union(){
    difference(){
         roundedBox([platine_l,40,platine_w+thick],3,thick);  
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
    }

    rack([thick,clearance_floor+thick,thick]);
    rack([platine_l+thick-racksize,clearance_floor+thick,thick]); 
}

/*
    Der Deckel
*/
union(){
        difference(){
            translate([0,-(platine_w+10),0]){
                roundedCover([platine_l,platine_w,0],3,thick);
            }
            // Kabel-Durchführung
            translate([10,-(platine_w+10),-5]){
                 cube([9,4,10]);
            }
        }
    
}
module led(x){
        translate([x-thick,platine_w,2*platine_w/3])
            rotate([0,90,90])
                cylinder(r=ledsize/2,h=10,$fn=50);           

}
    

module rack(pos){
translate(pos) 
    cube([racksize,racksize,platine_w]);

}