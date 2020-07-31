var host = findGetParameter("host");
var debug = findGetParameter("debug");
var type = findGetParameter("type");
type = type ? type : "pro";

function display(str) {
  if (debug === 'true') {
    var display = document.getElementById("display");
    display.style.display = 'block';
    var escaped = str.replace(/&/, "&amp;").replace(/</, "&lt;").
        replace(/>/, "&gt;").replace(/"/, "&quot;"); // "
    display.innerHTML = "$ "+escaped;
    console.log("DEBUG: "+str);
  }
}

// get parameter by name
// https://stackoverflow.com/questions/5448545/how-to-retrieve-get-parameters-from-javascript
function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    var items = location.search.substr(1).split("&");
    for (var index = 0; index < items.length; index++) {
        tmp = items[index].split("=");
        if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
    }
    return result;
}

var ws;

function init() {

  display("Welcome to Web-Con!");

  if (type === "left" || type === "right") {
    document.body.className = "joy " + type;
  } else {
    document.body.className = "pro";
  }

  if (host) {

    // Connect to Web Socket
    ws = new WebSocket(host);

    // Set event handlers.
    ws.onopen = function() {
      console.log("onopen");
    };

    ws.onmessage = function(e) {
      // e.data contains received string.
      console.log("onmessage: " + e.data);
    };

    ws.onclose = function() {
      console.log("onclose");
    };

    ws.onerror = function(e) {
      console.log("onerror");
      console.log(e)
    };
  }

}

dragElement(document.getElementById("l_stick"));
dragElement(document.getElementById("r_stick"));


function dragElement(elem) {
  var initX = 0, initY = 0, posX = 0, posY = 0;
  var constraint = elem.clientWidth/2;

  elem.ontouchstart = dragStart;
  elem.onmousedown = dragStart;

  function dragStart(e) {
    e = e || window.event;
    e.preventDefault();
    // get the touch position at startup:
    initX = e.pageX;
    initY = e.pageY;
    if(e.targetTouches) {
      for (var i = 0; i < e.targetTouches.length; i++) {
        if (e.targetTouches[i].target == elem) {
          initX = e.targetTouches[i].clientX;
          initY = e.targetTouches[i].clientY;
          break;
        }
      }
    }
    elem.ontouchend = dragEnd;
    elem.ontouchcancel = dragEnd;
    elem.ontouchmove = dragMove;
    document.onmouseup = dragEnd;
    document.onmousemove = dragMove;
    console.log('Drag started at '+initX+', '+initY);
  }

  function dragMove(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new touch position:
    posX = e.pageX - initX;
    posY = e.pageY - initY;
    if(e.targetTouches) {
      for (var i = 0; i < e.targetTouches.length; i++) {
        if (e.targetTouches[i].target == elem) {
          posX = e.targetTouches[i].clientX - initX;
          posY = e.targetTouches[i].clientY - initY;
          break;
        }
      }
    }
    tmag = Math.sqrt(posX**2+posY**2);
    if (tmag > constraint) {
      posY = posY*constraint/tmag;
      posX = posX*constraint/tmag;
    }
    elem.style.top = posY + "px";
    elem.style.left = posX + "px";
    var hVal = 0;
    var vVal = 0;
    if (type === "left" && window.innerWidth / window.innerHeight >= 4/5) {
      vVal = Math.round(4095*(Math.sin(-posX/constraint/2*Math.PI)+1)/2).toString();
      hVal = Math.round(4095*(Math.sin(-posY/constraint/2*Math.PI)+1)/2).toString();
    } else if (type === "right" && window.innerWidth / window.innerHeight >= 4/5) {
      vVal = Math.round(4095*(Math.sin(posX/constraint/2*Math.PI)+1)/2).toString();
      hVal = Math.round(4095*(Math.sin(posY/constraint/2*Math.PI)+1)/2).toString();
    } else {
      hVal = Math.round(4095*(Math.sin(posX/constraint/2*Math.PI)+1)/2).toString();
      vVal = Math.round(4095*(Math.sin(-posY/constraint/2*Math.PI)+1)/2).toString();
    }
    ws.send('s,'+elem.id.charAt(0)+',h,'+hVal)
    ws.send('s,'+elem.id.charAt(0)+',v,'+vVal)
    console.log('Drag moved: s,'+elem.id.charAt(0)+',h,'+hVal);
  }

  function dragEnd() {
    // stop moving when touch ends:
    elem.ontouchend = null;
    elem.ontouchcancel = null;
    elem.ontouchmove = null;
    document.onmouseup = null;
    document.onmousemove = null;
    elem.style.top = "0px";
    elem.style.left = "0px";
    console.log('Drag ended: s,'+elem.id.charAt(0)+',center,2048');
    ws.send('s,'+elem.id.charAt(0)+',center,2048')
  }

}

// Get a reference to an element.
var buttons = document.querySelectorAll('button');

for (var i = 0; i < buttons.length; i++) {
  // Create an instance of Hammer with the reference.
  var hammer = new Hammer(buttons[i]);

  hammer.on('tap', function(e) {
    console.log(e);
    var buttonId = e.target.id;
    display("Button <" + buttonId + "> pushed");
    ws.send('p,'+buttonId);
  });

  hammer.on('press', function(e) {
    var buttonId = e.target.id;
    display("Button <" + buttonId + "> down");
    ws.send('d,'+buttonId);
  });

  hammer.on('pressup', function(e) {
    var buttonId = e.target.id;
    display("Button <" + buttonId + "> up");
    ws.send('u,'+buttonId);
  });
}
