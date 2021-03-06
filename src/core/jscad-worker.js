// jscad-worker.js
//
// == OpenJSCAD.org, Copyright (c) 2013-2016, Licensed under MIT License

const { CAG, CSG } = require('@jscad/csg')
const oscad = require('@jscad/scad-api')

const createJscadFunction = require('./jscad-function')
const { toArray } = require('../utils/misc')

/**
 * Create an worker (thread) for processing the JSCAD script into CSG/CAG objects
 */
module.exports = function (self) {
  self.onmessage = function (e) {
    var r = {cmd: 'error', txt: 'try again'}
    if (e.data instanceof Object) {
      var data = e.data
      if (data.cmd === 'render') {
        const {source, parameters, options} = e.data
        const include = x => x
        const globals = options.implicitGlobals ? { oscad } : {}
        const func = createJscadFunction(source, globals)

        let objects = func(parameters, include, globals)
        objects = toArray(objects)
          .map(function (object) {
            if (object instanceof CAG || object instanceof CSG) {
              return object.toCompactBinary()
            }
          })

        if (objects.length === 0) {
          throw new Error('The JSCAD script must return one or more CSG or CAG solids.')
        }
        self.postMessage({cmd: 'rendered', objects})
      }
    }
  }
}
