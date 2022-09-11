import anyTest, { TestFn } from 'ava'
import nock from 'nock'
import request from 'supertest'
import { Server } from 'http'
import app from '../src/api/init-server'

const test = anyTest as TestFn<{server: Server}>

test.before(async t => {
  t.context.server = app.listen()
})

test.after.always(t => {
  t.context.server.close()
})

test('receive and forward webhook', async t => {
  process.env.STATIC_CLIENTS_MODE = 'true'
  process.env.STATIC_CLIENT = 'http://localhost:4000/api/webhook'
  process.env.HEADERS_TO_FORWARD = 'stripe-signature,content-type'

  const scope = nock('http://localhost:4000', {
    reqheaders: {
      'stripe-signature': 'signature'
    }
  })
    .post('/api/webhook', {
      key: 'value'
    })
    .reply(200)

  await request(t.context.server).post('/webhook-listener')
    .set('stripe-signature', 'signature')
    .send({ key: 'value' })
    .expect(200)

  t.true(scope.isDone(), 'Nock assertion failed.')
})
