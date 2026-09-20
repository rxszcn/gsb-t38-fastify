'use strict'
const Fastify = require('../fastify.js')

const f = Fastify()
const shared = { type: 'object', properties: { a: { type: 'string' } }, additionalProperties: false }

f.post('/t', {
  schema: {
    body: { content: { 'application/json': { schema: shared } } },
    querystring: shared,
    response: { '3xx': { type: 'object', properties: { x: { type: 'string' } } } }
  }
}, (req, reply) => {
  const out = {}
  // 1. docs example for compileSerializationSchema, verbatim shape
  const docsSchema = { '3xx': { content: { 'application/json': { schema: { name: { type: 'string' }, phone: { type: 'number' } } } } } }
  try { out.docsExample = reply.compileSerializationSchema(docsSchema, '3xx', 'application/json')({ name: 'Jone', phone: 201090909090 }) } catch (e) { out.docsExample = 'THROW ' + e.message }
  // 2. request-side analogue of the serializer cache collision
  const vBody = req.compileValidationSchema(shared, 'body')
  const vQuery = req.compileValidationSchema(shared, 'querystring')
  out.sameValidatorForDifferentPart = vBody === vQuery
  // 3. what the public lookup returns for a content-based body schema
  out.getValidationFunction_body = typeof req.getValidationFunction('body')
  out.getValidationFunction_querystring = typeof req.getValidationFunction('querystring')
  reply.type('text/plain').send(JSON.stringify(out, null, 1))
})

f.inject({ url: '/t?a=1', method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"a":"x"}' }).then(async (r) => {
  console.log(r.body)
  await f.close()
}).catch((e) => { console.error('FAIL', e.message); process.exit(1) })
