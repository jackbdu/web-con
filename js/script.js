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

function sendCmd(cmd) {

  try {
    ws.send(cmd)
    display('"'+cmd+'" sent');
  } catch (error) {
    display('"'+cmd+'" failed to send');
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
    sendCmd('s,'+elem.id.charAt(0)+',h,'+hVal)
    sendCmd('s,'+elem.id.charAt(0)+',v,'+vVal)
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
    sendCmd('s,'+elem.id.charAt(0)+',center,2048')
  }

}

// Get a reference to an element.
var buttons = document.querySelectorAll('button');

for (var i = 0; i < buttons.length; i++) {
  // Create an instance of Hammer with the reference.
  var hammer = new Hammer(buttons[i]);

  hammer.on('tap', function(e) {
    var button = e.target.id;
    sendCmd('p,'+button);
  });

  hammer.on('press', function(e) {
    var button = e.target.id;
    sendCmd('d,'+button);
  });

  hammer.on('pressup', function(e) {
    var button = e.target.id;
    sendCmd('u,'+button);
  });
}

var keysDown = [];

document.addEventListener('keydown', function(e) {
  let button = code2button(e.code);
  if (button) {
    if (!keysDown.includes(e.code)) {
      keysDown.push(e.code);
      sendCmd('d,'+button);
    }
  }
  if (e.code === 'Slash') {
    document.body.classList.add('help');
  }
});

document.addEventListener('keyup', function(e) {
  let button = code2button(e.code);
  if (button) {
    if (keysDown.includes(e.code)) {
      var index = keysDown.indexOf(e.code);
      if (index > -1) {
        keysDown.splice(index, 1);
      }
      sendCmd('u,'+button);
    }
  }
  if (e.code === 'Slash') {
    document.body.classList.remove('help');
  }
});

function code2button(code) {
  let button;
  switch(code) {
    case 'ArrowUp':
      button = 'up';
      break;
    case 'KeyW':
      button = 'up';
      break;
    case 'ArrowRight':
      button = 'right';
      break;
    case 'KeyD':
      button = 'right';
      break;
    case 'ArrowDown':
      button = 'down';
      break;
    case 'KeyS':
      button = 'down';
      break;
    case 'ArrowLeft':
      button = 'left';
      break;
    case 'KeyA':
      button = 'left';
      break;
    case 'KeyI':
      button = 'x'
      break;
    case 'KeyL':
      button = 'a'
      break;
    case 'Enter':
      button = 'a'
      break;
    case 'Space':
      button = 'a'
      break;
    case 'KeyK':
      button = 'b'
      break;
    case 'Escape':
      button = 'b'
      break;
    case 'KeyJ':
      button = 'y'
      break;
    case 'Digit3':
      button = 'zl'
      break;
    case 'ShiftLeft':
      button = 'zl'
      break;
    case 'Digit8':
      button = 'zr'
      break;
    case 'ShiftRight':
      button = 'zr'
      break;
    case 'KeyE':
      button = 'l'
      break;
    case 'AltLeft':
      button = 'l'
      break;
    case 'KeyU':
      button = 'r'
      break;
    case 'AltRight':
      button = 'r'
      break;
    case 'KeyR':
      button = 'minus'
      break;
    case 'MetaLeft':
      button = 'minus'
      break;
    case 'Minus':
      button = 'minus'
      break;
    case 'KeyY':
      button = 'plus'
      break;
    case 'MetaRight':
      button = 'plus'
      break;
    case 'Equal':
      button = 'plus'
      break;
    case 'KeyH':
      button = 'home'
      break;
    case 'KeyC':
      button = 'capture'
      break;
    case 'KeyF':
      button = 'capture'
      break;
  }
  return button;
}
