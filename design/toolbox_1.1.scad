/********************************************
Einige Hilfsmodule für die 3D-Druck Konstrukte
Copyright (c) 2018 by G. Weirich
*********************************************/
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
module cover(inner_size,thick){
    translate([-thick,-thick,-thick]){
        cube([inner_size.x+2*thick,  inner_size.y+2*thick, thick]);
        translate([thick,thick,thick])
            cube([inner_size.x,inner_size.y,thick]);
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

