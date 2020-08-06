import { mongo } from '@lighthouse/serverless-common'

import parseWinTeamMessages from './'

const shiftMessageResponse = {
  Messages: [
    {
      _id: new mongo.ObjectId('5d4697a7e652cbb5b680a000'),
      Id: 1,
      IsGlobal: 0,
      Message: 'parent message',
      PunchActionID: 6,
      Response1: 'Yes',
      Response1Id: 0,
      Response2: 'Also Yes',
      Response2Id: 2,
    },
    {
      _id: new mongo.ObjectId('5d4697a7e652cbb5b680a001'),
      Id: 2,
      IsGlobal: 0,
      Message: 'child message',
      PunchActionID: 6,
      Response1: 'no',
      Response1Id: 0,
      Response2: 'Also no',
      Response2Id: 0,
    },
    {
      _id: new mongo.ObjectId('5d4697a7e652cbb5b680a002'),
      Id: 3,
      IsGlobal: 1,
      Message: 'global shift message 1',
      PunchActionID: null,
      Response1: 'no',
      Response1Id: 0,
      Response2: 'Also no',
      Response2Id: 0,
    },
    {
      _id: new mongo.ObjectId('5d4697a7e652cbb5b680a003'),
      Id: 4,
      IsGlobal: 1,
      Message: 'global shift message 2',
      PunchActionID: null,
      Response1: 'no',
      Response1Id: 0,
      Response2: 'Also no',
      Response2Id: 0,
    },
  ],
}

describe('helpers :: parseWinTeamMessages', () => {
  beforeEach(() => jest.resetAllMocks())

  it('should return lowercase versions of all messages with Id mapped to messageId', () => {
    expect.assertions(1)

    const result = parseWinTeamMessages(shiftMessageResponse)

    expect(result).toMatchSnapshot()
  })

  it('should return an empty array with no shift messages', () => {
    expect.assertions(1)

    const shiftMessageResponse = {}

    const result = parseWinTeamMessages(shiftMessageResponse)

    expect(result).toEqual([])
  })

  it('should append a new mongo ObjectId to each new message', () => {
    expect.assertions(2)

    const messages = {
      Messages: [
        {
          Id: 4,
          IsGlobal: 1,
          Message: 'global shift message 2',
          PunchActionID: null,
          Response1: 'no',
          Response1Id: 0,
          Response2: 'Also no',
          Response2Id: 0,
        },
      ],
    }

    const result = parseWinTeamMessages(messages)
    const firstResult = result[0]

    expect(result).toHaveLength(1)
    expect(firstResult._id.toString()).toMatch(/^[a-f\d]{24}$/i)
  })
})
