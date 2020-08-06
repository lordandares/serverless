import {
  AWS_SECRET_ID,
  setupPlatformMocks,
  teardownPlatformMocks,
} from '../../../test/shared'
process.env.PLATFORM = 'AWS'
import { createClient, MONGO_URI_KEY } from './index'

import { getSecret } from '../../secrets'
import * as getSecretModule from '../../secrets'

beforeEach(setupPlatformMocks)
afterEach(teardownPlatformMocks)

it('should error if PLATFORM environment var is not defined', async () => {
  process.env.PLATFORM = ''

  try {
    await createClient(AWS_SECRET_ID)
  } catch (err) {
    expect(err).toMatchInlineSnapshot(`[Error: Incorrect Platform: PLATFORM]`)
  }
})

it('should error if PLATFORM environment is not AZURE or AWS', async () => {
  process.env.PLATFORM = 'OTHER'

  try {
    await createClient(AWS_SECRET_ID)
  } catch (err) {
    expect(err).toMatchInlineSnapshot(`[Error: Incorrect Platform: PLATFORM]`)
  }
})

it('should error if secretId is not defined', async () => {
  expect.assertions(1)

  const secretId = ''

  try {
    await createClient(secretId)
  } catch (err) {
    expect(err).toMatchInlineSnapshot(
      `[Error: Missing required param: secretId]`,
    )
  }
})

it('should pass if both AWS_REGION and secretId is defined', async () => {
  expect.assertions(1)
  process.env.PLATFORM = 'AWS'
  // NOTE env vars are setup in shared helper
  const db = await createClient(AWS_SECRET_ID)
  expect(db).toBeDefined()
})

describe('AWS', () => {
  it('should error if AWS_REGION environment var is not defined', async () => {
    process.env.PLATFORM = 'AWS'
    process.env.AWS_REGION = ''

    try {
      await createClient(AWS_SECRET_ID)
    } catch (err) {
      expect(err).toMatchInlineSnapshot(
        `[Error: Missing required environment variable: AWS_REGION]`,
      )
    }
  })
})
