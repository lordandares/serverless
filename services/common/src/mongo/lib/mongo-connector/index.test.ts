import mongoDb from 'mongodb'
import { MONGODB_URI } from '../../../../test/shared'
import mongoConnector from './index'

beforeEach(() => {
  jest.clearAllMocks()
})

it('should error if mongoDbUri is not defined', () => {
  expect.assertions(1)
  const mongoDbUri = ''

  expect(mongoConnector(mongoDbUri)).rejects.toThrow(
    /MongoConnectionError: mongoDbUri is not defined/,
  )
})

it('should error if MongoClient can not connect to uri', done => {
  expect.assertions(1)
  const mongoDbUri = 'mongodb://invalid-host:27017/lighthouse-serverless-test'

  mongoConnector(mongoDbUri).catch(err => {
    expect(err.message).toEqual(
      'MongoConnectionError: Cannot connect to MongoDbUri',
    )
    done()
  })
})

it('should successfully open and cache a connection to mongo', done => {
  expect.assertions(4)

  const mongoDbUri = MONGODB_URI

  expect(mongoDb.MongoClient.connect).toHaveBeenCalledTimes(0)

  mongoConnector(mongoDbUri).then(firstDb => {
    // We expect MongoClient.connect to be called on first connect
    expect(mongoDb.MongoClient.connect).toHaveBeenCalledTimes(1)

    mongoConnector(mongoDbUri).then(secondDb => {
      // We then expect the existing instance to be returned
      // therefore MongoClient.connect is not called again
      expect(mongoDb.MongoClient.connect).toHaveBeenCalledTimes(1)
      expect(secondDb).toEqual(firstDb)

      done()
    })
  })
})
