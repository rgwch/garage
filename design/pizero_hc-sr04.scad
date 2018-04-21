include  <toolbox_1.1.scad>

thick=1.8;
steps=100;

// Raspberry-Teil
base_length=65.4;
spare_length=3;
base_width=30;
spare_width=2;
corner_radius=3;
hole_offset=3.5;
height=10;
support_radius=3.5;
support_height=2;
pillar_radius=2.5/2;
pillar_height=4;

hc05_length=46;


// Raspberry
union(){
    difference(){
        box(inner_size=[base_length+2*spare_length,base_width+2*spare_width,height],radius=corner_radius,thick=thick);
    translate([spare_length+48,-5-thick,support_height])    
        cube([10,10,6]);    
    slot(19,20);
    slot(24,20);
    slot(29,20);
    slot(34,20);    
    slot(39,20);    
    }
    pillar(spare_length+hole_offset,spare_width+hole_offset);
    pillar(spare_length+base_length-hole_offset,spare_width+hole_offset);
    pillar(spare_length+hole_offset,base_width+spare_width-hole_offset);
    pillar(spare_length+base_length-hole_offset,base_width+spare_width-hole_offset);
    translate([0,0,height+2*thick])
        hc05();
    translate([0,-base_width-10,0])
        inlay();
}
    
module slot(x,l){
    translate([x,base_width-l,-5])
        rotate(45)
            cube([l,1.5,10]);
}

module pillar(x,y){
    translate([x,y,0]){
        cylinder(r=support_radius,h=support_height,$fn=steps);
        cylinder(r=pillar_radius,h=pillar_height,$fn=steps);
    }
    
}

// HC-SR 05
// hc-05-Teil

module hc05(){
  
    hc05_width=21;
    hc05_depth=17;
    hc05_diameter=17;
    hc05_offset=1.9;
    difference(){
        box([base_length+2*spare_length,base_width+2*spare_width,hc05_width],thick=thick);
        rotate([90,0,0]){
        translate([
            hc05_diameter/2+hc05_offset+thick,
            hc05_diameter/2+center(hc05_width,hc05_diameter),
            -hc05_offset])
                cylinder(r=hc05_diameter/2,h=hc05_depth+5,$fn=steps);
        
        
        translate([hc05_length-hc05_diameter/2-hc05_offset-thick,
                hc05_diameter/2+center(hc05_width,hc05_diameter),
                -hc05_offset])
                cylinder(r=hc05_diameter/2,h=hc05_depth+5,$fn=steps);
        }
        translate([0,2,-thick-5])
            cube([base_length+2*spare_length,base_width,10]);
        
    }
}

// Zwischenboden
module inlay(){
    difference(){
        cube([base_length+2*spare_length-0.5,base_width+2*spare_width-0.5,thick]);
      translate([1,2,-thick-4])
        cube([hc05_length,10,thick+10]);
      translate([2,15,thick-4])
        cube([base_length,2,thick+10]);
      translate([2,20,thick-4])
        cube([base_length,2,thick+10]);
      translate([2,25,thick-4])
        cube([base_length,2,thick+10]);

    }
    
}
