import NativeObject from './NativeObject';
import Camera from './Camera';

export default class Device extends NativeObject {

  get _nativeType() {
    return 'tabris.Device';
  }

  /** @override */
  _nativeCreate(param) {
    if (param !== true) {
      throw new Error('Device can not be created');
    }
    super._nativeCreate();
  }

  _listen(name, listening) {
    if (name === 'orientationChanged') {
      this._nativeListen(name, listening);
    } else {
      super._listen(name, listening);
    }
  }

  _trigger(name, event) {
    if (name === 'orientationChanged') {
      this._triggerChangeEvent('orientation', event.orientation);
    } else {
      super._trigger(name, event);
    }
  }

  dispose() {
    throw new Error('Cannot dispose device object');
  }

}

NativeObject.defineProperties(Device.prototype, {
  model: {readonly: true, get: getOnce, const: true},
  vendor: {readonly: true, get: getOnce, const: true},
  platform: {readonly: true, get: getOnce, const: true},
  version: {readonly: true, get: getOnce, const: true},
  name: {readonly: true, const: true},
  language: {readonly: true, const: true},
  orientation: {readonly: true},
  screenWidth: {readonly: true, const: true},
  screenHeight: {readonly: true, const: true},
  scaleFactor: {readonly: true, get: getOnce, const: true},
  cameras: {readonly: true, get: getCameras, const: true}
});

export function create() {
  return new Device(true);
}

export function publishDeviceProperties(device, target) {
  target.devicePixelRatio = device.scaleFactor;
  target.device = createDevice(device);
  target.screen = createScreen(device);
  target.navigator = createNavigator(device);
}

function createDevice(device) {
  const dev = {};
  ['model', 'vendor', 'platform', 'version', 'name'].forEach((name) => {
    defineReadOnlyProperty(dev, name, () => device[name]);
  });
  return dev;
}

function createScreen(device) {
  const screen = {};
  defineReadOnlyProperty(screen, 'width', () => device.screenWidth);
  defineReadOnlyProperty(screen, 'height', () => device.screenHeight);
  return screen;
}

function createNavigator(device) {
  const navigator = {};
  defineReadOnlyProperty(navigator, 'userAgent', () => 'tabris-js');
  defineReadOnlyProperty(navigator, 'language', () => device.language);
  return navigator;
}

function defineReadOnlyProperty(target, name, getter) {
  Object.defineProperty(target, name, {
    get: getter,
    set() {}
  });
}

function getOnce(name) {
  let value = this._getStoredProperty(name);
  if (!value) {
    value = this._nativeGet(name);
    this._storeProperty(name, value);
  }
  return value;
}

function getCameras(name) {
  let cameras = this._getStoredProperty(name);
  if (!cameras) {
    const cameraIds = this._nativeGet(name);
    if (!(cameraIds instanceof Array)) {
      throw new Error('Cameras property is not an array of camera ids but ' + JSON.stringify(cameraIds));
    }
    cameras = cameraIds.map((cameraId) => new Camera({cameraId}));
    this._storeProperty(name, cameras);
  }
  return cameras;
}
