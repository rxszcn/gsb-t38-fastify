'use strict'
const Fastify = require('../fastify.js')

const shared = { type: 'object', properties: { keep: { type: 'string' } }, additionalProperties: false }
const seen = []

const f = Fastify()
f.get('/t', {
  serializerCompiler: ({ schema, httpStatus, contentType }) => {
    seen.push(`${httpStatus ?? '-'}|${contentType ?? '-'}`)
    const marker = seen.length
    return (input) => JSON.stringify({ fn: marker, input })
  }
}, (req, reply) => {
  const out = {}
  const fnA = reply.compileSerializationSchema(shared, '2xx', 'application/json')
  const fnB = reply.compileSerializationSchema(shared, '2xx', 'application/vnd.v1+json')
  const fnC = reply.compileSerializationSchema(shared, '4xx')
  out.sameFnForDifferentContentType = fnA === fnB
  out.sameFnForDifferentStatus = fnA === fnC
  out.lookups = [String(reply.getSerializationFunction('2xx', 'application/json'))].map(s => s.slice(0, 20))
  out.compilerCalls = seen.slice()
  try { out.serializeInput = reply.serializeInput({ keep: 'k', drop: 'x' }, '2xx', 'application/vnd.v1+json') } catch (e) { out.serializeInput = 'THROW ' + e.message }
  out.compiledA = fnA({ keep: 'k', drop: 'x' })
  out.compiledB = fnB({ keep: 'k', drop: 'x' })
  reply.type('text/plain').send(JSON.stringify(out, null, 1))
})

f.inject({ url: '/t' }).then(async (r) => {
  console.log(r.body)
  await f.close()
}).catch((e) => { console.error('FAIL', e.message); process.exit(1) })
