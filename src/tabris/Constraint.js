import * as WidgetExports from '../../src/tabris/Widget'; // work around circular dependency
import Percent from './Percent';
import {checkNumber} from './util';
import {toValueString} from './Console';

const selectorRegex = /^(\*|([#.A-Z][A-Za-z0-9_-]+))$/;
const numberRegex = /^[+-]?([0-9]+|[0-9]*\.[0-9]+)$/;
const zeroPercent = new Percent(0);

export default class Constraint {

  static from(constraintValue) {
    if (constraintValue === true) {
      return zero;
    }
    if (typeof constraintValue === 'string') {
      const str = constraintValue.trim();
      if (str.indexOf(' ') !== -1) {
        return fromArray(str.split(/\s+/));
      }
      if (numberRegex.test(str)) {
        return new Constraint(zeroPercent, parseFloat(str));
      }
      return new Constraint(normalizeReference(str), 0);
    }
    if (Array.isArray(constraintValue)) {
      return fromArray(constraintValue);
    }
    if (typeof constraintValue === 'number') {
      if (constraintValue === 0) {
        return zero;
      }
      return new Constraint(zeroPercent, normalizeNumber(constraintValue));
    }
    if (constraintValue instanceof WidgetExports.default
      || typeof constraintValue === 'symbol'
      || Percent.isValidPercentValue(constraintValue)
    ) {
      return new Constraint(normalizeReference(constraintValue), 0);
    }
    if ('reference' in constraintValue || 'offset' in constraintValue) {
      return fromArray([constraintValue.reference || zeroPercent, constraintValue.offset || 0]);
    }
    throw new Error(`Invalid constraint ${toValueString(constraintValue)}`);
  }

  constructor(reference, offset) {
    if (typeof reference === 'string' && !selectorRegex.test(reference)) {
      throw new Error(`Invalid sibling selector ${toValueString(reference)}`);
    }
    if (!(reference instanceof Percent)) {
      checkIsValidSiblingReference(reference);
    }
    checkNumber(offset);
    Object.defineProperty(this, 'reference', {enumerable: true, value: reference});
    Object.defineProperty(this, 'offset', {enumerable: true, value: offset});
  }

  toString() {
    return `${referenceToString(this.reference)} ${this.offset}`;
  }

  toArray() {
    return [this.reference, this.offset];
  }

}

Constraint.next = Symbol('next()');
Constraint.prev = Symbol('prev()');

export function checkIsValidSiblingReference(reference) {
  if (typeof reference === 'string' && !selectorRegex.test(reference)) {
    throw new Error(`Invalid sibling selector ${toValueString(reference)}`);
  }
  if (
    typeof reference !== 'string'
    && !(reference instanceof WidgetExports.default)
    && reference !== Constraint.next
    && reference !== Constraint.prev
  ) {
    throw new Error(`Invalid constraint reference ${toValueString(reference)}`);
  }
}

export function referenceToString(reference) {
  if (reference instanceof Percent) {
    return reference + '%';
  }
  if (reference instanceof WidgetExports.default) {
    return `${reference.constructor.name}[cid="${reference.cid}"]`;
  }
  if (reference === Constraint.next) {
    return 'next()';
  }
  if (reference === Constraint.prev) {
    return 'prev()';
  }
  return reference;
}

export function normalizeReference(reference, shorthand) {
  if (reference === true && shorthand !== undefined) {
    return shorthand;
  }
  if (Percent.isValidPercentValue(reference)) {
    return Percent.from(reference);
  }
  if (reference instanceof WidgetExports.default || reference === Constraint.next || reference === Constraint.prev) {
    return reference;
  }
  if (typeof reference === 'string') {
    const str = reference.trim();
    if (str === 'prev()') {
      return Constraint.prev;
    }
    if (str === 'next()') {
      return Constraint.next;
    }
    if (selectorRegex.test(str)) {
      return str;
    }
  }
  throw new Error(`${toValueString(reference)} is not a percentage or widget reference`);
}

export function normalizeNumber(value, shorthand) {
  if (value === true && shorthand !== undefined) {
    return shorthand;
  }
  if (typeof value === 'string' && numberRegex.test(value)) {
    return parseFloat(value);
  }
  return value;
}

const zero = new Constraint(new Percent(0), 0);
export {zero};

function fromArray(array) {
  if (array.length !== 2) {
    throw new Error(`Constraint array requires exactly 2 elements but has ${array.length}`);
  }
  return new Constraint(normalizeReference(array[0]), normalizeNumber(array[1]));
}
