/*******************
Gehäuse für ein Doppel-Relais Modul wie dieses:
https://www.diy-shop.ch/de/relais/152-2-kanal-5v-relais-modul.html
Support: no
Infill: 15%
Resolution: 0.3mm
********************/

include  <toolbox_1.1.scad>

// Wanddicke global
thick=0.9;
// Feiheit von runden Strukturen
steps=100;
width=39.2;             // Breite
length=50.8;            // Länge
spare=1;                // Platzreserve
height=23;              // Höhe
hole_offset=1.38;       // Abstabd Loch von Kante
hole_diameter=2.5;      // Durchmesser Loch
support_radius=2.5;     // Radius der Tragplättchen
support_height=1.5;     // Dicke der Tragplättchen
pillar_radius=(hole_diameter-0.2)/2;
pillar_height=4;        // Höhe der Tragstifte

// Halterungen
screw=3;                // Dicke der Schrauben (M3)
fixation_size=8;        // Dicke der Halterungen
fixation_depth=8;       // Tiefe der Halterungen
  

// Gehäuse
union(){
    fl=length+2*spare;
    fw=width+2*spare;
    offset=[spare,spare,0];
    
    difference(){
        box([fl,fw,height],thick=thick);
        // Ausschnit für Steuerkabel
        translate([-5,5,height-5])
            cube([10,15,height]);
        // Ausschnitt für Relaiskabel
        translate([fl-5,offset.y+thick,support_height+4])                 
            cube([10,width-2*thick,height]);
        // Kühlschlitze
        for(i=[6:5:30]) slot(i,width-5,offset=offset);
       
        }
    pc=hole_offset+hole_diameter/2;
    // Tragstifte und Abstandsplättchen   
    pillar(offset.x+pc,offset.y+pc);
    pillar(fl-offset.x-pc,offset.y+pc);
    pillar(offset.x+pc,fw-offset.y-pc);
    pillar(fl-offset.x-pc,fw-offset.y-pc);
    // Halterungen    
    translate([-fixation_size, width+thick+2*spare,-thick]) fixation();
    translate([length+2*spare,width+thick+2*spare,-thick]) fixation();
}

// Deckel
translate([0,width+2*spare+2*thick+3]){
    difference(){
        cover(inner_size=[length+2*spare,width+2*spare,3], thick=thick, latch_x=5);
        for(i=[10:5:25]) slot(i,width-5,offset=[spare,spare,0]);   
        }
     translate([length+2*spare-thick,thick,thick])
         cube([0.9,width,height/2]);
     translate([0,thick,thick])
            cube([0.9,width/2,7]);
}

// Tragstifte
module pillar(x,y){
 translate([x,y,0]){
        union(){
            cylinder(r=support_radius,h=support_height,$fn=steps);
            cylinder(r=pillar_radius,h=pillar_height,$fn=steps);
        }
    }
}

// Halterungen
module fixation(x){
    difference(){
        rotate([90,0,0])
        roundedCube([fixation_size,fixation_depth,fixation_size],radius=3);
            rotate([90,0,0])
                translate([fixation_size/2,fixation_depth/2,-30])
                    cylinder(d=screw,h=50,$fn=steps);
    }
}
