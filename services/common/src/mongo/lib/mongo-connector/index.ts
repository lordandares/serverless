import mongodb, { MongoClient } from 'mongodb'

let cachedDb: MongoClient

export default async function connect(
  mongoDbUri: string,
): Promise<MongoClient> {
  try {
    if (!mongoDbUri) {
      throw new Error('MongoConnectionError: mongoDbUri is not defined')
    }

    if (cachedDb) {
      return cachedDb
    }

    console.info('mongo:connect')

    const db: MongoClient = await mongodb.MongoClient.connect(mongoDbUri)

    console.info('mongo:connect:success')

    cachedDb = db

    return cachedDb
  } catch (err) {
    throw new Error(`MongoConnectionError: ${err.message}`)
  }
}
