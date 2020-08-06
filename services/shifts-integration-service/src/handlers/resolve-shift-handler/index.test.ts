jest.mock('../../helpers')
jest.mock('../../helpers/get-winteam-time-punch', () => ({
  getWinTeamMessages: jest.fn(),
}))

import { mongo } from '@lighthouse/serverless-common'
import { winteam } from '@lighthouse/serverless-integrations'

import { notifyUser, parseWinTeamMessages } from '../../helpers'
import { getWinTeamMessages } from '../../helpers/get-winteam-time-punch'
import resolveShiftHandler, { getStartShiftMessages } from './'

mongo.getCollection = jest.fn()
winteam.request = jest.fn()

describe('handlers:resolve-shift-handler', () => {
  beforeEach(() => jest.resetAllMocks())

  it('should error if the `shiftId` is missing', async () => {
    expect.assertions(1)

    const event = {
      shift: {
        _id: '',
      },
    }

    expect(resolveShiftHandler(event)).rejects.toThrowErrorMatchingSnapshot()
  })

  it('should update a shift status to resolved with messages', async () => {
    expect.assertions(5)

    const event = {
      shift: {
        _id: '5d1eb8a4fc13ae1f85000000',
      },
      user: {
        _id: 'user-id',
      },
    }

    const shiftMessages = [
      {
        _id: new mongo.ObjectId('5d4697a7e652cbb5b680a004'),
        isGlobal: false,
        message: 'test message',
        messageId: 1,
        punchActionId: 6,
        response1: 'Yes',
        response1Id: 0,
        response2: 'Also Yes',
        response2Id: 2,
      },
    ]

    const shiftResponseObject = {
      Messages: [
        {
          Id: 1,
          IsGlobal: 0,
          Message: 'test message',
          PunchActionID: 6,
          Response1: 'Yes',
          Response1Id: 0,
          Response2: 'Also Yes',
          Response2Id: 2,
        },
      ],
    }

    const mockFindOneAndUpdate = jest.fn().mockResolvedValue({
      value: {
        ...event.shift,
        messages: shiftMessages,
        status: 'resolved',
      },
    })

    getWinTeamMessages.mockResolvedValue(
      'EmployeeId=wt-valid-employee-id&JobId=wt-valid-job-id&PunchTime=2019-01-23%2000%3A00%3A00.000%2B0000',
    )
    winteam.request.mockResolvedValue(shiftResponseObject)
    mongo.getCollection.mockResolvedValue({
      findOneAndUpdate: mockFindOneAndUpdate,
    })

    parseWinTeamMessages.mockReturnValue(shiftMessages)

    const result = await resolveShiftHandler(event)

    expect(mongo.getCollection).toHaveBeenCalledTimes(1)
    expect(mongo.getCollection).toBeCalledWith('shifts')

    expect(mockFindOneAndUpdate).toHaveBeenCalledTimes(1)
    expect(mockFindOneAndUpdate).toBeCalledWith(
      { _id: new mongo.ObjectId(event.shift._id) },
      {
        $set: {
          messages: shiftMessages,
          status: 'resolved',
        },
      },
      { returnOriginal: false },
    )

    expect(result).toMatchSnapshot()
  })

  it('should update a shift status to resolved if shift messages could not be retrieved', async () => {
    expect.assertions(5)

    const event = {
      shift: {
        _id: '5d1eb8a4fc13ae1f85000000',
      },
      user: {
        _id: 'user-id',
      },
    }

    const mockFindOneAndUpdate = jest.fn().mockResolvedValue({
      value: {
        ...event.shift,
        messages: [],
        status: 'resolved',
      },
    })

    getWinTeamMessages.mockResolvedValue(
      'EmployeeId=wt-valid-employee-id&JobId=wt-valid-job-id&PunchTime=2019-01-23%2000%3A00%3A00.000%2B0000',
    )
    winteam.request.mockRejectedValue(new Error('ServerError'))
    mongo.getCollection.mockResolvedValue({
      findOneAndUpdate: mockFindOneAndUpdate,
    })

    const result = await resolveShiftHandler(event)

    expect(mongo.getCollection).toHaveBeenCalledTimes(1)
    expect(mongo.getCollection).toBeCalledWith('shifts')

    expect(mockFindOneAndUpdate).toHaveBeenCalledTimes(1)
    expect(mockFindOneAndUpdate).toBeCalledWith(
      { _id: new mongo.ObjectId(event.shift._id) },
      {
        $set: {
          messages: [],
          status: 'resolved',
        },
      },
      { returnOriginal: false },
    )

    expect(result).toMatchSnapshot()
  })

  it('should send a notification for shift with messages that need immediately actioned', async () => {
    expect.assertions(7)

    const event = {
      shift: {
        _id: '5d1eb8a4fc13ae1f85000000',
      },
      user: {
        _id: 'user-id',
      },
    }

    const shiftMessages = [
      {
        _id: new mongo.ObjectId('5d4697a7e652cbb5b680a001'),
        isGlobal: true,
        message: 'test message',
        messageId: 1,
        punchActionId: null,
        response1: 'Yes',
        response1Id: 0,
        response2: 'Also Yes',
        response2Id: 0,
      },
    ]

    const shiftResponseObject = {
      Messages: [
        {
          Id: 1,
          IsGlobal: 1,
          Message: 'test message',
          PunchActionID: null,
          Response1: 'Yes',
          Response1Id: 0,
          Response2: 'Also Yes',
          Response2Id: 0,
        },
      ],
    }

    const mockFindOneAndUpdate = jest.fn().mockResolvedValue({
      value: {
        ...event.shift,
        messages: shiftMessages,
        status: 'resolved',
      },
    })

    getWinTeamMessages.mockResolvedValue(
      'EmployeeId=wt-valid-employee-id&JobId=wt-valid-job-id&PunchTime=2019-01-23%2000%3A00%3A00.000%2B0000',
    )
    mongo.getCollection.mockResolvedValue({
      findOneAndUpdate: mockFindOneAndUpdate,
    })
    notifyUser.mockResolvedValue(null)
    parseWinTeamMessages.mockReturnValue(shiftMessages)
    winteam.request.mockResolvedValue(shiftResponseObject)

    const result = await resolveShiftHandler(event)

    expect(mongo.getCollection).toHaveBeenCalledTimes(1)
    expect(mongo.getCollection).toBeCalledWith('shifts')

    expect(mockFindOneAndUpdate).toHaveBeenCalledTimes(1)
    expect(mockFindOneAndUpdate).toBeCalledWith(
      { _id: new mongo.ObjectId(event.shift._id) },
      {
        $set: {
          messages: shiftMessages,
          status: 'resolved',
        },
      },
      { returnOriginal: false },
    )

    expect(notifyUser).toHaveBeenCalledTimes(1)
    expect(notifyUser).toHaveBeenCalledWith({
      message: 'Compliance Message(s) received.  Open Lighthouse for details',
      title: 'Compliance Message',
      type: 'shift-resolved-with-messages',
      user: {
        _id: 'user-id',
      },
    })

    expect(result).toMatchSnapshot()
  })

  it('should update a shift status to confirmed without messages', async () => {
    expect.assertions(6)

    const event = {
      shift: {
        _id: '5d1eb8a4fc13ae1f85000000',
      },
      user: {
        _id: 'user-id',
      },
    }

    const mockFindOneAndUpdate = jest.fn().mockResolvedValue({
      value: {
        ...event.shift,
        messages: [],
        status: 'resolved',
      },
    })

    getWinTeamMessages.mockResolvedValue(null)
    mongo.getCollection.mockResolvedValue({
      findOneAndUpdate: mockFindOneAndUpdate,
    })
    parseWinTeamMessages.mockReturnValue([])
    winteam.request.mockResolvedValue(null)

    const result = await resolveShiftHandler(event)

    expect(mongo.getCollection).toHaveBeenCalledTimes(1)
    expect(mongo.getCollection).toBeCalledWith('shifts')

    expect(mockFindOneAndUpdate).toHaveBeenCalledTimes(1)
    expect(mockFindOneAndUpdate).toBeCalledWith(
      { _id: new mongo.ObjectId(event.shift._id) },
      {
        $set: {
          messages: [],
          status: 'resolved',
        },
      },
      { returnOriginal: false },
    )

    expect(notifyUser).toHaveBeenCalledTimes(0)

    expect(result).toMatchSnapshot()
  })
})

