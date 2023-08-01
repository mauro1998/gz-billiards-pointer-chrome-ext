import * as dat from 'dat.gui';

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

  const gui = new dat.GUI({
    closed: false,
    hideable: false,
    closeOnTop: true,
    autoPlace: false,
  });

  const general = gui.addFolder('General');
  general.add(settings, 'cursor').listen();
  general.add(settings, 'diameter', 40, 60, 0.25).listen();
  general.add(settings, 'bandSize', 50, 100, 1).listen();

  const shadow = general.addFolder('Shadow');
  shadow.add(settings, 'shadow').listen();
  shadow.addColor(settings, 'shadowColor').listen();
  shadow.add(settings, 'shadowOpacity', 0.1, 0.75, 0.01).listen();
  shadow.open();

  const border = general.addFolder('Border');
  border.add(settings, 'border').listen();
  border.add(settings, 'borderWidth', 1, 5, 1).listen();
  border.addColor(settings, 'borderColor').listen();
  border.add(settings, 'borderOpacity', 0.1, 1, 0.1).listen();
  border.open();

  const point = general.addFolder('Point');
  point.add(settings, 'point').listen();
  point.add(settings, 'pointSize', 1, 5, 1).listen();
  point.addColor(settings, 'pointColor').listen();
  point.add(settings, 'pointOpacity', 0.1, 1, 0.1).listen();
  point.open();

  gui.domElement.id = 'gui';
  document.getElementById('app').appendChild(gui.domElement);
  general.open();

  function setupChangeHandler(obj, events) {
    const folders = obj.__folders;

    if (!folders) return;

    Object.keys(folders).forEach((name) => {
      const folder = obj.__folders[name];

      folder.__controllers.forEach((controller) => {
        controller.onChange(function (value) {
          events.onChange.apply(settings, [controller.property, value]);
        });

        controller.onFinishChange((value) => {
          events.onFinishChange.apply(settings, [controller.property, value]);
        });
      });

      setupChangeHandler(folder, events);
    });
  }

  function controlChangeHandler(property, value) {
    const event = {
      type: 'change',
      property: property,
      value: value,
    };

    chrome.tabs.query({ active: true }, (tabs) => {
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
