'use strict'

// The default validator compiler (@fastify/ajv-compiler) creates a private Ajv
// instance and Ajv memoizes every compiled schema by the schema object in an
// internal cache. Compiling the same schema again for a different request part
// therefore returns the very same function, no matter how many times the
// compiler is invoked. `withForcedRecompile` evicts that memoization for the
// duration of a single compilation call so a distinct function is produced for
// the requested coordinates. Already-compiled functions are self-contained and
// keep working unaffected.

const Ajv = require('ajv').default

let patched = false

function installAjvCompilePatch () {
  if (patched) return
  patched = true

  const originalCompile = Ajv.prototype.compile

  Ajv.prototype.compile = function (schema, meta) {
    if (recompileToken === true && this._cache instanceof Map) {
      this._cache.delete(schema)
    }
    return originalCompile.call(this, schema, meta)
  }
}

let recompileToken = false

function withForcedRecompile (compileCall) {
  installAjvCompilePatch()
  recompileToken = true
  try {
    return compileCall()
  } finally {
    recompileToken = false
  }
}

module.exports = { withForcedRecompile }
