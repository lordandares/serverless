jest.mock('@lighthouse/serverless-integrations')

import { winteam } from '@lighthouse/serverless-integrations/'

const mockFindOne = jest.fn()
const mockGetCollection = jest.fn()

import { mongo } from '@lighthouse/serverless-common'
import { omit } from 'lodash/fp'

import * as AWS from 'aws-sdk'
import * as AWSMock from 'aws-sdk-mock'

AWSMock.setSDKInstance(AWS)

mongo.getCollection = mockGetCollection

import { createSnsEvent } from '../../../../../__test__/helpers'
import messageHandler from './'

const validApplication = {
  _id: '000000000000000000000000',
  name: 'Valid Application',
  plugins: {
    winteam: {
      enabled: true,
    },
  },
}

const validStartShift = {
  _id: '111111111111111111111111',
  application: '000000000000000000000000',
  location: '222222222222222222222222',
  messages: [
    {
      _id: '111111111111111111111122',
      message: 'test message',
      messageId: 1,
      punchActionId: 6,
      response1: 'Yes',
      response1Id: 2,
      response2: 'Also Yes',
      response2Id: 0,
      responseText: 'Yes',
      responseTime: '2019-11-01T02:30:00.000Z',
    },
    {
      _id: '111111111111111111111133',
      message: 'test message',
      messageId: 2,
      punchActionId: 6,
      response1: 'No',
      response1Id: 0,
      response2: 'Also No',
      response2Id: 0,
      responseText: null,
      responseTime: null,
    },
  ],
  start: {
    time: '2019-06-01T05:00:00.000Z',
  },
  user: '333333333333333333333333',
}

const validUser = {
  _id: 'valid-user-id',
  email: 'valid-email-address',
  firstName: 'first-name',
  lastName: 'last-name',
  plugins: {
    winteam: {
      employeeNumber: 'wt-employee-number',
    },
  },
  username: 'user-name',
}

