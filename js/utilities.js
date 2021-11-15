/**
 *  @fileoverview   Small helper functions, useful in a variety of places
 */


/**
 *  @param {Function} fns  - A list of functions to turn into a pipe.
 *
 *  @returns {Function} A single function that pipes its arguments through each
 *      function in `fns` (in order).
 */
export const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x)


//  README for `throttle-debounce`:
//
//  https://github.com/niksy/throttle-debounce#readme
//
export { throttle, debounce } from './throttle-debounce/index.js'