describe('helpers :: getStartShiftMessages', () => {
  it('should return an empty array if messages are empty/null', () => {
    expect.assertions(1)

    const result = getStartShiftMessages(null)

    expect(result).toEqual([])
  })

  it('should return both global messages, and messages matching the start shift punchActionIds', () => {
    expect.assertions(2)

    const messages = [
      {
        _id: new mongo.ObjectId('5d4697a7e652cbb5b680a000'),
        isGlobal: false,
        message: 'test message',
        messageId: 1,
        punchActionId: 6,
        response1: 'Yes',
        response1Id: 0,
        response2: 'Also Yes',
        response2Id: 2,
      },
      {
        _id: new mongo.ObjectId('5d4697a7e652cbb5b680a001'),
        isGlobal: true,
        message: 'global message 1',
        messageId: 1,
        punchActionId: 6,
        response1: 'Yes',
        response1Id: 0,
        response2: 'Also Yes',
        response2Id: 2,
      },
      {
        _id: new mongo.ObjectId('5d4697a7e652cbb5b680a002'),
        isGlobal: false,
        message: 'start shift message',
        messageId: 1,
        punchActionId: 3,
        response1: 'Yes',
        response1Id: 0,
        response2: 'Also Yes',
        response2Id: 2,
      },
    ]

    const result = getStartShiftMessages(messages)

    expect(result).toHaveLength(2)
    expect(result).toMatchSnapshot()
  })
})
