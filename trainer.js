var canvas = document.querySelector("canvas");
canvas.addEventListener('click', function(event) {
  disp.handleClick(event);
}, false);

var currentCode = localStorage["code"] || "var previousPos = 0;\nvar totalError = 0;\n\nfunction loop() {\n  var target = 150;\n  setGraphTarget(target);\n\n  var kP = 1;\n  var kI = 0.025;\n  var kD = 15;\n\n  var error = target - getArmPosition();\n  var changeInError = error - previousPos;\n  if (Math.abs(error) < 15) {\n    totalError += error;\n    kD = 0;\n  } else {\n  	totalError = 0;\n  }\n  if (Math.abs(error) > 50) {\n  	kD = 0;\n  }\n  \n  previousPos = error;\n\n  var P = kP * error;\n  var I = kI * totalError;\n  var D = kD * changeInError;\n  var output = P + I + D;\n\n  setArmPower(output);\n  setGraphVariable(D);\n\n  timeout(loop, 40);\n}\n\nloop();";
var isStopped = false;

var currentMass = 1;
var currentFriction = 1;
var fontMultiplier = 0.85;

var hide = {
  pos:false,
  vel:false,
  acc:true,
  tar:false,
  pwr:true,
  usr:false,
  pauseGraph:false,
  gravity:false,
};

var textarea = document.getElementById("textarea");
textarea.value = currentCode;
var myCodeMirror = CodeMirror.fromTextArea(textarea, {
  value: currentCode,
  mode:  "javascript",
  lineWrapping: true,
  lineNumbers: true
});

