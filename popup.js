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

    var gui = new dat.GUI({
      closed: false,
      hideable: false,
      closeOnTop: true,
      autoPlace: false,
    });

    var general = gui.addFolder('General');
    general.add(settings, 'cursor').listen();
    general.add(settings, 'diameter', 40, 60, 0.25).listen();
    general.add(settings, 'bandSize', 50, 100, 1).listen();

    var shadow = general.addFolder('Shadow');
    shadow.add(settings, 'shadow').listen();
    shadow.addColor(settings, 'shadowColor').listen();
    shadow.add(settings, 'shadowOpacity', 0.1, 0.75, 0.01).listen();
    shadow.open();

    var border = general.addFolder('Border');
    border.add(settings, 'border').listen();
    border.add(settings, 'borderWidth', 1, 5, 1).listen();
    border.addColor(settings, 'borderColor').listen();
    border.add(settings, 'borderOpacity', 0.1, 1, 0.1).listen();
    border.open();

    var point = general.addFolder('Point');
    point.add(settings, 'point').listen();
    point.add(settings, 'pointSize', 1, 5, 1).listen();
    point.addColor(settings, 'pointColor').listen();
    point.add(settings, 'pointOpacity', 0.1, 1, 0.1).listen();
    point.open();

    gui.domElement.id = 'gui';
    document.getElementById('app').appendChild(gui.domElement);
    general.open();

    function setupChangeHandler(obj, events) {
      var folders = obj.__folders;

      if (!folders) return;

      Object.keys(folders).forEach(function (name) {
        var folder = obj.__folders[name];

        folder.__controllers.forEach(function (controller) {
          controller.onChange(function (value) {
            events.onChange.apply(settings, [controller.property, value]);
          });

          controller.onFinishChange(function (value) {
            events.onFinishChange.apply(settings, [controller.property, value]);
          });
        });

        setupChangeHandler(folder, events);
      });
    }

    function controlChangeHandler(property, value) {
      var event = {
        type: 'change',
        property: property,
        value: value,
      };

      chrome.tabs.query({ active: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, event);
      });
    }

    function controlFinishChangeHandler() {
      chrome.storage.local.set({
        [storageKey]: JSON.stringify(settings),
      });
    }

    setupChangeHandler(gui, {
      onChange: controlChangeHandler,
      onFinishChange: controlFinishChangeHandler,
    });
  }
})();
