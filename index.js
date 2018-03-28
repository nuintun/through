/**
 * @module index
 * @license MIT
 * @version 2017/11/13
 */

'use strict';

const { Transform } = require('stream');

/**
 * @function isFunction
 * @param {any} value
 * @returns {boolean}
 */
function isFunction(value) {
  return typeof value === 'function';
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

// Is destroyable Transform
const destroyable = isFunction(Transform.prototype.destroy);
const DestroyableTransform = destroyable
  ? Transform
  : class extends Transform {
      /**
       * @constructor
       * @param {Object} options
       */
      constructor(options) {
        super(options);

        this._destroyed = false;
      }

      /**
       * @private
       * @method _destroy
       * @param {any} error
       * @param {Function} callback
       */
      _destroy(error, callback) {
        if (this._destroyed) return;

        this._destroyed = true;

        process.nextTick(() => {
          if (error) {
            if (callback) {
              callback();
            } else {
              this.emit('error', error);
            }
          }

          this.emit('close');
        });
      }

      /**
       * @function destroy
       * @param {any} error
       * @param {Function} callback
       */
      destroy(error, callback) {
        this._destroy(error, callback);
      }
    };

/**
 * @function through
 * @param {Object} options
 * @param {Function} transform
 * @param {Function} flush
 * @returns {Transform}
 */
module.exports = function through(options, transform, flush, destroy) {
  if (isFunction(options)) {
    flush = transform;
    transform = options;
    options = {};
  } else if (!isFunction(transform)) {
    transform = noop;
  }

  if (!isFunction(flush)) flush = null;
  if (!isFunction(destroy)) destroy = null;

  options = options || {};

  if (options.objectMode === undefined) options.objectMode = true;
  if (options.highWaterMark === undefined) options.highWaterMark = 16;

  const stream = new DestroyableTransform(options);

  stream._transform = transform;

  if (flush) stream._flush = flush;
  if (destroy) stream._destroy = destroy;

  return stream;
};
