import NativeObject from '../NativeObject';
import Widget from '../Widget';

export default class Switch extends Widget {

  get _nativeType() {
    return 'tabris.Switch';
  }

  _getXMLAttributes() {
    return super._getXMLAttributes().concat([
      ['text', this.text],
      ['checked', this.checked]
    ]);
  }

}

NativeObject.defineProperties(Switch.prototype, {
  checked: {type: 'boolean', nocache: true},
  thumbOnColor: {type: 'ColorValue', default: 'initial'},
  thumbOffColor: {type: 'ColorValue', default: 'initial'},
  trackOnColor: {type: 'ColorValue', default: 'initial'},
  trackOffColor: {type: 'ColorValue', default: 'initial'}
});

NativeObject.defineEvents(Switch.prototype, {
  select: {native: true, changes: 'checked'},
});
