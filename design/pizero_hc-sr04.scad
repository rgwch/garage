/****************************************************************************************
    Gehöuse für einen Raspberry Pi Zero, einen HC-SR-04 oder HC-SR-05 Ultraschall-Sensor
    ein Relais und eine Steckbuchse.
    
    Material: PLA 1.75mm
    Schichtdicke: 0.3mm
    Infill: 20%
    Support: Nein
****************************************************************************************/
include  <toolbox_1.1.scad>

// Wanddicke global 
thick=1.2;

// Stufenzahl für runde Strukturen
steps=100;

// Raspberry-Teil
base_length=65.4;   // Länge der Platine
spare_length=3;     // Reserve Länge
base_width=30;      // Breite der Platine
spare_width=2;      // Reserve Breite
corner_radius=3;    // Rundungsradius (nur wenn roundedBox als Basis genommen wird)
hole_offset=3.5;    // Abstand der Löcher von den Kanten
raspi_height=15;    // Höhe für die Raspi Platine inkl. Anschlüsse
hc05_height=23;     // Höhe für den Ulztraschall-Sensor
total_height=raspi_height+hc05_height;
support_radius=3.5; // Radius der Stützscheiben
support_height=2;   // Dicker der Stptzscheiben, Bodenfreiheit für den Raspi
pillar_radius=2.5/2;    // Dicke der Löcher
pillar_height=4;    // Höhe der Führungsstifte für die RAspi-Halterung

// HC-SR-05 Teil
hc05_length=46; 
hc05_width=21;
hc05_depth=17;
hc05_diameter=17;
hc05_offset=1.9;
 
// Halterungen 
screw=3;            // Dicke der Schraube
fixation_size=8;   // Dicke der Halter
fixation_depth=8;
  


// Raspberry
union(){
    difference(){
        box(inner_size=[base_length+2*spare_length,base_width+2*spare_width,raspi_height+hc05_height],radius=corner_radius,thick=thick);
        
    // Stromanschluss    
    translate([spare_length+49.5,-5-thick,support_height+1])    
        cube([10,10,5]);  
    // Kühlschlitze im Boden    
    for(i=[10:5:45])  slot(i,base_width);  

    // Öffnungen für Ultraschall-Sensor
    rotate([90,0,0]){
        translate([
            hc05_diameter/2+hc05_offset,
            hc05_diameter/2+raspi_height+hc05_offset,
            -thick])
                cylinder(r=hc05_diameter/2,h=hc05_depth+5,$fn=steps);
        
        
        translate([hc05_length-hc05_diameter/2-hc05_offset,
               hc05_diameter/2+raspi_height+hc05_offset,
                -thick])
                cylinder(r=hc05_diameter/2,h=hc05_depth+5,$fn=steps);
        }
    // Öffnung für Steckbuchse
        rotate([90,0,90]){
            translate([base_width-23,raspi_height+10,base_length])
                cylinder(r=4.1,h=10,$fn=steps);
        
            }
        translate([base_length+spare_length,15,raspi_height+1.5])
               cube([10,17.2,14.3]);
    }
    
    
    // Stützen
    raspi_pillar(spare_length+hole_offset+0.3,spare_width+hole_offset);
    raspi_pillar(spare_length+base_length-hole_offset,spare_width+hole_offset);
    raspi_pillar(spare_length+hole_offset+0.3,base_width+spare_width-hole_offset);
    raspi_pillar(spare_length+base_length-hole_offset,base_width+spare_width-hole_offset);
    
    inlay_pillar(0,0);
    inlay_pillar(0,base_width+2*spare_width-2);
    inlay_pillar(base_length+2*spare_length-2,0);
    inlay_pillar(base_length+2*spare_length-2,base_width+2*spare_width-2);
    
    translate([-fixation_size,
        base_width+fixation_size/2+thick,
        -thick]) fixation();
    translate([base_length+2*spare_length,
        base_width+fixation_size/2+thick,
        -thick]) fixation();
}

// Zwischenboden
translate([0,-base_width-spare_width-4,-thick])
        inlay();

// Deckel
translate([0,base_width+spare_width+2*thick+3]){
    difference(){
        cover(inner_size=[base_length+2*spare_length,base_width+2*spare_width,raspi_height+     hc05_height], thick=thick, latch_y=5, latch_x=2);
     for(i=[4:5:54]) slot(i,base_width);   
        
   }
}


// Träger mit Führungsstift für den Raspi
module raspi_pillar(x,y){
    translate([x,y,0]){
        union(){
            cylinder(r=support_radius,h=support_height,$fn=steps);
            cylinder(r=pillar_radius,h=pillar_height,$fn=steps);
        }
    }
    
}

// Stütze für Zwischenboden
module inlay_pillar(x,y){
    translate([x,y,0]) 
        cube([2,2,raspi_height-2]);
}

// Zwischenboden
module inlay(){
    difference(){
        cube([base_length+2*spare_length-0.6,base_width+2*spare_width-0.3,1.5]);
      translate([5,2,-thick-4])
        cube([35,19,thick+10]);
      translate([5,24.5,thick-4])
        cube([base_length-5,12,thick+10]);
  
    }
    
}

// Halterung mit Öffnung für M3 Schraube
module fixation(x){
    difference(){
        rotate([90,0,0])
        roundedCube([fixation_size,fixation_depth,fixation_size],radius=3);
            rotate([90,0,0])
                translate([fixation_size/2,fixation_depth/2,-30])
                    cylinder(d=screw,h=50,$fn=steps);
    }
}
