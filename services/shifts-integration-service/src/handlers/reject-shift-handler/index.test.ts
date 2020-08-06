jest.mock('../../helpers')

import * as MockDate from 'mockdate'
import { mongo } from '@lighthouse/serverless-common'

mongo.getCollection = jest.fn()

import rejectShiftHandler, { formatShiftErrors } from './'
import { notifyUser } from '../../helpers'

describe('handlers:reject-shift-handler', () => {
  beforeEach(() => jest.resetAllMocks())

  it('should error if the `shiftId` is missing', async () => {
    expect.assertions(1)

    const event = {
      shift: {
        _id: '',
      },
    }

    expect(rejectShiftHandler(event)).rejects.toThrowErrorMatchingSnapshot()
  })

  it('should end a shift and set the status to rejected', async () => {
    expect.assertions(6)

    notifyUser.mockResolvedValue({})

    const expectedEnd = '2018-06-15T14:00:00.000Z'
    MockDate.set(expectedEnd)

    const event = {
      errors: [
        {
          AttemptedValue: 'invalid@email',
          ErrorMessage: 'Invalid Email Address',
          ErrorType: 'ValidationError',
          FieldName: 'email',
        },
      ],
      shift: {
        _id: '5d1eb8a4fc13ae1f85000000',
      },
      user: {
        _id: '5d1eb8a4fc13ae1f85000001',
      },
    }

    const mockFindOneAndUpdate = jest.fn().mockResolvedValue({
      value: {
        ...event.shift,
        end: {
          time: new Date(expectedEnd),
        },
        status: 'rejected',
        user: '1234',
      },
    })

    mongo.getCollection.mockResolvedValue({
      findOneAndUpdate: mockFindOneAndUpdate,
    })

    const result = await rejectShiftHandler(event)

    expect(mongo.getCollection).toHaveBeenCalledTimes(1)
    expect(mongo.getCollection).toBeCalledWith('shifts')

    expect(mockFindOneAndUpdate).toHaveBeenCalledTimes(1)
    expect(mockFindOneAndUpdate).toBeCalledWith(
      { _id: new mongo.ObjectId(event.shift._id) },
      {
        $set: {
          end: {
            time: new Date(expectedEnd),
          },
          status: 'rejected',
          verificationErrors: [
            {
              attemptedValue: 'invalid@email',
              errorMessage: 'Invalid Email Address',
              errorType: 'ValidationError',
              field: 'email',
            },
          ],
        },
      },
      { returnOriginal: false },
    )

    expect(notifyUser).toHaveBeenCalledTimes(1)

    expect(result).toMatchSnapshot()
  })

  describe('helpers :: formatShiftErrors', () => {
    it('should return an empty array if no errors are present', () => {
      const errors = []

      expect(formatShiftErrors(errors)).toEqual([])
    })

    it('should format error messages', () => {
      const errors = [
        {
          AttemptedValue: 'invalid@email',
          ErrorMessage: 'Invalid Email Address',
          ErrorType: 'ValidationError',
          FieldName: 'email',
        },
        {
          AttemptedValue: 'password',
          ErrorMessage: 'Invalid Password',
          ErrorType: 'ValidationError',
          FieldName: 'password',
        },
      ]

      const result = formatShiftErrors(errors)

      expect(result).toHaveLength(2)
      expect(result).toMatchSnapshot()
    })
  })
})