var mainContext = document.querySelector("canvas").getContext("2d");
mainContext.canvas.height = 700;
mainContext.canvas.width = 700;


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

  this.customButton = function(xRatio, yRatio, text, textWidth, onClick, depressed, id, width, height, textTopMargin) {
    var targetWidth = width;
    if (depressed) {
      this.rect(xRatio, yRatio, targetWidth, height, "#a9a9a9", 0);
    } else {
      this.rect(xRatio, yRatio, targetWidth, height, "#4885ed", 0);
    }
    var fontN = 15 * fontMultiplier;
    context.font = fontN + "px Arial";
    context.fillStyle = "#ffffff";
    this.text(xRatio + (targetWidth - textWidth) / 2, yRatio + textTopMargin, text);
    var frame = {
        x: xRatio,
        y: yRatio,
        w: width,
        h: height
      }
    addListenerForFrame(frame, onClick, id)
    return frame;
  }

  this.button = function(xRatio, yRatio, text, textWidth, onClick, depressed, id) {
    var targetWidth = 0.09;
    return this.customButton(xRatio, yRatio, text, textWidth, onClick, depressed, id, 0.09, 0.04, 0.027);
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
    var fontN = 25 * fontMultiplier
    context.font = fontN + "px Arial";
    this.text(0.5, 0.45, "Controls");
    this.rect(0.5, 0.46, 0.4, 0.003, "#a9a9a9", 0);


    function setUpButton(name, x, y, display, textWidth) {
      function draw(grayedOut) {
        return button(x, y, display, textWidth, click, grayedOut, name);
      }
      var frame = draw(hide[name]);
      function click() {
        if (hide[name]) {
          hide[name] = false;
          removeListenerForID(name);
          setTimeout(function() {
            draw(false);
          }, 10);
        } else {
          hide[name] = true;
          removeListenerForID(name);
          setTimeout(function() {
            draw(true);
          }, 10);
        }
      }
    }


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
      onReset();
      setTimeout(function() {
        isTimeoutEnabled = true;
        currentCode = myCodeMirror.getValue();
        localStorage["code"] = JSON.parse(JSON.stringify(currentCode));
        eval(currentCode);
      }, 60);
    }
    this.button(0.505, 0.49, "RUN", 0.04, onRun, false, "Run");

    setUpButton("pauseGraph", 0.715, 0.49, "PAUSE", 0.06);

    // Graph Label
    context.fillStyle = "#a9a9a9";
    var fontN = 25 * fontMultiplier;
    context.font = fontN + "px Arial";
    this.text(0.5, 0.59, "Graph");
    this.rect(0.5, 0.6, 0.4, 0.003, "#a9a9a9", 0);

    fontN = 15 * fontMultiplier;
    context.font = "normal normal bold " + fontN + "px Arial";
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


    function setUpHideButton(a,b,c) {
      setUpButton(a,b,c,"HIDE", 0.045);
    }

    setUpHideButton("pos", 0.62, 0.614);
    setUpHideButton("vel", 0.62, 0.674);
    setUpHideButton("acc", 0.62, 0.734);
    setUpHideButton("tar", 0.81, 0.614);
    setUpHideButton("pwr", 0.81, 0.674);
    setUpHideButton("usr", 0.81, 0.734);


    // Sim Label
    context.fillStyle = "#a9a9a9";
    var fontN = 25 * fontMultiplier;
    context.font = fontN + "px Arial";
    this.text(0.5, 0.83, "Simulator");
    this.rect(0.5, 0.84, 0.4, 0.003, "#a9a9a9", 0);

    setUpButton("gravity", 0.505, 0.86, "GRAVITY", 0.08);

    function onUpFriction() {
      currentFriction += 0.1;
    }
    this.customButton(0.65, 0.92, "+", 0.01, onUpFriction, false, "frictionUp", 0.025, 0.025, 0.02);
    function onDownFriction() {
      currentFriction -= 0.1
    }
    this.customButton(0.69, 0.92, "-", 0.005, onDownFriction, false, "frictionDown", 0.025, 0.025, 0.017);

    function onUpMass() {
      currentMass += 0.1
    }
    this.customButton(0.78, 0.92, "+", 0.01, onUpMass, false, "massUp", 0.025, 0.025, 0.02);
    function onDownMass() {
      currentMass -= 0.1
    }
    this.customButton(0.82, 0.92, "-", 0.005, onDownMass, false, "massDown", 0.025, 0.025, 0.017);

  }

  var graphLeftEdge = 0.05;
  var graphBottomEdge = 0.35;
  var graphWidth = 0.9;
  var graphHeight = 0.3;

  this.target = 0;

  this.telemetrySetup = function() {

    this.rect(0.05, 0.05, 0.002, 0.3, "#a9a9a9", 0);
    this.rect(0.05, 0.35, graphWidth, 0.002, "#a9a9a9", 0);

    context.rotate(Math.PI / 2);
    var fontN = 20 * fontMultiplier;
    context.font = fontN + "px Arial";
    this.text(0.15, -0.016, "Value");
    context.rotate(-Math.PI / 2);

    this.text(graphWidth / 2 + 0.04, graphBottomEdge + 0.028, "Time");
  }

  this.setTelemetryData = function(history) {

    // Set number data

    this.getLatest = function(arr) {
      return arr[arr.length - 1];
    }
    this.log = function(x, y, z) {
      this.rect(x, y - 0.02, 0.08, 0.02, "#ffffff", 0);
      context.fillStyle = "#787878";
      var fontN = 15 * fontMultiplier;
      context.font = "normal normal bold " + fontN + "px Arial";
      this.text(x, y, z);
    }

    var unroundedPosition = this.getLatest(history.pValues) / ((2*Math.PI) / 360);

    this.log(0.5, 0.67, (Math.round(unroundedPosition * 100) / 100));
    this.log(0.5, 0.73, Math.round(this.getLatest(history.vValues) * 10000) / 10);
    this.log(0.5, 0.79, Math.round(this.getLatest(history.aValues) * 100000) / 10);
    this.log(0.72, 0.67, Math.round(this.target * 100) / 100);
    this.log(0.72, 0.73, Math.round(this.getLatest(history.power) * 100) / 100);
    this.log(0.72, 0.79, Math.round(this.getLatest(history.usr) * 100) / 100);

    this.log(0.64, 0.87, "Friction:");
    this.log(0.79, 0.87, "Mass:");
    this.log(0.675, 0.9, Math.round(currentFriction * 10) / 10);
    this.log(0.805, 0.9, Math.round(currentMass * 10) / 10);


    // clear graph
    this.rect(graphLeftEdge + 0.005, 0, graphWidth + 0.01, graphBottomEdge, "#ffffff", 0);
    this.rect(0, 0, graphWidth + 0.01, graphLeftEdge + 0.005, "#ffffff", 0);
    context.fillStyle = "#a9a9a9";
    var fontN = 25 * fontMultiplier;
    context.font = fontN + "px Arial";
    context.fillText("Telemetry", 10, 30);

    //target line
    if (!hide.tar) {
      this.rect(graphLeftEdge + 0.005, graphBottomEdge - ((this.target / (360)) * graphHeight) - 0.005, graphWidth, 0.001, "#0F9D58", 0);
    }

    var yScale = {min: 0, max: 6.28};
    var yVelScale = {min: -0.3, max: 0.3};
    var yAccelScale = {min: -0.01, max: 0.01};
    var pwrScale = {min: -127, max:127};
    var usrScale = {min: 0, max: 1};
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
        if (yVal < 1 && yVal > 0) {
          this.circle(graphLeftEdge + 0.01 + (xDelta * i), graphBottomEdge - (graphHeight * yVal) - 0.005, 0.001, color);
        }
      }
    }
    if (!hide.pos) {
      this.graphData(history.pValues, "#DB4437", yScale);
    }
    if (!hide.vel) {
      this.graphData(history.vValues, "#4285F4", yVelScale);
    }
    if (!hide.acc) {
      this.graphData(history.aValues, "#F4B400", yAccelScale);
    }
    if (!hide.pwr) {
      this.graphData(history.power, "#000000", pwrScale);
    }
    if (!hide.usr) {
      this.graphData(history.usr, "#800080", usrScale);
    }
  }

  this.drawBackgroundGraphics = function() {
    this.rect(0, 0.4, 0.5, 0.6, "#ffffff", 0);
    //motor
    this.rect(0.175, 0.65, 0.18, 0.1, "#181818", 0);

    // Draw Center Mount Thing
    this.rect(0.2, 0.6, 0.1, 0.4, "#808080", 0);

    //Encoder
    this.rect(0.18, 0.63, 0.14, 0.14, "#DB4437", 0);

    var fontN = 17 * fontMultiplier;
    context.font = fontN + "px Arial";
    context.rotate(Math.PI / 2);
    context.fillStyle = "#ffffff";

    //Motor Label
    this.text(0.662, -0.33, "MOTOR");
    // Encoder label
    this.text(0.65, -0.295, "ENCODER");
    context.rotate(-Math.PI / 2);
  }
  this.drawArmAtAngle = function(angle) {
    this.rect(0.25, 0.7, 0.035, 0.23, "#a9a9a9", angle);
    this.rect(0.25, 0.7, -0.035, 0.23, "#a9a9a9", angle);
    this.rect(0.25, 0.7, 0.035, -0.06, "#a9a9a9", angle);
    this.rect(0.25, 0.7, -0.035, -0.06, "#a9a9a9", angle);
  }

  this.drawForegroundGraphics = function(angle) {
    this.circle(0.25, 0.7, 0.01, "#ffffff");
    var x = 0.007
    this.rect(0.25, 0.7, x, x, "#a9a9a9", angle + 0.785);
    this.rect(0.25, 0.7, x, -x, "#a9a9a9", angle + 0.785);
    this.rect(0.25, 0.7, -x, x, "#a9a9a9", angle + 0.785);
    this.rect(0.25, 0.7, -x, -x, "#a9a9a9", angle + 0.785);
  }

  this.setFromSimulation = function(simulationObject) {
    this.drawBackgroundGraphics();
    this.drawArmAtAngle(simulationObject.armAngle);
    this.drawForegroundGraphics(simulationObject.armAngle);
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
  this.friction = currentFriction / 10;
  this.armPosition = 0;
  this.userSet = 0;

  this.history = {
    pValues : [],
    vValues : [],
    aValues : [],
    power : [],
    usr : []
  }

  this.previousPos = 0;

  this.simulationObject = {
    armAngle: 0
  };

  this.run = function() {
    if (hide.pauseGraph) {
      return
    }
    var gravityForce =  -currentMass * Math.sin(this.armPosition) * 0.005;
    if (hide.gravity) {
      gravityForce = 0;
    }
    this.friction = currentFriction / 10;
    var accel = ((this.armForce * 3) - this.friction * this.armVelocity + gravityForce) / currentMass;
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
    this.history.power.push(this.armForce * 12700);
    this.history.usr.push(this.userSet);

     if (this.history.pValues.length > 500) {
       this.history = {
         pValues : [],
         vValues : [],
         aValues : [],
         power : [],
         usr : []
       }
     }
     var pos = this.armPosition;
     setTimeout(function() {
       var fakeError = (Math.random() - 0.5) / 10;
       outputPosition = pos + fakeError;
     }, 40);
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
  if (voltage > 127) {
    voltage = 127;
  }
  if (voltage < -127) {
    voltage = -127;
  }
  sim.armForce = (voltage / (12700));
}

function setGraphTarget(position) {
  disp.target = position;
}

function setGraphVariable(x) {
  sim.userSet = x;
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
