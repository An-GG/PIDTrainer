function loop() {


var target = 3.14;
setGraphTarget(target);

var kP = 80;
var kI = 1;
var kD = 140;

var error = target - getArmPosition();
var changeInError = error - sim.previousPos;
sim.previousPos = error;

var P = kP * error;
var D = kD * changeInError;
console.log(D);
var output = P + D;

setArmPower(output);

  timeout(loop, 20);

}
loop();
