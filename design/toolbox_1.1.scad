/********************************************
Einige Hilfsmodule für die 3D-Druck Konstrukte
Copyright (c) 2018 by G. Weirich
*********************************************/
// cover([10,20,10],1.5,3);
/*
    Viereckige Dose. Parameter: Innenmasse, Wanddicke
*/
module box(inner_size,thick){
    translate([-thick,-thick,-thick]){
        difference(){
            cube([inner_size.x+2*thick,inner_size.y+2*thick,inner_size.z+2*thick]);
            translate([thick,thick,thick])
                cube([inner_size.x,inner_size.y,inner_size.z+2*thick]);
        }
    }
}

/*
    Deckel für Box
*/
module cover(inner_size,thick,latch_x=0, latch_y=0){
    union(){
        translate([-thick,-thick,-thick]){
            cube([inner_size.x+2*thick,  inner_size.y+2*thick, thick]);
            translate([thick,thick,thick]){
                cube([inner_size.x-0.1,inner_size.y-0.2,1.5*thick]);
                if(latch_x>0){
                    translate([center(inner_size.x,inner_size.x/3),0,1.5*thick]){
                        cube([inner_size.x/3,thick*0.9,latch_x]);
                    }
                    translate([center(inner_size.x,inner_size.x/3),inner_size.y-thick,1.5*thick]){
                        cube([inner_size.x/3,thick*0.9,latch_x]);
                    }
                }
                if(latch_y>0){
                    translate([0,center(inner_size.y,inner_size.y/3),1.5*thick]){
                        cube([thick*0.9,inner_size.y/3,latch_y]);             
                    }
                    translate([inner_size.x-thick,center(inner_size.y,inner_size.y/3),1.5*thick])
                        cube([thick*0.9,inner_size.y/3,latch_y]);             
                    
                }
            }
         }
    }
}
/*
    Viereckige Dose mit gerundeten Ecken
    Parameter: Innenmasse, Radius der Eckenrundungen, Wanddicke
*/
module roundedBox(inner_size,radius,thick){
    translate([-thick,-thick,-thick]){
        difference(){
            roundedCube([inner_size.x+2*thick,inner_size.y+2*thick,inner_size.z+2*thick],radius);
            translate([thick,thick,thick])
                cube([inner_size.x,inner_size.y,inner_size.z+2*thick]);
        }
    }
}

/*
    Deckel für gerundete Box
*/
module roundedCover(inner_size,radius,thick){
    translate([-thick,-thick,-thick]){
        roundedCube([inner_size.x+2*thick,  inner_size.y+2*thick, thick],radius);
        translate([thick,thick,thick])
            cube([inner_size.x,inner_size.y,thick]);
        }
}


/*
    Eine Strecke innerhalb einer anderen Strecke zentrieren.
    Parameter: Länge der äusseren Strecke, Länge der inneren Strecke.
*/
function center(outer,inner)=(outer-inner)/2;

/*
    cube mit gerundeten Ecken.
    Parameter: Aussenmasse, Radius der Eckenrundungen.
*/
module roundedCube(size, radius,steps=50)
{
    x = size[0];
    y = size[1];
    z = size[2];
    linear_extrude(height=z)
        hull(){
            translate([radius, radius, 0])
            circle(r=radius,$fn=steps);

            translate([x-radius, radius, 0])
            circle(r=radius, $fn=steps);

            translate([x-radius, y-radius, 0])
            circle(r=radius,$fn=steps);

            translate([radius, y-radius, 0])
            circle(r=radius,$fn=steps);
            
        }

}


module slot(x,w,offset=[0,0,0]){   
    translate([x+offset.x,4+offset.y,-5+offset.z])
      rotate(-25)
    cube([1.5,w,10]);
}