describe('handlers:winteam-message-handler', () => {
  beforeAll(() =>
    AWSMock.mock('StepFunctions', 'startExecution', 'step-function-success'))
  beforeEach(() => {
    process.env.MONGODB_SECRET_ID = 'secretId'

    jest.resetAllMocks()
  })

  afterAll(() => {
    jest.restoreAllMocks()

    AWSMock.restore()
  })

  it('should error if the SNS message is empty', async () => {
    expect.assertions(1)

    try {
      const emptyPayload = createSnsEvent({ body: '' })

      await messageHandler(emptyPayload)
    } catch (err) {
      expect(err.message).toMatch(/ShiftError - message could not be read/)
    }
  })

  it('should error if the SNS message is invalid', async () => {
    expect.assertions(1)

    try {
      const invalidPayload = createSnsEvent({ body: '{Invalid: json//' })

      await messageHandler(invalidPayload)
    } catch (err) {
      expect(err.message).toMatch(/ShiftError - message could not be parsed/)
    }
  })

  it('should error if an endpoint cannot be found', async () => {
    expect.assertions(1)

    try {
      const payload = createSnsEvent({
        body: {
          _id: '000000000000000000000000',
          application: '000000000000000000000000',
          event: 'invalid-event',
          messageId: 1,
        },
      })

      await messageHandler(payload)
    } catch (err) {
      expect(err.message).toMatch(/Could not find endpoint for event/)
    }
  })

  it('should error if either the `application` or `_id` is not a valid ObjectId', async () => {
    expect.assertions(1)

    try {
      const invalidPayload = createSnsEvent({
        body: {
          application: ') && this.password.match(/*./)%00',
          event: 'message',
          shift: '111111111111111111111111',
        },
      })

      await messageHandler(invalidPayload)
    } catch (err) {
      expect(err.message).toMatch(
        /Argument passed in must be a single String of 12 bytes or a string of 24 hex characters/,
      )
    }
  })

  it('should error if an application can not be retrieved', async () => {
    expect.assertions(1)

    mockGetCollection.mockResolvedValue({ findOne: mockFindOne })
    mockFindOne.mockResolvedValue(null)

    try {
      const missingApplication = createSnsEvent({
        body: {
          _id: '000000000000000000000000',
          application: '111111111111111111111111',
          event: 'message',
        },
      })

      await messageHandler(missingApplication)
    } catch (err) {
      expect(err.message).toMatch(/could not find application/)
    }
  })

  it('should skip if winteam is not enabled', async () => {
    expect.assertions(1)

    mockGetCollection.mockResolvedValue({ findOne: mockFindOne })
    mockFindOne.mockResolvedValueOnce({
      ...validApplication,
      plugins: {},
    })

    try {
      const event = createSnsEvent({
        body: {
          _id: '000000000000000000000000',
          application: '000000000000000000000000',
          event: 'message',
          messageId: '111111111111111111111122',
        },
      })

      const result = await messageHandler(event)

      expect(result).toBeUndefined()
    } catch (err) {}
  })

  it('should error if a shift can not be retrieved', async () => {
    expect.assertions(1)

    mockGetCollection.mockResolvedValue({ findOne: mockFindOne })
    mockFindOne.mockResolvedValueOnce(validApplication).mockResolvedValue(null)

    try {
      const invalidShift = createSnsEvent({
        body: {
          _id: '000000000000000000000000',
          application: '111111111111111111111111',
          event: 'message',
        },
      })

      await messageHandler(invalidShift)
    } catch (err) {
      expect(err.message).toMatch(/ShiftError - could not find shift/)
    }
  })

  it('should error if the user is missing', async () => {
    expect.assertions(1)

    const shiftWithoutUser = omit('user', validStartShift)

    mockGetCollection.mockResolvedValue({ findOne: mockFindOne })
    mockFindOne
      .mockResolvedValueOnce(validApplication)
      .mockResolvedValue(shiftWithoutUser)

    try {
      const invalidShift = createSnsEvent({
        body: {
          _id: '000000000000000000000000',
          application: '111111111111111111111111',
          event: 'message',
        },
      })

      await messageHandler(invalidShift)
    } catch (err) {
      expect(err.message).toMatch(/ShiftError - user missing from shift/)
    }
  })

  it('should error if the user cannot be retrieved', async () => {
    expect.assertions(1)

    mockGetCollection.mockResolvedValue({ findOne: mockFindOne })
    mockFindOne
      .mockResolvedValueOnce(validApplication)
      .mockResolvedValueOnce(validStartShift)
      .mockResolvedValue(null)

    try {
      const invalidShift = createSnsEvent({
        body: {
          _id: '000000000000000000000000',
          application: '111111111111111111111111',
          event: 'message',
        },
      })

      await messageHandler(invalidShift)
    } catch (err) {
      expect(err.message).toMatch(/could not find application user/)
    }
  })

  it('should error if the message cannot be retrieved', async () => {
    expect.assertions(1)

    mockGetCollection.mockResolvedValue({ findOne: mockFindOne })
    mockFindOne
      .mockResolvedValueOnce(validApplication)
      .mockResolvedValueOnce(validStartShift)
      .mockResolvedValue(validUser)

    try {
      const invalidShift = createSnsEvent({
        body: {
          _id: '000000000000000000000000',
          application: '111111111111111111111111',
          event: 'message',
          messageId: '111111111111111111111114',
        },
      })

      await messageHandler(invalidShift)
    } catch (err) {
      expect(err.message).toMatch(/could not find message/)
    }
  })

  it('should successfully send a winteam request', async () => {
    expect.assertions(1)

    mockGetCollection.mockResolvedValue({ findOne: mockFindOne })
    mockFindOne
      .mockResolvedValueOnce(validApplication)
      .mockResolvedValueOnce(validStartShift)
      .mockResolvedValueOnce(validUser)

    winteam.request.mockResolvedValue({})

    const validMessage = createSnsEvent({
      body: {
        _id: '000000000000000000000000',
        application: '111111111111111111111111',
        event: 'message',
        messageId: '111111111111111111111122',
      },
    })

    const result = await messageHandler(validMessage)

    expect(result).toEqual({})
  })
})
