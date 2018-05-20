/**
 * Sketch für Arduino:
 * Entfernung messen, und je nachdem eine rote, gelbe oder grüne LED einschalten
 */
 // Pins definieren
const int trigger = 5;
const int echo = 6;
const int red=2;
const int yellow=3;
const int green=4;

const long MAX_TIME = 20000;

void setup() {
  pinMode(trigger,OUTPUT);
  pinMode(echo,INPUT);
  pinMode(red,OUTPUT);
  pinMode(yellow,OUTPUT);
  pinMode(green,OUTPUT);
}

// Alle 500ms eine Messung machen und LEDs entsprechend schalten.
// Delays für Blinkeffekt
void loop() {
  digitalWrite(red,0);
  digitalWrite(yellow,0);
  digitalWrite(green,0);
  delay(250);
  int distance=ping();
  if(distance<15){
    digitalWrite(red,1);
  }else if(distance<50){
    digitalWrite(yellow,1);
  }else{
    digitalWrite(green,1);
  }
  delay(250);
}

/*
  Der HC-SR04 startet eine Messung mit fallender Flanke auf trigger, auf dem vorher mindestens
  10us HIGH angelegt war. Er setzt dann echo zunächst auf HIGH und bei Empfang des Echos wieder auf LOW.

  Entfernung messen: trigger auf LOW, dann 15 us auf HIGH,
  dann wieder auf LOW, dann darauf warten, dass der Echo-Pin von HIGH auf LOW geht 
  und aus der dazwischen liegenden Zeit die 
  Entfernung berechnen (Schallgeschwindigkeit in Luft: 0.034cm/us).
*/
int ping() {
  digitalWrite(trigger,LOW);
  delay(2)
  digitalWrite(trigger, HIGH);
  delayMicroseconds(15);
  digitalWrite(trigger, LOW);
  long time = pulseIn(echo, HIGH);
  return (time/2)*0.034;
}


