import { getDynamoDbConfig } from './config'

test('when region is localhost config is returned', async () => {
  process.env.REGION = 'localhost'
  expect(getDynamoDbConfig(process.env.REGION)).toEqual({
    endpoint: 'http://localhost:8000',
    httpOptions: { timeout: 5000 },
    region: 'localhost',
  })
})

test('when region is not localhost empty config is returned', async () => {
  process.env.REGION = undefined
  expect(getDynamoDbConfig(process.env.REGION as any)).toEqual({})
})
