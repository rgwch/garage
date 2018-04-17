/**
 * Entfernung messen, und je nachdem eine rote, gelbe oder grüne LED einschalten
 */
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

void loop() {
  digitalWrite(red,0);
  digitalWrite(yellow,0);
  digitalWrite(green,0);
  int distance=ping();
  if(distance<10){
    digitalWrite(red,1);
  }else if(distance<50){
    digitalWrite(yellow,1);
  }else{
    digitalWrite(green,1);
  }
  delay(500);
}

int ping() {
  digitalWrite(trigger, HIGH);
  delay(15);
  digitalWrite(trigger, LOW);
  long time = pulseIn(echo, HIGH);
  return (time/2)*0.034;
}


