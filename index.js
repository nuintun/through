'use strict';

var is = require('is');
var extend = require('@nuintun/extend');
var Stream = require('readable-stream');
var Transform = Stream.Transform;
var inherits = require('util').inherits;

/**
 * DestroyableTransform
 *
 * @param options
 * @constructor
 */
function DestroyableTransform(options) {
  Transform.call(this, options);

  // Destroyed flag
  this._destroyed = false;
}

// Inherits
inherits(DestroyableTransform, Transform);

/**
 * destroy
 *
 * @param error
 */
DestroyableTransform.prototype.destroy = function(error) {
  if (this._destroyed) return;

  this._destroyed = true;

  var self = this;

  process.nextTick(function() {
    if (error) self.emit('error', error);

    self.emit('close');
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
 * Create a new export function, used by both the main export and
 * the .ctor export, contains common logic for dealing with arguments
 *
 * @param construct
 * @returns {Function}
 */
function through(construct) {
  return function(options, transform, flush) {
    if (is.fn(options)) {
      flush = transform;
      transform = options;
      options = {};
    }

    if (!is.fn(transform)) transform = noop;
    if (!is.fn(flush)) flush = null;

    return construct(options, transform, flush);
  }
}

/**
 * Exports module
 */
module.exports = through(function(options, transform, flush) {
  var stream = new DestroyableTransform(extend({ objectMode: true, highWaterMark: 16 }, options));

  stream._transform = transform;

  if (flush) stream._flush = flush;

  return stream;
});
