var canvas = document.querySelector("canvas");
canvas.addEventListener('click', function(event) {
  disp.handleClick(event);
}, false);

var currentCode = localStorage["code"] || "function loop() {\n  \n  timeout(loop, 20);\n}\n\nloop();";
var isStopped = false;
var pauseGraph = false;

var hidePos = false;
var hideVel = false;
var hideAcc = false;
var hideTar = false;
var hidePwr = false;
var hideUsr = false;

var textarea = document.getElementById("textarea");
textarea.value = currentCode;
var myCodeMirror = CodeMirror.fromTextArea(textarea, {
  value: currentCode,
  mode:  "javascript",
  lineWrapping: true,
  lineNumbers: true
});

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
      if (listeners[i].id == id) {
        listeners.splice(i, 1);
      }
    }
  }

  function removeListenerForFrame(frame) {
    var i;
    for (i = 0; i < listeners.length; i++) {
      if (listeners[i].frame == frame) {
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
    console.log(listeners);
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
    var targetWidth = 0.09;
    if (depressed) {
      this.rect(xRatio, yRatio, targetWidth, 0.04, "#a9a9a9", 0);
    } else {
      this.rect(xRatio, yRatio, targetWidth, 0.04, "#4885ed", 0);
    }
    context.font = "15px Arial";
    context.fillStyle = "#ffffff";
    this.text(xRatio + (targetWidth - textWidth) / 2, yRatio + 0.027, text);
    var frame = {
        x: xRatio,
        y: yRatio,
        w: textWidth + 0.04,
        h: 0.05
      }
    addListenerForFrame(frame, onClick, id)
    return frame;
  }
  var button = this.button.bind(this);

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
    // Controls Label
    context.fillStyle = "#a9a9a9";
    context.font = "25px Arial";
    this.text(0.5, 0.45, "Controls");
    this.rect(0.5, 0.46, 0.4, 0.003, "#a9a9a9", 0);

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
    this.button(0.61, 0.49, "RESET", 0.06, onReset, false, "Reset");

    // Run Button
    function onRun() {
      isTimeoutEnabled = true;
      currentCode = myCodeMirror.getValue();
      localStorage["code"] = JSON.parse(JSON.stringify(currentCode));
      eval(currentCode);
    }
    this.button(0.505, 0.49, "RUN", 0.04, onRun, false, "Run");

    // Pause Graph Resume Button
    this.onResumeGraph = function() {
      pauseGraph = false;
      removeListenerForID("Resume Graph");
      this.button(0.715, 0.49, "PAUSE", 0.06, this.onPauseGraph.bind(this), false, "Pause Graph");
    }


    // Pause Graph Button
    this.onPauseGraph = function() {
      pauseGraph = true;
      removeListenerForID("Pause Graph");
      this.button(0.715, 0.49, "PAUSE", 0.06, this.onResumeGraph.bind(this), true, "Resume Graph");
    }
    this.button(0.715, 0.49, "PAUSE", 0.06, this.onPauseGraph.bind(this), false, "Pause Graph");

    // Graph Label
    context.fillStyle = "#a9a9a9";
    context.font = "25px Arial";
    this.text(0.5, 0.59, "Graph");
    this.rect(0.5, 0.6, 0.4, 0.003, "#a9a9a9", 0);

    context.font = "normal normal bold 15px Arial";
    context.fillStyle = "#DB4437";
    this.text(0.5, 0.64, "Position");

    context.fillStyle = "#4285F4";
    this.text(0.5, 0.7, "Velocity");

    context.fillStyle = "#F4B400";
    this.text(0.5, 0.76, "Acceleration");

    context.fillStyle = "#0F9D58";
    this.text(0.72, 0.64, "Target");

    context.fillStyle = "#000000";
    this.text(0.72, 0.7, "Power");

    context.fillStyle = "#800080";
    this.text(0.72, 0.76, "User Set");

    function onHidePos() {
      button(0.62, 0.614, "HIDE", 0.045, onUnhidePos, true, "Unhide Pos");
      hidePos = true;
      console.log("test");
      removeListenerForID("Hide Pos");

    }
    function onUnhidePos() {
      hidePos = false;
      removeListenerForID("Unhide Pos");
      button(0.62, 0.614, "HIDE", 0.045, onHidePos, false, "Hide Pos");
    }
    button(0.62, 0.614, "HIDE", 0.045, onHidePos, false, "Hide Pos");


    function onHideVel() {
      hideVel = true;
      removeListenerForID("Hide Vel");
      button(0.62, 0.674, "HIDE", 0.045, onUnhideVel, true, "Unhide Vel");
    }
    function onUnhideVel() {
      hideVel = false;
      removeListenerForID("Unhide Vel");
      button(0.62, 0.674, "HIDE", 0.045, onHideVel, false, "Hide Vel");
    }
    button(0.62, 0.674, "HIDE", 0.045, onHideVel, false, "Hide Vel");

    function onHideAcc() {
      hideAcc = true;
      removeListenerForID("Hide Acc");
      button(0.62, 0.734, "HIDE", 0.045, onUnhideAcc, true, "Unhide Acc");
    }
    function onUnhideAcc() {
      hideAcc = false;
      removeListenerForID("Unhide Acc");
      button(0.62, 0.734, "HIDE", 0.045, onHideAcc, false, "Hide Acc");
    }
    button(0.62, 0.734, "HIDE", 0.045, onUnhideAcc, false, "Hide Acc");

    function onHideTar() {
      hideTar = true;
      removeListenerForID("Hide Tar");
      button(0.81, 0.734, "HIDE", 0.045, onUnhideTar, true, "Unhide Tar");
    }
    function onUnhideTar() {
      hideTar = false;
      removeListenerForID("Unhide Tar");
      button(0.81, 0.734, "HIDE", 0.045, onHideTar, false, "Hide Tar");
    }
    button(0.81, 0.734, "HIDE", 0.045, onHideTar, false, "Hide Tar");


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
    this.rect(0, 0, graphWidth + 0.01, graphLeftEdge + 0.005, "#ffffff", 0);
    context.fillStyle = "#a9a9a9";
    context.font = "25px Arial";
    context.fillText("Telemetry", 10, 30);

    //target line
    this.rect(graphLeftEdge + 0.005, graphBottomEdge - ((this.target / (360)) * graphHeight) - 0.01, graphWidth, 0.001, "#0F9D58", 0)

    var yScale = {min: 0, max: 6.28};
    var yVelScale = {min: -0.1, max: 0.1};
    var yAccelScale = {min: -0.1, max: 0.1};
    var standardXDelta = 0.002;
    var xDelta = 0.002;
    this.graphData = function(data, color, scale) {
      while(data.length > 490) {
        data.shift();
      }
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
    if (!hidePos) {
      this.graphData(history.pValues, "#DB4437", yScale);
    }
    if (!hideVel) {
      this.graphData(history.vValues, "#4285F4", yVelScale);
    }
    if (!hideAcc) {
      this.graphData(history.aValues, "#F4B400", yAccelScale);
    }
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
    if (pauseGraph) {
      return
    }
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
  return (outputPosition / (2*Math.PI))*360;
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
