const mockFindOne = jest.fn()
const mockGetCollection = jest.fn()

import { omit } from 'lodash/fp'
import { mongo } from '@lighthouse/serverless-common'

import * as AWSMock from 'aws-sdk-mock'
import * as AWS from 'aws-sdk'
import * as MockDate from 'mockdate'

AWSMock.setSDKInstance(AWS)

mongo.getCollection = mockGetCollection

import { createSnsEvent } from '../../../../../__test__/helpers'
import shiftHandler from './'

const getValidApplication = ({ winteamEnabled }) => ({
  _id: '000000000000000000000000',
  name: 'Valid Application',
  plugins: {
    winteam: {
      enabled: winteamEnabled,
    },
  },
})

const validEndShift = {
  _id: '111111111111111111111111',
  application: '000000000000000000000000',
  end: {
    time: '2019-06-01T07:00:00.000Z',
  },
  location: '222222222222222222222222',
  start: {
    time: '2019-06-01T05:00:00.000Z',
  },
  user: '333333333333333333333333',
}

const validStartShift = {
  _id: '111111111111111111111111',
  application: '000000000000000000000000',
  location: '222222222222222222222222',
  start: {
    time: '2019-06-01T05:00:00.000Z',
  },
  user: '333333333333333333333333',
}

const getValidUser = ({ winteamEnabled, ...options }) => ({
  _id: 'valid-user-id',
  email: 'valid-email-address',
  firstName: 'first-name',
  lastName: 'last-name',
  plugins: {
    winteam: {
      enabled: winteamEnabled,
      options,
    },
  },
  username: 'user-name',
})

let snsPublishMock = jest.fn()

