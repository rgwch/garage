/**********************************************************
    Gehäuse für einen HC-SR04 oder 05 Ultraschall Sensor, 
    einen Arduino Nano und 3 LEDs
    
    Schichtdicke: 0.3 mm, Filament PLA 1.75 mm
*********************************************************/
include <toolbox_1.1.scad>
use <devices.scad>

thick=1.8;              // Wanddicke. 
length=46;      // Platzbedarf für den HC-SR 04
width=21;
depth=17;
diameter=17;            // Durchmesser der Sender/Empfänger
offset=1.9;             // Abstand Sender/Empfänger von Wand
steps=100;              // Schritte für Kreisberechnung
platine_t=1.5;          // Masse der Platine mit dem Arduino
platine_w=38;
platine_l=51;
height=42;
clearance_floor=5;      // Abstand von der Unterseite für Verdrahtungen etc.
racksize=3.5;           // Grösse der Führungsschienen für die Platine
level_y=clearance_floor+thick+platine_t+racksize;
ledsize=5.35;            // Durchmesser der LEDs (inkl. Schrumpfkorrektur)
channel_width=10;
channel_depth=7;
channel_thick=1.2;      // Wandstärke Verbindungskanal

/*
    Die Box


union(){
    difference(){
         roundedBox([platine_l,height,platine_w+5],3,thick);  
        translate([center(platine_l,length),height-diameter-3*offset,-offset])
            hcsr04();
        
        buchse(platine_w-15);
        translate([2*thick,height-5,platine_w])
           cube([10,10,7]);
    }

    rack([0,clearance_floor+thick,thick]);
    rack([platine_l-racksize,clearance_floor+thick+5,thick]); 
    translate([center(platine_l,10),19,0])
        cube([10,5,3]);
}
*/

/*
    Der Deckel



union(){
            translate([0,-(height+10),0]){
                roundedCover([platine_l,height,0],3,thick,latch_x=5,latch_y=5);
            }
     
}
*/

/*
 Das abgesetzte Gehäuse für die LEDs


union(){
   
    translate([-7,-4,0]){
      rotate([0,0,90])
        difference(){
            roundedBox([platine_l,15,15],3,thick);
            offs=3;    
            dist=(platine_l-2*offs)/3;    
            led(offs+dist/2);
            led(offs+dist+dist/2);
            led(offs+2*dist+dist/2);
            translate([2*thick,-5,10])
                cube([10,10,7]);
  
        }    
    }
}
*/

/*
Deckel für LED Gehäuse
*/
translate([-28,-4,0]){
    rotate([0,0,90])
        roundedCover([platine_l,15,0],3,thick,latch_x=4,latch_y=4);
}

// Verbindungskanal 
translate([-50,platine_w+15,-thick]){
    union(){
    difference(){
            cube([100,channel_width,channel_depth]);
     
        translate([-5,channel_thick,channel_thick])
            cube([110,channel_width-2*channel_thick,channel_depth]);
        
        translate([95,0,0]) 
            cube([10,channel_thick/2,10]);
        translate([95,channel_width-channel_thick/2,0])
            cube([10,channel_thick/2,10]); 
        translate([95,-5,-2])
             cube([4,15,thick+2]);
        
        translate([0,0,0]) 
            cube([5,channel_thick/2,10]);
        translate([0,channel_width-channel_thick/2,0])
            cube([5,channel_thick/2,10]); 
     
        
    }
    translate([0,channel_thick,channel_thick]) cube([95,0.9,0.9]);
    translate([0,channel_width-0.9-channel_thick,channel_thick]) 
        cube([95,0.9,0.9]);
      
    }
}

translate([-50,platine_w+30,-thick]){
    union(){
     difference(){
        cube([100,10,7]);
        translate([-5,0.9,0.9])
            cube([110,8.2,8.2]);
        translate([95,0.45,0]) 
            cube([10,0.45,10]);
        translate([95,9.15,0])
            cube([10,0.45,10]); 
        translate([95,0.45,-1])
            cube([8.2,9.1,10]);
         cube([5,channel_thick/2,10]);
        translate([0,channel_width-channel_thick/2,0])
            cube([5,channel_thick/2,10]);
        translate([1,-5,-2])
          cube([4,15,thick+2]);
        
    }
    translate([5,channel_thick,channel_thick]) cube([90,0.9,0.9]);
    translate([5,channel_width-0.9-channel_thick,channel_thick]) 
        cube([90,0.9,0.9]);
    
    }
}


module led(x){
    translate([x,8,-thick-3])
        cylinder(r=ledsize/2,h=10,$fn=steps);           

}
    
module buchse(x){
    translate([-5,height/2.2,thick+4+x])
        rotate([0,90,0])
            cylinder(r=4.1,h=10,$fn=steps);
    
}

module rack(pos){
translate(pos) 
    cube([racksize,1.8,platine_w-thick]);

}

