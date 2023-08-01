const storageKey = 'gzbdata';

chrome.storage.local.get(storageKey).then((store) => {
  try {
    const data = store[storageKey];
    const settings = JSON.parse(data);
    init(settings);
  } catch (e) {
    init();
  }
});

function init(storedSettings) {
  const settings = Object.assign(
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

  const rendererWidth = 1800;
  const rendererHeight = 1000;
  const boardAspectRatio = rendererWidth / rendererHeight;
  const pointer = document.createElement('div');
  let lastGameType = null;

  pointer.className = 'gzb-cursor';
  document.body.appendChild(pointer);

  const ui = {
    cursor() {
      if (settings.cursor) {
        document.body.classList.remove('gzb-hidden-cursor');
      } else {
        document.body.classList.add('gzb-hidden-cursor');
      }
    },
    shadow() {
      if (settings.shadow) {
        pointer.style.background = hexToRgba(
          settings.shadowColor,
          settings.shadowOpacity
        );
      } else {
        pointer.style.background = hexToRgba(settings.shadowColor, 0);
      }
    },
    border() {
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
    point() {
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

  chrome.runtime.onMessage.addListener((event) => {
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
    const renderer = getRenderer();
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
    const ball = document.querySelector('.BilliardsSpinButton');
    if (!ball) return null;
    const bounds = ball.getBoundingClientRect();

    return {
      x: bounds.left + bounds.width / 2 - gzBallRadius,
      y: bounds.top + bounds.height / 2 - gzBallRadius,
    };
  }

  function getIntersectionPoint(x1, y1, x2, y2, top, bottom, left, right) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const t1 = (left - x1) / dx;
    const t2 = (right - x1) / dx;
    const t3 = (top - y1) / dy;
    const t4 = (bottom - y1) / dy;
    const tmin = Math.max(Math.min(t1, t2), Math.min(t3, t4));

    return {
      x: x1 + tmin * dx,
      y: y1 + tmin * dy,
    };
  }

  function moveCustomPointer(event) {
    const bounds = getRendererBounds();
    const height = bounds.width / boardAspectRatio;
    const bandSize = (height * settings.bandSize) / rendererHeight;
    const diameter = (height * settings.diameter) / rendererHeight;
    const radius = diameter / 2;
    const wballpos = getWhiteBallwhiteBallPosition(radius);
    const area = getBoardArea(bounds, bandSize);
    const mouseX = event.clientX - radius;
    const mouseY = event.clientY - radius;
    const maxX = bounds.left + bandSize + area.width - diameter;
    const maxY = bounds.top + bandSize + area.height - diameter;
    let x = Math.min(Math.max(area.left, mouseX), maxX);
    let y = Math.min(Math.max(area.top, mouseY), maxY);
    const isPointerOff =
      mouseX < area.left || mouseX > maxX || mouseY < area.top || mouseY > maxY;

    if (wballpos && isPointerOff) {
      const rectTop = area.top;
      const rectBottom = area.top + area.height - diameter;
      const rectLeft = area.left;
      const rectRight = area.left + area.width - diameter;
      const point = getIntersectionPoint(
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
    const node = document.querySelector('div.DG_GameName > b');
    const type = node && node.textContent.trim();
    return type;
  }

  setInterval(() => {
    const type = getCurrentGameType();
    adjustSettingsPerGameType(type);
  }, 1000);

  document.addEventListener('mousemove', onMouseMove);
}