describe('handlers:shift-handler', () => {
  beforeAll(() =>
    AWSMock.mock('StepFunctions', 'startExecution', snsPublishMock))

  beforeEach(() => {
    process.env.MONGODB_SECRET_ID = 'secretId'
    process.env.INTEGRATION_STATE_MACHINE_ARN =
      'arn:aws:states:us-east-1:0123456789012:stateMachine:state-machine-arn'

    MockDate.set('2000-01-01T00:00:00.000Z')
    jest.resetAllMocks()
  })

  afterEach(() => MockDate.reset())

  afterAll(() => AWSMock.restore())

  it('should error if the INTEGRATION_STATE_MACHINE_ARN is missing', async () => {
    expect.assertions(1)
    process.env.INTEGRATION_STATE_MACHINE_ARN = ''

    try {
      const payload = createSnsEvent({ body: '' })

      await shiftHandler(payload)
    } catch (err) {
      expect(err.message).toMatch(
        /ShiftError - INTEGRATION_STATE_MACHINE_ARN is missing/,
      )
    }
  })

  it('should error if the SNS message is empty', async () => {
    expect.assertions(1)

    try {
      const emptyPayload = createSnsEvent({ body: '' })

      await shiftHandler(emptyPayload)
    } catch (err) {
      expect(err.message).toMatch(/ShiftError - message could not be read/)
    }
  })

  it('should error if the SNS message is invalid', async () => {
    expect.assertions(1)

    try {
      const invalidPayload = createSnsEvent({ body: '{Invalid: json//' })

      await shiftHandler(invalidPayload)
    } catch (err) {
      expect(err.message).toMatch(/ShiftError - message could not be parsed/)
    }
  })

  it('should error if either the `application` or `_id` is not a valid ObjectId', async () => {
    expect.assertions(1)

    try {
      const invalidPayload = createSnsEvent({
        body: {
          application: ') && this.password.match(/*./)%00',
          shift: '111111111111111111111111',
        },
      })

      await shiftHandler(invalidPayload)
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
          event: 'start-shift',
        },
      })

      await shiftHandler(missingApplication)
    } catch (err) {
      expect(err.message).toMatch(/could not find application/)
    }
  })

  it('should error if a shift can not be retrieved', async () => {
    expect.assertions(1)

    mockGetCollection.mockResolvedValue({ findOne: mockFindOne })
    mockFindOne
      .mockResolvedValueOnce(getValidApplication({}))
      .mockResolvedValue(null)

    try {
      const invalidShift = createSnsEvent({
        body: {
          _id: '000000000000000000000000',
          application: '111111111111111111111111',
          event: 'start-shift',
        },
      })

      await shiftHandler(invalidShift)
    } catch (err) {
      expect(err.message).toMatch(/ShiftError - could not find shift/)
    }
  })

  it('should error if the user is missing', async () => {
    expect.assertions(1)

    const shiftWithoutUser = omit('user', validStartShift)

    mockGetCollection.mockResolvedValue({ findOne: mockFindOne })
    mockFindOne
      .mockResolvedValueOnce(getValidApplication({}))
      .mockResolvedValue(shiftWithoutUser)

    try {
      const invalidShift = createSnsEvent({
        body: {
          _id: '000000000000000000000000',
          application: '111111111111111111111111',
          event: 'start-shift',
        },
      })

      await shiftHandler(invalidShift)
    } catch (err) {
      expect(err.message).toMatch(/ShiftError - user missing from shift/)
    }
  })

  it('should error if the user cannot be retrieved', async () => {
    expect.assertions(1)

    mockGetCollection.mockResolvedValue({ findOne: mockFindOne })
    mockFindOne
      .mockResolvedValueOnce(getValidApplication({}))
      .mockResolvedValueOnce(validEndShift)
      .mockResolvedValue(null)

    try {
      const invalidShift = createSnsEvent({
        body: {
          _id: '000000000000000000000000',
          application: '111111111111111111111111',
          event: 'end-shift',
        },
      })

      await shiftHandler(invalidShift)
    } catch (err) {
      expect(err.message).toMatch(/could not find application user/)
    }
  })

  it('should set winteamEnabled=false if disabled at the application level', async () => {
    expect.assertions(3)

    snsPublishMock.mockResolvedValue('step-function-success')

    mockGetCollection.mockResolvedValue({ findOne: mockFindOne })
    mockFindOne
      .mockResolvedValueOnce(getValidApplication({ winteamEnabled: false }))
      .mockResolvedValueOnce(validStartShift)
      .mockResolvedValueOnce(
        getValidUser({
          employeeNumber: 'wt-1234',
          winteamEnabled: true,
        }),
      )

    const validMessage = createSnsEvent({
      body: {
        _id: '000000000000000000000000',
        application: '111111111111111111111111',
        event: 'start',
      },
    })

    const result = await shiftHandler(validMessage)

    expect(result).toEqual('step-function-success')

    expect(snsPublishMock).toHaveBeenCalledTimes(1)

    const input = JSON.parse(snsPublishMock.mock.calls[0][0].input)

    expect(input.plugins.winteamEnabled).toEqual(false)
  })

  it('should set winteamEnabled=false if disabled at the user level', async () => {
    expect.assertions(3)

    snsPublishMock.mockResolvedValue('step-function-success')

    mockGetCollection.mockResolvedValue({ findOne: mockFindOne })
    mockFindOne
      .mockResolvedValueOnce(getValidApplication({ winteamEnabled: true }))
      .mockResolvedValueOnce(validStartShift)
      .mockResolvedValueOnce(
        getValidUser({
          employeeNumber: 'wt-1234',
          winteamEnabled: false,
        }),
      )

    const validMessage = createSnsEvent({
      body: {
        _id: '000000000000000000000000',
        application: '111111111111111111111111',
        event: 'start',
      },
    })

    const result = await shiftHandler(validMessage)

    expect(result).toEqual('step-function-success')

    expect(snsPublishMock).toHaveBeenCalledTimes(1)

    const input = JSON.parse(snsPublishMock.mock.calls[0][0].input)

    expect(input.plugins.winteamEnabled).toEqual(false)
  })

  it('should successfully process a start shift', async () => {
    expect.assertions(4)

    snsPublishMock.mockResolvedValue('step-function-success')

    mockGetCollection.mockResolvedValue({ findOne: mockFindOne })
    mockFindOne
      .mockResolvedValueOnce(
        getValidApplication({
          winteamEnabled: true,
        }),
      )
      .mockResolvedValueOnce(validStartShift)
      .mockResolvedValueOnce(
        getValidUser({
          employeeNumber: 'wt-1234',
          winteamEnabled: true,
        }),
      )

    const validMessage = createSnsEvent({
      body: {
        _id: '000000000000000000000000',
        application: '111111111111111111111111',
        event: 'start',
      },
    })

    const result = await shiftHandler(validMessage)

    expect(result).toEqual('step-function-success')

    const snsMessage = snsPublishMock.mock.calls[0][0]
    const snsMessageInput = JSON.parse(snsMessage.input)

    expect(snsPublishMock).toHaveBeenCalledTimes(1)
    expect(snsMessage).toMatchSnapshot()

    expect(snsMessageInput.plugins.winteamEnabled).toEqual(true)
  })

  it('should successfully process an end shift', async () => {
    expect.assertions(4)

    snsPublishMock.mockResolvedValue('step-function-success')

    mockGetCollection.mockResolvedValue({ findOne: mockFindOne })
    mockFindOne
      .mockResolvedValueOnce(
        getValidApplication({
          winteamEnabled: true,
        }),
      )
      .mockResolvedValueOnce(validStartShift)
      .mockResolvedValueOnce(
        getValidUser({
          employeeNumber: 'wt-1234',
          winteamEnabled: true,
        }),
      )

    const validMessage = createSnsEvent({
      body: {
        _id: '000000000000000000000000',
        application: '111111111111111111111111',
        event: 'end',
      },
    })

    const result = await shiftHandler(validMessage)

    expect(result).toEqual('step-function-success')

    const snsMessage = snsPublishMock.mock.calls[0][0]
    const snsMessageInput = JSON.parse(snsMessage.input)

    expect(snsPublishMock).toHaveBeenCalledTimes(1)
    expect(snsMessage).toMatchSnapshot()

    expect(snsMessageInput.plugins.winteamEnabled).toEqual(true)
  })
})
