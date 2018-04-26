include  <toolbox_1.1.scad>

thick=0.9;
steps=100;

width=39.2;
length=50.8;
height=23;
hole_offset=1.38;
hole_diameter=2.5;
support_radius=2.5;
support_height=1.5;
pillar_radius=(hole_diameter-0.2)/2;
pillar_height=4;

screw=3;            // Dicke der Schraube
fixation_size=8;   // Dicke der Halter
fixation_depth=8;
  

union(){
    difference(){
        box([length,width,height],thick=thick);
        for(i=[8:5:30]) slot(i,width-5);
        translate([-5,width/2,height-8])
            rotate([0,90,0])
                cylinder(r=4,h=10);
        translate([length-5,width/2,height-8])
            rotate([0,90,0])
                cylinder(r=4,h=10);
        
        }
        pc=hole_offset+hole_diameter/2;
        pillar(pc,pc);
        pillar(length-pc,pc);
        pillar(pc,width-pc);
        pillar(length-pc,width-pc);
       translate([-fixation_size, width+thick,
        -thick]) fixation();
    translate([length,width+thick,
        -thick]) fixation();
}

// Deckel
translate([0,width+2*thick+3]){
    difference(){
        cover(inner_size=[length,width,3], thick=thick, latch_y=5, latch_x=4);
     for(i=[10:5:25]) slot(i,width-5);   
        
   }
}

module pillar(x,y){
 translate([x,y,0]){
        union(){
            cylinder(r=support_radius,h=support_height,$fn=steps);
            cylinder(r=pillar_radius,h=pillar_height,$fn=steps);
        }
    }
}

module fixation(x){
    difference(){
        rotate([90,0,0])
        roundedCube([fixation_size,fixation_depth,fixation_size],radius=3);
            rotate([90,0,0])
                translate([fixation_size/2,fixation_depth/2,-30])
                    cylinder(d=screw,h=50,$fn=steps);
    }
}
