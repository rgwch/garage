fit=0.2;
width=10;
thick=3;
inner_height=45.5;
inner_depth=25;
hook_size=12;
screw_head_diameter=6.0;
screw_head_thick=2.8;
screw_diameter=2.9;
screw_head_round=true;

height=inner_height+2*thick;
depth=inner_depth+2*thick;

front=[width,thick,inner_height];
top=[width,inner_depth,thick];
hook=[width,thick,hook_size];
fill=[width,thick,thick];

rotate([0,90,0]){
    union(){
        translate([0,0,thick]){
            difference(){
                cube(front);
                screw(5);
                screw(15);
                screw(25);
                screw(35);
            }
            translate([0,thick,inner_height]){
                cube(top);
                translate([0,top.y,-hook_size])
                    cube(hook);
            }
            translate([0,thick,-thick]){
                cube(top);
            }
        }

        translate([0,0,0]) cube(fill);
        translate([0,0,height-thick]) cube(fill);
        translate([0,depth-thick,0]) cube(fill);
        translate([0,depth-thick,height-thick]) cube(fill);
        
    }
}
module screw(pos){
    rotate([90,0,0]){
        translate([width/2,pos,-(1.5*thick)]){
            cylinder(r=screw_diameter/2+fit,h=thick*2,$fn=50);
            if(screw_head_round==false){
                cylinder(r=screw_head_diameter/2+fit,h=screw_head_thick,$fn=6);
            }else{
                cylinder(r=screw_head_diameter/2+fit,h=screw_head_thick,$fn=50);                 
            }
        }
    }
}