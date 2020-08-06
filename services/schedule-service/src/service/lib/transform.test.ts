jest.mock('uuid/v4', () => () => 'schedule1')

import { schemas } from '@lighthouse/serverless-common'
import * as MockDate from 'mockdate'

import { scheduleDocument, schedulePayload } from '../../__fixtures__'

import {
  documentToSchedulePayload,
  payloadToScheduleDocument,
} from './transform'

beforeEach(() => MockDate.set('2019-10-13T01:00:00.000Z'))
afterEach(() => MockDate.reset())

test('transforms schedule document to payload', async () => {
  const document: schemas.ScheduleDocumentSchema = scheduleDocument
  const result: schemas.SchedulePayloadSchema = documentToSchedulePayload({
    document,
  })
  expect(result).toMatchSnapshot()
})

test('transforms new schedule payload to document', async () => {
  const applicationId = 'application1'
  const payload: schemas.SchedulePayloadSchema = schedulePayload
  const additional = {
    applicationId,
    userId: 'user1',
    included: {
      locations: {
        location1: {
          name: 'Location 1',
        },
      },
    },
  }

  const result: schemas.ScheduleDocumentSchema = payloadToScheduleDocument({
    payload,
    additional,
  })

  expect(result).toMatchSnapshot()
})

test('transforms existing schedule payload to document', async () => {
  const applicationId = 'application1'
  const payload: schemas.SchedulePayloadSchema = schedulePayload
  const createdAt = '2019-10-12T00:00:00.000Z'
  const createdBy = { id: 'user1', label: 'Unknown User', type: 'user' }
  const scheduleId = 'schedule2'

  const additional = {
    applicationId,
    createdAt,
    createdBy,
    id: scheduleId,
    included: {
      locations: {
        location1: {
          name: 'Location 1',
        },
      },
    },
    userId: 'user2',
  }

  const result: schemas.ScheduleDocumentSchema = payloadToScheduleDocument({
    payload,
    additional,
  })

  expect(result).toMatchSnapshot()
})
