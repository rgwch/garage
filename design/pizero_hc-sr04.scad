include  <toolbox_1.1.scad>

thick=1.5;
steps=100;

// Raspberry-Teil
base_length=65.4;
spare_length=3;
base_width=30;
spare_width=2;
corner_radius=3;
hole_offset=3.5;
raspi_height=15;
hc05_height=21;
total_height=raspi_height+hc05_height;
support_radius=3.5;
support_height=2;
pillar_radius=2.5/2;
pillar_height=4;

hc05_length=46;
hc05_width=21;
hc05_depth=17;
hc05_diameter=17;
hc05_offset=1.9;
  
screw=3;            // Dicke der Schraube
fixation_size=6;   // Dicke der Halter
fixation_depth=10;
  


// Raspberry
union(){
    difference(){
        box(inner_size=[base_length+2*spare_length,base_width+2*spare_width,raspi_height+hc05_height],radius=corner_radius,thick=thick);
        
    // Stromanschluss    
    translate([spare_length+49.5,-5-thick,support_height+1])    
        cube([10,10,5]);  
    // Kühlschlitze im Boden    
    for(i=[10:5:45])  slot(i);  

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
    // Öffnung für Stecker zu Arduino
    rotate([90,0,90]){
        translate([base_width-20,raspi_height+hc05_height-10,base_length])
            cylinder(r=4.1,h=10,$fn=steps);
    
        }
    }
    // Stützen
    raspi_pillar(spare_length+hole_offset,spare_width+hole_offset);
    raspi_pillar(spare_length+base_length-hole_offset,spare_width+hole_offset);
    raspi_pillar(spare_length+hole_offset,base_width+spare_width-hole_offset);
    raspi_pillar(spare_length+base_length-hole_offset,base_width+spare_width-hole_offset);
    
    inlay_pillar(0,0);
    inlay_pillar(0,base_width+2*spare_width-2);
    inlay_pillar(base_length+2*spare_length-2,0);
    inlay_pillar(base_length+2*spare_length-2,base_width+2*spare_width-2);
    
    // Fixierungen
    h=total_height-hc05_height/2-hc05_diameter/2;
    translate([-4,base_width+2*spare_width+thick-fixation_depth,h])
        fixation();
    translate([base_length+2*spare_length+4,base_width+2*spare_width+thick,h])
        rotate([0,0,180])
            fixation();
}

// Zwischenboden
translate([0,-base_width-spare_width-4,-thick])
        inlay();

// Deckel
translate([0,base_width+spare_width+2*thick+3]){
    difference(){
        cover(inner_size=[base_length+2*spare_length,base_width+2*spare_width,raspi_height+     hc05_height], thick=thick);
     for(i=[4:5:54]) slot(i);   
        
   }
}

module slot(x){   
    translate([x,4,-5])
      rotate(-25)
    cube([1.5,base_width,10]);
}

module raspi_pillar(x,y){
    translate([x,y,0]){
        cylinder(r=support_radius,h=support_height,$fn=steps);
        cylinder(r=pillar_radius,h=pillar_height,$fn=steps);
    }
    
}

module inlay_pillar(x,y){
    translate([x,y,0]) 
        cube([2,2,raspi_height-2]);
}

// Zwischenboden
module inlay(){
    difference(){
        cube([base_length+2*spare_length-0.3,base_width+2*spare_width-0.3,thick]);
      translate([1,2,-thick-4])
        cube([hc05_length,5,thick+10]);
      translate([2,10,thick-4])
        cube([base_length,1.5,thick+10]);
      translate([2,14,thick-4])
        cube([base_length,1.5,thick+10]);
      translate([2,18,thick-4])
        cube([base_length,1.5,thick+10]);
      translate([2,21.5,thick-4])
        cube([base_length,8,thick+10]);
    }
    
}

module fixation(x){
    cube([3,fixation_depth,fixation_size*2-1]);    
    translate([-2.8,fixation_depth,fixation_size-0.5]){
        rotate([90,0,0])
            difference(){
                cylinder(r=fixation_size,h=10,$fn=50);
                translate([0,0,-2])
                    cylinder(r=screw,h=20,$fn=steps);
       }
    }    
}