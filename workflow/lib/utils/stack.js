'use strict'

module.exports = function(){
  // var orig = Error.prepareStackTrace;
  // Error.prepareStackTrace = function(_, stack){ return stack; };
  // var err = new Error;
  // Error.captureStackTrace(err, arguments.callee);
  // var stack = err.stack;
  // Error.prepareStackTrace = orig;
  // return stack;

  // Save original Error.prepareStackTrace
  var origPrepareStackTrace = Error.prepareStackTrace

  // Override with function that just returns `stack`
  Error.prepareStackTrace = function (_, stack) {
    return stack
  }

  // Create a new `Error`, which automatically gets `stack`
  var err = new Error()

  // Evaluate `err.stack`, which calls our new `Error.prepareStackTrace`
  var stack = err.stack

  // Restore original `Error.prepareStackTrace`
  Error.prepareStackTrace = origPrepareStackTrace

  // Remove superfluous function call on stack
  stack.shift() // getStack --> Error

  return stack
};