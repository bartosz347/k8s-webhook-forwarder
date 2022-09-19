import anyTest, { TestFn } from 'ava'
import nock from 'nock'
import request from 'supertest'
import { Server } from 'http'
import app from '../src/api/init-server'
import config from '../src/config'

const test = anyTest as TestFn<{server: Server}>

test.before(async t => {
  process.env.WEBHOOK_DESTINATION_ENDPOINT = 'api/webhook'
  process.env.CLIENT_DISCOVERY_MODE = 'STATIC'
  process.env.STATIC_CLIENT = 'http://localhost:4000'
  process.env.HEADERS_TO_FORWARD = 'stripe-signature,content-type'
  process.env.TARGET_NAME = 'na'
  config.init()

  t.context.server = app.listen()
})

test.after.always(t => {
  t.context.server.close()
})

test('receive and forward webhook', async t => {
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
