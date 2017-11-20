/**
 * @module index
 * @license MIT
 * @version 2017/11/13
 */

'use strict';

const Stream = require('stream');
const Transform = Stream.Transform;

const undef = void 0;
const toString = Object.prototype.toString;

/**
 * @function isFunction
 * @param {any} value
 * @returns {boolean}
 */
function isFunction(value) {
  return toString.call(value) === '[object Function]';
}

/**
 * @function noop
 * @description A noop _transform function
 * @param {any} chunk
 * @param {string} encoding
 * @param {Function} next
 */
function noop(chunk, encoding, next) {
  next(null, chunk);
}

/**
 * @class DestroyableTransform
 */
class DestroyableTransform extends Transform {
  /**
   * @constructor
   * @param {Object} options
   */
  constructor(options) {
    super(options);

    this._destroyed = false;
  }

  destroy(error) {
    if (this._destroyed) return;

    this._destroyed = true;

    process.nextTick(() => {
      if (error) this.emit('error', error);

      this.emit('close');
    });
  }
}

/**
 * @function through
 * @description Create a new export function,
 *  used by both the main export,
 *  contains common logic for dealing with arguments
 * @param {Function} construct
 * @returns {Function}
 */
function through(construct) {
  return (options, transform, flush) => {
    if (isFunction(options)) {
      flush = transform;
      transform = options;
      options = {};
    }

    if (!isFunction(transform)) transform = noop;
    if (!isFunction(flush)) flush = null;

    return construct(options || {}, transform, flush);
  };
}

/**
 * @function through
 * @param {Object} options
 * @param {Function} transform
 * @param {Function} flush
 * @returns {Transform}
 */
module.exports = through((options, transform, flush) => {
  if (options.objectMode === undef) {
    options.objectMode = true;
  }

  if (options.highWaterMark === undef) {
    options.highWaterMark = 16;
  }

  const stream = new DestroyableTransform(options);

  stream._transform = transform;

  if (flush) stream._flush = flush;

  return stream;
});
