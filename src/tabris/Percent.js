import {checkNumber} from './util';
import {toValueString} from './Console';

export default class Percent {

  static isValidPercentValue(value) {
    try {
      Percent.from(value);
      return true;
    } catch(ex) {
      return false;
    }
  }

  static from(value) {
    if (value instanceof Percent) {
      return value;
    }
    if (value instanceof Object) {
      return percentLikeObjectToPercentInstance(value);
    }
    if (typeof value === 'string') {
      checkPercentString(value);
      return new Percent(percentNumberFromString(value));
    }
    throw new Error(`${toValueString(value)} is not a valid PercentValue`);
  }

  constructor(percent) {
    if (arguments.length < 1) {
      throw new Error('Not enough arguments');
    }
    checkNumber(percent, [-Infinity, Infinity], 'Invalid Percent');
    Object.defineProperty(this, 'percent', {enumerable:true, value: percent});
  }

  toString() {
    return `${this.percent}%`;
  }

  valueOf() {
    return this.percent;
  }
}

function percentLikeObjectToPercentInstance(value) {
  checkProperty(value, 'percent');
  return new Percent(value.percent);
}

function checkPercentString(value) {
  if (!/%$/.test(value) || isNaN(percentNumberFromString(value))) {
    throw new Error('Invalid percent string ' + value + ': It must be a number followed by "%".');
  }
  checkNumber(percentNumberFromString(value), [-Infinity, Infinity], `Invalid percent string ${value}`);
}

function percentNumberFromString(value) {
  return parseInt(value.replace(/%$/, ''));
}

function checkProperty(object, prop) {
  if (!(prop in object)) {
    throw new Error(`Percent-like object missing ${prop} value`);
  }
}
