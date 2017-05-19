/*!
 * through
 * Version: 0.0.1
 * Date: 2017/05/19
 * https://github.com/nuintun/through
 * https://github.com/rvagg/through2
 *
 * This is licensed under the MIT License (MIT).
 * For details, see: https://github.com/nuintun/through/blob/master/LICENSE
 */

'use strict';

var Stream = require('readable-stream');
var Transform = Stream.Transform;

var undef = void(0);
var toString = Object.prototype.toString;

/**
 * Is function
 *
 * @param {any} value
 * @returns {Boolean}
 */
function isFunction(value) {
  return toString.call(value) === '[object Function]';
}

/**
 * DestroyableTransform
 *
 * @param options
 * @constructor
 */
function DestroyableTransform(options) {
  var context = this;

  Transform.call(context, options);

  // Destroyed flag
  context._destroyed = false;
}

// extend
DestroyableTransform.prototype = Object.create(Transform.prototype, { constructor: { value: DestroyableTransform } });

/**
 * destroy
 *
 * @param error
 */
DestroyableTransform.prototype.destroy = function(error) {
  var context = this;

  if (context._destroyed) return;

  context._destroyed = true;

  process.nextTick(function() {
    if (error) context.emit('error', error);

    context.emit('close');
  })
};

/**
 * A noop _transform function
 *
 * @param chunk
 * @param encoding
 * @param next
 */
function noop(chunk, encoding, next) {
  next(null, chunk);
}

/**
 * Create a new export function, used by both the main export,
 * contains common logic for dealing with arguments
 *
 * @param construct
 * @returns {Function}
 */
function through(construct) {
  return function(options, transform, flush) {
    if (isFunction(options)) {
      flush = transform;
      transform = options;
      options = {};
    }

    if (!isFunction(transform)) transform = noop;
    if (!isFunction(flush)) flush = null;

    return construct(options || {}, transform, flush);
  }
}

/**
 * Exports module
 */
module.exports = through(function(options, transform, flush) {
  if (options.objectMode === undef) {
    options.objectMode = true;
  }

  if (options.highWaterMark === undef) {
    options.highWaterMark = 16;
  }

  var stream = new DestroyableTransform(options);

  stream._transform = transform;

  if (flush) stream._flush = flush;

  return stream;
});
