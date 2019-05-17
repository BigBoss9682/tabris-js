import {omit} from './util';
import {getCurrentLine} from './util-stacktrace';
import Listeners from './Listeners';
import {toValueString} from './Console';

const MARKUP = {
  br: {},
  b: {children: 'object'},
  span: {children: 'object'},
  big: {children: 'object'},
  i: {children: 'object'},
  small: {children: 'object'},
  strong: {children: 'object'},
  ins: {children: 'object'},
  del: {children: 'object'},
  a: {href: 'string', children: 'object'}
};

export function createJsxProcessor() {
  return new JsxProcessor();
}

export default class JsxProcessor {

  createElement(Type, attributes, ...children) {
    if (!(Type instanceof Function) && typeof Type !== 'string') {
      throw new Error(`JSX: Unsupported type ${toValueString(Type)}`);
    }
    if (attributes && attributes.children && children && children.length) {
      throw new Error(`JSX: Children for type ${Type.name} given twice.`);
    }
    // Children may be part of attributes or given as varargs or both.
    // For JSX factories/functional components they should always be part of attributes
    const finalChildren = (children && children.length ? children : null)
      || ((attributes && attributes.children && attributes.children.length) ? attributes.children : null);
    const finalAttributes = Object.assign({}, attributes || {});
    if (finalChildren && finalChildren.length) {
      finalAttributes.children = finalChildren;
    } else {
      delete finalAttributes.children;
    }
    if (typeof Type === 'string') {
      return this.createIntrinsicElement(Type, finalAttributes);
    }
    if (Type.prototype && Type.prototype[JSX.jsxFactory]) {
      return Type.prototype[JSX.jsxFactory].call(this, Type, finalAttributes);
    }
    try {
      const result = Type.call(this, finalAttributes);
      Type[JSX.jsxType] = true;
      if (result instanceof Object) {
        result[JSX.jsxType] = Type;
      }
      return result;
    } catch (ex) {
      throw new Error(`JSX: "${ex.message}" ${getCurrentLine(ex)}`);
    }
  }

  createIntrinsicElement(el, attributes) {
    if (el in MARKUP) {
      Object.keys(attributes || {}).forEach(attribute => {
        const attrType = typeof attributes[attribute];
        if (attrType !== MARKUP[el][attribute]) {
          if (attribute === 'children') {
            throw new Error(`Element ${el} can not have children`);
          } else {
            throw new Error(`Element ${el} does not a support attribute ${attribute} of type ${attrType}`);
          }
        }
      });
      const text = joinTextContent(attributes.children, true);
      const tagOpen = [el].concat(Object.keys(attributes || {}).filter(attr => attr !== 'children').map(
        attribute => `${attribute}='${attributes[attribute]}'`
      )).join(' ');
      if (text) {
        return `<${tagOpen}>${text}</${el}>`;
      }
      return `<${tagOpen}/>`;
    }
    throw new Error(`JSX: Unsupported type ${el}`);
  }

  createNativeObject(Type, attributes) {
    if (attributes && 'children' in attributes) {
      throw new Error(`JSX: ${Type.name} can not have children`);
    }
    const result = new Type(this.withoutListeners(attributes || {}));
    this.registerListeners(result, attributes);
    return result;
  }

  getChildren(attributes) {
    if (!attributes || !('children' in attributes)) {
      return null;
    }
    return normalizeChildren(attributes.children);
  }

  withoutChildren(attributes) {
    return omit(attributes, ['children']);
  }

  withoutListeners(attributes) {
    return omit(attributes, Object.keys(attributes).filter(this.isEventAttribute));
  }

  registerListeners(obj, attributes) {
    Listeners.getListenerStore(obj).on(this.getListeners(attributes));
  }

  withContentText(attributes, content, property, markupEnabled) {
    if (attributes && attributes[property] && content && content.length) {
      throw new Error(`JSX: ${property} given twice`);
    }
    const text = attributes && attributes[property]
      ? attributes[property].toString()
      : joinTextContent(content || [], markupEnabled);
    return Object.assign(attributes || {}, text ? {[property]: text} : {});
  }

  withContentChildren(attributes, content, property) {
    if (attributes && attributes[property] && content && content.length) {
      throw new Error(`JSX: ${property} given twice`);
    }
    const children = attributes && attributes[property] ? attributes[property] : (content || []);
    return Object.assign(attributes || {}, children ? {[property]: children} : {});
  }

  /**
   * @param {object} attributes
   * @param {{[attr: string]: string}} shorthandsMapping
   * @param {((value1: any, value2: string) => any)} merge
   * @returns {object}
   */
  withShorthands(attributes, shorthandsMapping, merge) {
    const shorthandsKeys = Object.keys(shorthandsMapping);
    const shorthands = shorthandsKeys.filter(value => value in attributes);
    if (!shorthands.length) {
      return attributes;
    }
    const attrCopy = omit(attributes, shorthandsKeys);
    shorthands.forEach(shorthand => {
      const prop = shorthandsMapping[shorthand];
      if (prop in attrCopy) {
        attrCopy[prop] = merge(attrCopy[prop], shorthand);
      } else {
        attrCopy[prop] = shorthand;
      }
    });
    return attrCopy;
  }

  getListeners(attributes) {
    const listeners = {};
    for (const attribute in attributes) {
      if (this.isEventAttribute(attribute)) {
        const event = attribute[2].toLocaleLowerCase() + attribute.slice(3);
        listeners[event] = attributes[attribute];
      }
    }
    return listeners;
  }

  isEventAttribute(attribute) {
    return attribute.startsWith('on') && attribute.charCodeAt(2) <= 90;
  }

}

/**
 * Converts any value to a flat array.
 */
export function normalizeChildren(children) {
  if (children instanceof Array) {
    let result = [];
    for (const child of children) {
      if (child && child.toArray) {
        result = result.concat(normalizeChildren(child.toArray()));
      } else if (child instanceof Array) {
        result = result.concat(normalizeChildren(child));
      } else {
        result.push(child);
      }
    }
    return result;
  }
  return [children];
}

/**
 * @param {string[]} textArray
 * @param {boolean} markupEnabled
 */
export function joinTextContent(textArray, markupEnabled) {
  if (!textArray) {
    return null;
  }
  if (markupEnabled) {
    return textArray
      .map(str => str + '')
      .join('')
      .replace(/\s+/g, ' ')
      .replace(/\s*<br\s*\/>\s*/g, '<br/>');
  }
  return textArray.map(str => str.replace(/\\n/g, '\n')).join('\n');
}

export const JSX = {

  /** @type {unique Symbol} */
  jsxFactory: Symbol('jsxFactory'),

  /** @type {unique Symbol} */
  jsxType: Symbol('jsxType'),

  /** @param {JsxProcessor} jsxProcessor */
  install(jsxProcessor) {
    this.processor = jsxProcessor;
  },

  createElement() {
    return this.processor.createElement.apply(this.processor, arguments);
  }

};
