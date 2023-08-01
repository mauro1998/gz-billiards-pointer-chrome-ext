(function () {
  var storageKey = 'gzbdata';

  chrome.storage.local.get(storageKey).then(function (store) {
    var data = store[storageKey];

    if (data) {
      var settings = JSON.parse(data);
      init(settings);
    }
  });

  function init(storedSettings) {
    var settings = Object.assign(
      {
        cursor: true,
        diameter: 50,
        bandSize: 93,
        shadow: true,
        shadowOpacity: 0.3,
        shadowColor: '#000000',
        border: true,
        borderWidth: 2,
        borderColor: '#000000',
        borderOpacity: 1,
        point: true,
        pointSize: 2,
        pointColor: '#000000',
        pointOpacity: 1,
      },
      storedSettings || {}
    );

    var rendererWidth = 1800;
    var rendererHeight = 1000;
    var boardAspectRatio = rendererWidth / rendererHeight;
    var pointer = document.createElement('div');
    var lastGameType = null;

    pointer.className = 'gzb-cursor';
    document.body.appendChild(pointer);

    var ui = {
      cursor: function () {
        if (settings.cursor) {
          document.body.classList.remove('gzb-hidden-cursor');
        } else {
          document.body.classList.add('gzb-hidden-cursor');
        }
      },
      shadow: function () {
        if (settings.shadow) {
          pointer.style.background = hexToRgba(
            settings.shadowColor,
            settings.shadowOpacity
          );
        } else {
          pointer.style.background = hexToRgba(settings.shadowColor, 0);
        }
      },
      border: function () {
        if (settings.border) {
          pointer.style.borderStyle = 'solid';
          pointer.style.borderWidth = settings.borderWidth + 'px';
          pointer.style.borderColor = hexToRgba(
            settings.borderColor,
            settings.borderOpacity
          );
        } else {
          pointer.style.border = 'none';
        }
      },
      point: function () {
        if (settings.point) {
          pointer.style.setProperty('--before-display', 'block');
          pointer.style.setProperty('--before-size', settings.pointSize + 'px');
          pointer.style.setProperty(
            '--before-background',
            hexToRgba(settings.pointColor, settings.pointOpacity)
          );
        } else {
          pointer.style.setProperty('--before-display', 'none');
        }
      },
    };

    ui.cursor();
    ui.shadow();
    ui.border();
    ui.point();

    chrome.runtime.onMessage.addListener(function (event) {
      if (event.type === 'change') {
        settings[event.property] = event.value;

        switch (event.property) {
          case 'cursor':
            ui.cursor();
            break;
          case 'shadow':
          case 'shadowOpacity':
          case 'shadowColor':
            ui.shadow();
            break;
          case 'border':
          case 'borderWidth':
          case 'borderOpacity':
          case 'borderColor':
            ui.border();
            break;
          case 'point':
          case 'pointSize':
          case 'pointColor':
          case 'pointOpacity':
            ui.point();
            break;
          default:
            break;
        }
      }
    });

    function adjustSettingsPerGameType(type) {
      if (type !== lastGameType) {
        switch (type) {
          case 'Straight Pool':
          case '8-Ball':
          case '9-Ball':
          case 'Cushion Carom':
          case 'One-Pocket':
          case 'Any-Eight':
          case 'Bank':
          case 'Combination Pool':
          case 'Score-Ball':
            settings.diameter = 49;
            settings.bandSize = 77;
            break;
          case 'Snooker':
          case 'Snooker Plus':
            settings.diameter = 43;
            settings.bandSize = 77;
            break;
          case 'Pyramid':
          case 'Scratch Pyramid':
            settings.diameter = 51;
            settings.bandSize = 77;
            break;
          default:
            settings.diameter = 49;
            settings.bandSize = 91;
            break;
        }

        chrome.storage.local.set({
          [storageKey]: JSON.stringify(settings),
        });

        lastGameType = type;
      }
    }

    function hexToRgba(hex, alpha) {
      hex = hex.replace('#', '');
      const isShortFormat = hex.length === 3;

      if (isShortFormat) {
        hex = hex
          .split('')
          .map((char) => char + char)
          .join('');
      }

      const red = parseInt(hex.substring(0, 2), 16);
      const green = parseInt(hex.substring(2, 4), 16);
      const blue = parseInt(hex.substring(4, 6), 16);

      return 'rgba(' + red + ',' + green + ',' + blue + ',' + alpha + ')';
    }

    function getRenderer() {
      return document.querySelector('canvas#BilliardsRenderer');
    }

    function getRendererBounds() {
      var renderer = getRenderer();
      return renderer.getBoundingClientRect();
    }

    function getBoardArea(bounds, bandSize) {
      return {
        width: bounds.width - bandSize * 2,
        height: bounds.height - bandSize * 2,
        left: bounds.left + bandSize,
        top: bounds.top + bandSize,
      };
    }

    function isRendererPresent() {
      return getRenderer() !== null;
    }

    function getWhiteBallwhiteBallPosition(gzBallRadius) {
      var ball = document.querySelector('.BilliardsSpinButton');
      if (!ball) return null;
      var bounds = ball.getBoundingClientRect();

      return {
        x: bounds.left + bounds.width / 2 - gzBallRadius,
        y: bounds.top + bounds.height / 2 - gzBallRadius,
      };
    }

    function getIntersectionPoint(x1, y1, x2, y2, top, bottom, left, right) {
      var dx = x2 - x1;
      var dy = y2 - y1;
      var t1 = (left - x1) / dx;
      var t2 = (right - x1) / dx;
      var t3 = (top - y1) / dy;
      var t4 = (bottom - y1) / dy;

      var tmin = Math.max(Math.min(t1, t2), Math.min(t3, t4));

      return {
        x: x1 + tmin * dx,
        y: y1 + tmin * dy,
      };
    }

    function moveCustomPointer(event) {
      var bounds = getRendererBounds();
      var height = bounds.width / boardAspectRatio;
      var bandSize = (height * settings.bandSize) / rendererHeight;
      var diameter = (height * settings.diameter) / rendererHeight;
      var radius = diameter / 2;
      var wballpos = getWhiteBallwhiteBallPosition(radius);
      var area = getBoardArea(bounds, bandSize);
      var mouseX = event.clientX - radius;
      var mouseY = event.clientY - radius;
      var maxX = bounds.left + bandSize + area.width - diameter;
      var maxY = bounds.top + bandSize + area.height - diameter;
      var x = Math.min(Math.max(area.left, mouseX), maxX);
      var y = Math.min(Math.max(area.top, mouseY), maxY);
      var isPointerOff =
        mouseX < area.left ||
        mouseX > maxX ||
        mouseY < area.top ||
        mouseY > maxY;

      if (wballpos && isPointerOff) {
        var rectTop = area.top;
        var rectBottom = area.top + area.height - diameter;
        var rectLeft = area.left;
        var rectRight = area.left + area.width - diameter;
        var point = getIntersectionPoint(
          mouseX,
          mouseY,
          wballpos.x,
          wballpos.y,
          rectTop,
          rectBottom,
          rectLeft,
          rectRight
        );
        x = point.x;
        y = point.y;
      }

      pointer.style.width = diameter + 'px';
      pointer.style.height = diameter + 'px';
      pointer.style.left = x + 'px';
      pointer.style.top = y + 'px';
    }

    function onMouseMove(event) {
      if (isRendererPresent()) {
        moveCustomPointer(event);
        pointer.style.display = 'block';
      } else {
        pointer.style.display = 'none';
      }
    }

    function getCurrentGameType() {
      var node = document.querySelector('div.DG_GameName > b');
      var type = node && node.textContent.trim();
      return type;
    }

    setInterval(function () {
      var type = getCurrentGameType();
      adjustSettingsPerGameType(type);
    }, 1000);

    document.addEventListener('mousemove', onMouseMove);
  }
})();
