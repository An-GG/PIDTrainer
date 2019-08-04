var mainContext;

mainContext = document.querySelector("canvas").getContext("2d");
mainContext.canvas.height = 900;
mainContext.canvas.width = 900;


// DISPLAY MODULE
const Display = function(context) {

  this.context = context;

  this.setup = function() {
    this.telemetrySetup();
  }

  this.text = function(xRatio, yRatio, text) {
    var x = xRatio * context.canvas.width;
    var y = yRatio * context.canvas.height;
    context.fillText(text, x, y);
  }

  this.rect = function(xRatio, yRatio, wRatio, hRatio, color, angle) { // Rotates about top left corner
    var x = xRatio * context.canvas.width;
    var y = yRatio * context.canvas.height;
    var w = wRatio * context.canvas.width;
    var h = hRatio * context.canvas.height;

    context.fillStyle = color;
    context.beginPath();
    context.moveTo(x, y);

    var x1 = (Math.cos(angle) * w) + x;
    var y1 = (Math.sin(angle) * w) + y;
    context.lineTo(x1, y1);

    var x2 = -(Math.sin(angle) * h) + x1;
    var y2 = (Math.cos(angle) * h) + y1;
    context.lineTo(x2, y2);

    var x3 = -(Math.cos(angle) * w) + x2;
    var y3 = -(Math.sin(angle) * w) + y2;
    context.lineTo(x3, y3)

    context.closePath();

    context.fill();
  }

  this.circle = function(xRatioCenter, yRatioCenter, radius, color) {
    var x = xRatioCenter * context.canvas.width;
    var y = yRatioCenter * context.canvas.height;
    var r = radius * context.canvas.width;
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, r, 0, 2 * Math.PI);
    context.fill();
  }

  this.drawBackgroundColor = function(color) {
    context.fillStyle = color;
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
  }

  var graphLeftEdge = 0.05;
  var graphBottomEdge = 0.35;
  var graphWidth = 0.6;
  var graphHeight = 0.3;

  this.telemetrySetup = function() {
    context.fillStyle = "#a9a9a9";
    context.font = "30px Arial";
    context.fillText("Telemetry", 10, 30);

    this.rect(0.05, 0.05, 0.002, 0.3, "#a9a9a9", 0);
    this.rect(0.05, 0.35, 0.6, 0.002, "#a9a9a9", 0);

    context.rotate(Math.PI / 2);
    context.font = "20px Arial";
    this.text(0.15, -0.016, "Value");
    context.rotate(-Math.PI / 2);

    this.text(graphWidth / 2 + 0.04, graphBottomEdge + 0.028, "Time");
  }

  this.setTelemetryData = function(history) {
    var yScale = 1;
    var xDelta = 0.01
    this.graphPoints = function(data, color) {
      for (i=0; data.length; i++) {
        var yVal = data[i] / yScale;
        this.circle(graphLeftEdge + 0.01 + (0.02 * i), graphBottomEdge - (yVal * graphHeight), 0.01, color);
      }
    }

    this.graphPoints([0.5, 0.4], "#DB4437");
  }

  this.drawBackgroundGraphics = function() {
    this.rect(0, 0.4, 1, 0.6, "#fffff1", 0);
    // Draw Center Mount Thing
    this.rect(0.45, 0.6, 0.1, 0.4, "#808080", 0);
  }
  this.drawArmAtAngle = function(angle) {
    this.rect(0.5, 0.7, 0.035, 0.25, "#a9a9a9", angle);
    this.rect(0.5, 0.7, -0.035, 0.25, "#a9a9a9", angle);
    this.rect(0.5, 0.7, 0.035, -0.07, "#a9a9a9", angle);
    this.rect(0.5, 0.7, -0.035, -0.07, "#a9a9a9", angle);
  }

  this.drawForegroundGraphics = function() {
    this.circle(0.5, 0.7, 0.01, "#ffffff");
  }

  this.setFromSimulation = function(simulationObject) {
    this.drawBackgroundGraphics();
    this.drawArmAtAngle(simulationObject.armAngle);
    this.drawForegroundGraphics();
  }


}


// ANIMATION ENGINE
const Engine = function(update, render) {

  this.timeOfLastUpdate = 0;
  this.elapsedTime = 0;
  this.targetFPS = 30;
  this.timeStep = 1000/30; //Number of milliseconds per frame

  this.update = update;
  this.render = render;

  function sendUpdate() {
    this.update();
  }
  function sendRender() {
    this.render();
  }

  this.start = function() {
    this.timeStep = 1000 / this.targetFPS;
    this.timeOfLastUpdate = window.performance.now();
    window.requestAnimationFrame(this.loop.bind(this));
  }

  this.loop = function() {
    this.elapsedTime = window.performance.now() - this.timeOfLastUpdate;
    var updated = false;
    this.update();

    while (this.elapsedTime >= this.timeStep) {
      updated = true;
      this.update();
      this.elapsedTime -= this.timeStep;
    }
    if (updated) {
      updated = false;
      this.timeOfLastUpdate = window.performance.now();
      this.render();
    }
    window.requestAnimationFrame(this.loop.bind(this));


  }

}


// CORE SIMULATION
const Simulation = function(display) {

  this.armVelocity = 0.12;
  this.armForce = 0.001;
  this.friction = 0.1;
  this.armPosition = 0;

  this.history = {
    pValues : [],
    vValues : [],
    aValues : []
  }

  this.simulationObject = {
    armAngle: 0
  };

  this.run = function() {
    var accel = this.armForce - (this.friction * this.armVelocity)
    this.armVelocity += accel;
    this.armPosition += this.armVelocity;
    if (Math.abs(this.armPosition) > 2 * Math.PI) {
      if (this.armPosition > 0) {
        this.armPosition -= 2 * Math.PI;
      }
      if (this.armPosition < 0) {
        this.armPosition += 2 * Math.PI;
      }
    }
    this.simulationObject = {
      armAngle: this.armPosition,
      armVelocity: this.armVelocity,
      armAcceleration: accel
    }
    // this.history.pValues.push(this.armPosition);
    // this.history.vValues.push(this.armVelocity);
    // this.history.aValues.push(accel);
  }

  this.render = function() {
    display.setFromSimulation(this.simulationObject);
    //display.setTelemetryData(this.history);
  }

  this.startEngine = function() {
    var engine = new Engine(this.run.bind(this), this.render.bind(this));
    engine.start();
  }

}




var disp = new Display(mainContext);
disp.setup();
var sim = new Simulation(disp);
sim.startEngine();
