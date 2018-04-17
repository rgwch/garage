thick=2.1;           // Wanddicke
length=46+2*thick;
width=21+2*thick;
depth=17+thick;
board=8;            // Dicke der Platine
diameter=17;        // Duchmesser der Sender/Empfänger
offset=1.9;             // Abstand Sender/Empfänger von Wand
slot=10;             // Breite des Palts für Anschlüsse
steps=100;           // Schritte für Kreisberechnung
screw=3;            // Dicke der Schraube
fixation_size=5;   // Dicke der Halter
fixation_offset=fixation_size/1.5; //Abstand der Halter

   
union(){
    difference(){
     roundedRect([length,width,depth],5);   
        translate([
            diameter/2+offset+thick,
            diameter/2+center(width,diameter),
            -offset])
                cylinder(r=diameter/2,h=depth+5,$fn=steps);
        
        
        translate([length-diameter/2-offset-thick,
                diameter/2+center(width,diameter),
                -offset])
                cylinder(r=diameter/2,h=depth+5,$fn=steps);
        
        translate([thick,thick,thick])
            cube([length-2*thick,width-2*thick,depth]);
         
        translate([center(length,slot),-5,depth-2])
            cube([slot,8,8]);
            
    }
    corner([length-thick-1.5*offset,width-2*thick,thick]);
    corner([length-thick-1.5*offset,thick,thick]);
    corner([thick,width-2*thick,thick]);
    corner([thick,thick,thick]);
    fixation(x=length+fixation_offset,height=depth);
    fixation(x=-fixation_offset,height=depth);

}

union(){
    translate([0,30,0]){
        roundedRect([length,width,thick],5);
        difference(){
        translate([thick+.1,thick+.1,thick])
           cube([length-2*(thick+.1),width-2*(thick+.1),thick*0.5]);
        translate([2*thick,2*thick,thick])
            cube([length-4*thick,width-4*thick,thick]);
        }
  
    }
    fixation(x=length+fixation_offset,y=30,height=thick);
    fixation(x=-fixation_offset,y=30,height=thick);
 
}

function center(outer,inner)=(outer-inner)/2;

module corner(c){
    translate(c) cube([offset*1.5,offset,depth-board-thick]);
}

module fixation(x, y=0, size=fixation_size, height=depth){
    translate([x,y+center(width,size)+size/2,0])
        difference(){
            cylinder(r=size,h=height,$fn=8);
            translate([0,0,-2])
                cylinder(r=screw,h=height+10,$fn=steps);
        }
}
module roundedRect(size, radius)
{
x = size[0];
y = size[1];
z = size[2];

linear_extrude(height=z)
hull()
{
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