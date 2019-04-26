
export default class NativeBridge {

  constructor(bridge) {
    this.$bridge = bridge;
    this.$operations = [];
    this.$currentOperation = {id: null};
    this.$propertyCache = {};
  }

  create(id, type) {
    const properties = {};
    this.$operations.push(['create', id, type, properties]);
    this.$currentOperation = {id, properties};
  }

  set(id, name, value) {
    if (this.$currentOperation.id === id) {
      this.$currentOperation.properties[name] = value;
    } else {
      const properties = {};
      properties[name] = value;
      this.$operations.push(['set', id, properties]);
      this.$currentOperation = {id, properties};
    }
    this.cacheValue(id, name, value);
  }

  listen(id, event, listen) {
    this.$operations.push(['listen', id, event, listen]);
    this.$currentOperation = {id: null};
  }

  destroy(id) {
    this.$operations.push(['destroy', id]);
    this.$currentOperation = {id: null};
  }

  get(id, name) {
    if (this.$propertyCache[id] && name in this.$propertyCache[id]) {
      return this.$propertyCache[id][name];
    }
    this.flush();
    const result = this.$bridge.get(id, name);
    this.cacheValue(id, name, result);
    return result;
  }

  call(id, method, parameters) {
    this.flush();
    return this.$bridge.call(id, method, parameters);
  }

  flush() {
    tabris.trigger('layout');
    const operations = this.$operations;
    this.$operations = [];
    this.$currentOperation = {id: null};
    const length = operations.length;
    // Using apply() on the native bridge does not work with Rhino. It seems that the parameter
    // count must be known in order to find the associated native method.
    for (let i = 0; i < length; i++) {
      const op = operations[i];
      switch (op[0]) {
        case 'create':
          this.$bridge.create(op[1], op[2], op[3]);
          break;
        case 'set':
          this.$bridge.set(op[1], op[2]);
          break;
        case 'listen':
          this.$bridge.listen(op[1], op[2], op[3]);
          break;
        case 'destroy':
          this.$bridge.destroy(op[1]);
      }
    }
  }

  clearCache() {
    this.$propertyCache = {};
  }

  cacheValue(id, property, value) {
    if (!this.$propertyCache[id]) {
      this.$propertyCache[id] = {};
    }
    this.$propertyCache[id][property] = value;
  }

}
