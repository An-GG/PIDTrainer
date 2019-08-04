
var myCodeMirror = CodeMirror(document.body, {
  value: "setArmPower(127);",
  mode:  "javascript"
});

var canvas = document.querySelector("canvas");
canvas.addEventListener('click', function(event) {
  disp.handleClick(event);
}, false);

var currentCode = "";


var mainContext = document.querySelector("canvas").getContext("2d");
mainContext.canvas.height = 800;
mainContext.canvas.width = 800;


// DISPLAY MODULE
const Display = function(context) {

  this.context = context;

  this.setup = function() {
    this.telemetrySetup();
    this.setupUI();
  }

  var listeners = [];

  function addListenerForFrame(frame, listener, id) {
    listeners.push({
      frame: frame,
      listener: listener,
      id: id
    })
  }

  function removeListenerForID(id) {
    var i;
    for (i = 0; i < listeners.length; i++) {
      if (listeners[i].id = id) {
        listeners.splice(i, 1);
      }
    }
  }

  function removeListenerForFrame(frame) {
    var i;
    for (i = 0; i < listeners.length; i++) {
      if (listeners[i].frame = frame) {
        listeners.splice(i, 1);
      }
    }
  }

  this.callbackListenerForPoint = function(x, y) {
    var i;

    for (i = 0; i < listeners.length; i++) {


      var l = listeners[i];
      if (x > l.frame.x && y > l.frame.y) {
        if (x < l.frame.x + l.frame.w && y < l.frame.y + l.frame.h) {
          l.listener();
        }
      }
    }
  }

  this.handleClick = function(event) {
    var x = event.pageX - canvas.offsetLeft;
    var y = event.pageY - canvas.offsetTop;
    this.callbackListenerForPoint(x / mainContext.canvas.height, y / mainContext.canvas.width);
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

  this.button = function(xRatio, yRatio, text, textWidth, onClick, depressed, id) {
    if (depressed) {
      this.rect(xRatio, yRatio, 0.04 + textWidth, 0.05, "#a9a9a9", 0);
    } else {
      this.rect(xRatio, yRatio, 0.04 + textWidth, 0.05, "#800080", 0);
    }
    context.font = "20px Arial";
    context.fillStyle = "#ffffff";
    this.text(xRatio + 0.02, yRatio + 0.035, text);
    var frame = {
        x: xRatio,
        y: yRatio,
        w: textWidth + 0.04,
        h: 0.05
      }
    addListenerForFrame(frame, onClick, id)
    return frame;
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

  this.setupUI = function() {
    // Reset Button
    function onReset() {
      currentCode = "";
      isTimeoutEnabled = false;
      sim.armForce = 0;
      sim.armVelocity = 0;
      sim.armPosition = 0;
      setTimeout(function() {
        sim.armForce = 0;
        sim.armVelocity = 0;
        sim.armPosition = 0;
      }, 50);
    }
    this.button(0.6, 0.7, "Reset", 0.07, onReset, false, "Reset");

    // Run Button
    function onRun() {
      isTimeoutEnabled = true;
      currentCode = myCodeMirror.getValue();
      eval(currentCode);
    }
    this.button(0.6, 0.8, "Run", 0.05, onRun, false, "Run");
  }

  var graphLeftEdge = 0.05;
  var graphBottomEdge = 0.35;
  var graphWidth = 0.8;
  var graphHeight = 0.3;

  this.target = 0;

  this.telemetrySetup = function() {

    this.rect(0.05, 0.05, 0.002, 0.3, "#a9a9a9", 0);
    this.rect(0.05, 0.35, graphWidth, 0.002, "#a9a9a9", 0);

    context.rotate(Math.PI / 2);
    context.font = "20px Arial";
    this.text(0.15, -0.016, "Value");
    context.rotate(-Math.PI / 2);

    this.text(graphWidth / 2 + 0.04, graphBottomEdge + 0.028, "Time");
  }

  this.setTelemetryData = function(history) {
    // clear graph
    this.rect(graphLeftEdge + 0.005, 0, graphWidth + 0.01, graphBottomEdge, "#ffffff", 0);
    context.fillStyle = "#a9a9a9";
    context.font = "25px Arial";
    context.fillText("Telemetry", 10, 30);

    //target line
    this.rect(graphLeftEdge + 0.005, graphBottomEdge - ((this.target / (Math.PI * 2)) * graphHeight) - 0.01, graphWidth, 0.001, "#0F9D58", 0)

    var yScale = {min: 0, max: 6.28};
    var yVelScale = {min: -0.1, max: 0.1};
    var yAccelScale = {min: -0.1, max: 0.1};
    var standardXDelta = 0.002;
    var xDelta = 0.002;
    this.graphData = function(data, color, scale) {
      if (0.002 * data.length > graphWidth) {
        xDelta = graphWidth / data.length;
      }
      var i;
      var highest;
      var lowest;
      for (i = 0; i < data.length; i++) {
        if (i == 0) {
          highest = data[i];
          lowest = data[i];
        } else {
          if (data[i] > highest) {
            highest = data[i];
          }
          if (data[i] < lowest) {
            lowest = data[i];
          }
        }
      }
      var autoScale = highest - lowest;
      for (i = 0; i < data.length; i++) {
        var yVal;
        if (scale == "auto") {
          var yVal = (data[i] - lowest) / autoScale;
        } else {
          yVal = (data[i] - scale.min) / (scale.max - scale.min);
        }
        this.circle(graphLeftEdge + 0.01 + (xDelta * i), graphBottomEdge - (graphHeight * yVal) - 0.005, 0.001, color);
      }
    }
    this.graphData(history.pValues, "#DB4437", yScale);
    this.graphData(history.vValues, "#4285F4", yVelScale);
    this.graphData(history.aValues, "#F4B400", "auto");

  }

  this.drawBackgroundGraphics = function() {
    this.rect(0, 0.4, 0.5, 0.6, "#ffffff", 0);
    // Draw Center Mount Thing
    this.rect(0.2, 0.6, 0.1, 0.4, "#808080", 0);
  }
  this.drawArmAtAngle = function(angle) {
    this.rect(0.25, 0.7, 0.035, 0.23, "#a9a9a9", angle);
    this.rect(0.25, 0.7, -0.035, 0.23, "#a9a9a9", angle);
    this.rect(0.25, 0.7, 0.035, -0.07, "#a9a9a9", angle);
    this.rect(0.25, 0.7, -0.035, -0.07, "#a9a9a9", angle);
  }

  this.drawForegroundGraphics = function() {
    this.circle(0.25, 0.7, 0.01, "#ffffff");
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

  this.armVelocity = 0;
  this.armForce = 0.0;
  this.friction = 0.1;
  this.armPosition = 0;

  this.history = {
    pValues : [],
    vValues : [],
    aValues : []
  }

  this.previousPos = 0;

  this.simulationObject = {
    armAngle: 0
  };

  this.run = function() {
    var accel = this.armForce - (this.friction * this.armVelocity)
    this.armVelocity += accel;
    this.armPosition += this.armVelocity;
    while(this.armPosition < 0) {
      this.armPosition += Math.PI * 2;
    }
    while(this.armPosition > Math.PI * 2) {
      this.armPosition -= Math.PI * 2;
    }
    this.simulationObject = {
      armAngle: this.armPosition,
      armVelocity: this.armVelocity,
      armAcceleration: accel
    }
    this.history.pValues.push(this.armPosition);
    this.history.vValues.push(this.armVelocity);
    this.history.aValues.push(accel);

     if (this.history.pValues.length > 500) {
       this.history = {
         pValues : [],
         vValues : [],
         aValues : []
       }
     }
     var pos = this.armPosition;
     setTimeout(function() {
       var fakeError = (Math.random() - 0.5) / 5;
       outputPosition = pos + fakeError;
     }, 20);
  }

  this.render = function() {
    display.setFromSimulation(this.simulationObject);
    display.setTelemetryData(this.history);
  }

  this.startEngine = function() {
    var engine = new Engine(this.run.bind(this), this.render.bind(this));
    engine.start();
  }

}

var outputPosition = 0;
var isTimeoutEnabled = true;

function getArmPosition() {
  return outputPosition;
}

function setArmPower(voltage) {
  sim.armForce = (voltage / 12700);
}

function setGraphTarget(position) {
  disp.target = position;
}

function timeout(callback, ms) {
  if (isTimeoutEnabled) {
    setTimeout(callback, ms);
  }
}


var disp = new Display(mainContext);
disp.setup();
var sim = new Simulation(disp);
sim.startEngine();
