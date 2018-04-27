include  <toolbox_1.1.scad>

thick=0.9;
steps=100;

width=39.2;
length=50.8;
spare=1;
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
    fl=length+2*spare;
    fw=width+2*spare;
    offset=[spare,spare,0];
    
    difference(){
        box([fl,fw,height],thick=thick);
        // translate([off_l1,off_w1,0])
            //box([length,width,height],thick=thick)
        for(i=[8:5:30]) slot(i,width-5,offset=offset);
        /*    
        translate([-5,fw/2,height-8])
            rotate([0,90,0])
                cylinder(r=4,h=10);
        translate([fl-5,fw/2,height-8])
            rotate([0,90,0])
                cylinder(r=4,h=10);
        */
        translate([-5,offset.y+thick,support_height+4])
            cube([10,width-2*thick,height]);
        translate([fl-5,center(fw,15),height-5])
            cube([10,15,height]);
        }
    pc=hole_offset+hole_diameter/2;
    pillar(offset.x+pc,offset.y+pc);
    pillar(fl-offset.x-pc,offset.y+pc);
    pillar(offset.x+pc,fw-offset.y-pc);
    pillar(fl-offset.x-pc,fw-offset.y-pc);
    translate([-fixation_size, width+thick+2*spare,-thick]) fixation();
    translate([length+2*spare,width+thick+2*spare,-thick]) fixation();
}

// Deckel
translate([0,width+2*spare+2*thick+3]){
    difference(){
        cover(inner_size=[length+2*spare,width+2*spare,3], thick=thick, latch_x=5);
     for(i=[10:5:25]) slot(i,width-5,offset=[spare,spare,0]);   
        
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
