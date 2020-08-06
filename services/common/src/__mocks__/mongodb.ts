import * as mongoDb from 'mongodb'

const VALID_MONGODB_URI = 'mongodb://localhost:27017/lighthouse-serverless-test'

const MONGO_INSTANCE_MOCK = {
  collection: () => ({
    findOneAndUpdate: () => ({}),
    find: () => [],
  }),
}

function connect(mongoDbUri: string) {
  if (mongoDbUri === VALID_MONGODB_URI) {
    return Promise.resolve(MONGO_INSTANCE_MOCK)
  }

  return Promise.reject({ message: 'Cannot connect to MongoDbUri' })
}

mongoDb.MongoClient.connect = jest.fn(connect).mockName('mongodbConnect')

export default mongoDb
