import { errors, mongo, schemas } from '@lighthouse/serverless-common'
import * as AWS from 'aws-sdk-mock'
import { omit } from 'lodash/fp'
import { createSnsEvent } from '../../../../__test__/helpers'
import { occurrenceDocument } from '../__fixtures__'
import { createExceptionHandler } from './createExceptionHandler'

describe('happy path', () => {
  beforeEach(() => {
    process.env.LOOP_EXCEPTIONS_QUEUE_URL =
      'https://us-east-1.amazonaws.com/123456789012/ExceptionQueue'
  })

  test('publishes sqs message', async () => {
    expect.assertions(3)

    mongo.getCollection = jest.fn().mockResolvedValue({
      findOne: jest.fn().mockResolvedValue({
        _id: '5d163137b8b3b7000127edd1',
        center: {
          type: 'Point',
          coordinates: [90, -90],
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [140.625, -28.92163128242129],
              [142.03125, -28.92163128242129],
              [142.03125, -27.371767300523032],
              [140.625, -27.371767300523032],
              [140.625, -28.92163128242129],
            ],
          ],
        },
      }),
    })

    const sendMessageSpy = jest.fn().mockResolvedValue('success')

    AWS.mock('SQS', 'sendMessage', sendMessageSpy)

    const occurrence: schemas.ScheduleOccurrenceDocumentSchema = occurrenceDocument
    const event = createSnsEvent({ body: occurrence })

    const result = await createExceptionHandler(event)
    expect(result).toBe('success')
    expect(sendMessageSpy).toHaveBeenCalledWith(
      {
        MessageBody: expect.any(String),
        QueueUrl: 'https://us-east-1.amazonaws.com/123456789012/ExceptionQueue',
      },
      expect.any(Function),
    )

    const body = sendMessageSpy.mock.calls[0][0].MessageBody

    expect(JSON.parse(body)).toEqual({
      application: 'application1',
      geometry: {
        coordinates: [90, -90],
        type: 'Point',
      },
      schedule: {
        id: 'schedule1',
        area: '5d163137b8b3b7000127edd1',
        name: 'Schedule 1',
        type: 'visit',
        data: {
          occurrenceId: 'occurrence1',
          occurrenceEndAt: '2019-02-01T23:59:59.999Z',
          occurrenceStartAt: '2019-02-01T00:00:00.000Z',
          timezone: 'Australia/Melbourne',
        },
      },
      start: '2019-02-01T23:59:59.999Z',
    })

    AWS.restore()
  })

  test('falls back to geometry center point if center not available', async () => {
    expect.assertions(3)

    mongo.getCollection = jest.fn().mockResolvedValue({
      findOne: jest.fn().mockResolvedValue({
        _id: '5d163137b8b3b7000127edd1',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [140.625, -28.92163128242129],
              [142.03125, -28.92163128242129],
              [142.03125, -27.371767300523032],
              [140.625, -27.371767300523032],
              [140.625, -28.92163128242129],
            ],
          ],
        },
      }),
    })

    const sendMessageSpy = jest.fn().mockResolvedValue('success')

    AWS.mock('SQS', 'sendMessage', sendMessageSpy)

    const occurrence: schemas.ScheduleOccurrenceDocumentSchema = occurrenceDocument
    const event = createSnsEvent({ body: occurrence })

    const result = await createExceptionHandler(event)
    expect(result).toBe('success')
    expect(sendMessageSpy).toHaveBeenCalledWith(
      {
        MessageBody: expect.any(String),
        QueueUrl: 'https://us-east-1.amazonaws.com/123456789012/ExceptionQueue',
      },
      expect.any(Function),
    )

    const body = sendMessageSpy.mock.calls[0][0].MessageBody

    expect(JSON.parse(body)).toEqual({
      application: 'application1',
      geometry: {
        // turf point-on-feature geometry
        coordinates: [141.328125, -28.14669929147216],
        type: 'Point',
      },
      schedule: {
        id: 'schedule1',
        area: '5d163137b8b3b7000127edd1',
        name: 'Schedule 1',
        type: 'visit',
        data: {
          occurrenceId: 'occurrence1',
          occurrenceEndAt: '2019-02-01T23:59:59.999Z',
          occurrenceStartAt: '2019-02-01T00:00:00.000Z',
          timezone: 'Australia/Melbourne',
        },
      },
      start: '2019-02-01T23:59:59.999Z',
    })

    AWS.restore()
  })
})

describe('errors', () => {
  const requiredFields = [
    'applicationId',
    'data.scheduleName',
    'data.timezone',
    'endAt',
    'locationId',
    'occurrenceId',
    'scheduleId',
    'startAt',
  ]

  requiredFields.forEach(field => {
    test(`errors when missing ${field} option`, async () => {
      const validData: schemas.ScheduleOccurrenceDocumentSchema = occurrenceDocument
      const invalidData = omit(field, validData)
      const event = createSnsEvent({ body: invalidData })

      try {
        await createExceptionHandler(event)
      } catch (err) {
        expect(err).toBeInstanceOf(errors.ApplicationError)
      }
    })
  })

  beforeEach(() => {
    process.env.LOOP_EXCEPTIONS_QUEUE_URL =
      'https://us-east-1.amazonaws.com/123456789012/ExceptionQueue'
  })

  test('skips publishing exception when area is not found', async () => {
    expect.assertions(2)

    const sendMessageSpy = jest.fn()
    AWS.mock('SQS', 'sendMessage', sendMessageSpy)

    mongo.getCollection = jest.fn().mockResolvedValue({
      findOne: jest.fn().mockResolvedValue(undefined),
    })

    const occurrence: schemas.ScheduleOccurrenceDocumentSchema = occurrenceDocument
    const event = createSnsEvent({ body: occurrence })
    const result = await createExceptionHandler(event)

    expect(result).toBeFalsy()
    expect(sendMessageSpy).not.toHaveBeenCalled()

    AWS.restore()
  })

  test('sqs error', async () => {
    expect.assertions(1)

    const sendMessageSpy = jest
      .fn()
      .mockRejectedValue(new Error('Network Error'))
    AWS.mock('SQS', 'sendMessage', sendMessageSpy)

    mongo.getCollection = jest.fn().mockResolvedValue({
      findOne: jest.fn().mockResolvedValue({
        _id: 'areaId',
        geometry: {
          type: 'Point',
          coordinates: [90, -90],
        },
      }),
    })

    const occurrence: schemas.ScheduleOccurrenceDocumentSchema = occurrenceDocument
    const event = createSnsEvent({ body: occurrence })

    try {
      await createExceptionHandler(event)
    } catch (err) {
      expect(err).toBeInstanceOf(errors.UnknownError)
      AWS.restore()
    }
  })

  test('area error', async () => {
    expect.assertions(1)

    mongo.getCollection = jest.fn().mockResolvedValue({
      findOne: jest.fn().mockRejectedValue(
        new errors.ApplicationError({
          message: 'Something went wrong',
        }),
      ),
    })

    const sendMessageSpy = jest.fn().mockResolvedValue('success')
    AWS.mock('SQS', 'sendMessage', sendMessageSpy)

    const occurrence: schemas.ScheduleOccurrenceDocumentSchema = occurrenceDocument
    const event = createSnsEvent({ body: occurrence })

    try {
      await createExceptionHandler(event)
    } catch (err) {
      expect(err).toBeInstanceOf(errors.ApplicationError)
      AWS.restore()
    }
  })
})
