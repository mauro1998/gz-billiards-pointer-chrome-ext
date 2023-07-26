(function () {
  var rendererWidth = 1800;
  var rendererHeight = 1000;
  var originalBandSize = 94;
  var originalBallSize = 50;
  var boardAspectRatio = rendererWidth / rendererHeight;
  var pointer = document.createElement('div');
  pointer.className = 'gzb-cursor';
  document.body.appendChild(pointer);
  document.body.classList.add('gzb-hidden-cursor');

  function getRenderer() {
    return document.querySelector('canvas#BilliardsRenderer');
  }

  function getRendererBounds() {
    var renderer = getRenderer();
    return renderer.getBoundingClientRect();
  }

  function getGameArea(bounds, bandSize) {
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

  function moveCustomPointer(event) {
    var bounds = getRendererBounds();
    var height = bounds.width / boardAspectRatio;
    var bandSize = (height * originalBandSize) / rendererHeight;
    var diameter = (height * originalBallSize) / rendererHeight;
    var radius = diameter / 2;
    var whiteBallPos = getWhiteBallwhiteBallPosition(radius);
    var area = getGameArea(bounds, bandSize);
    var maxX = area.width - diameter;
    var maxY = area.height - diameter;
    var mouseX = event.clientX - area.left;
    var mouseY = event.clientY - area.top;
    var x, y;

    if (whiteBallPos) {
      x = whiteBallPos.x;
      y = whiteBallPos.y;
    } else {
      x = area.left + Math.min(Math.max(0, mouseX - radius), maxX);
      y = area.top + Math.min(Math.max(0, mouseY - radius), maxY);
    }

    pointer.style.width = diameter + 'px';
    pointer.style.height = diameter + 'px';
    pointer.style.left = x + 'px';
    pointer.style.top = y + 'px';
  }

  document.addEventListener('mousemove', function (event) {
    if (isRendererPresent()) {
      moveCustomPointer(event);
      pointer.style.display = 'block';
    } else {
      pointer.style.display = 'none';
    }

    // if (isMouseOverBilliardsTable(event.target)) {
    //   event.target.classList.add('gzb-hidden-cursor');
    //   pointer.classList.remove('gzb-hidden');
    // } else {
    //   pointer.classList.add('gzb-hidden');
    //   var table = document.querySelector('gzb-hidden-cursor');

    //   if (table) {
    //     table.classList.add('gzb-hidden-cursor');
    //   }
    // }
  });
})();
