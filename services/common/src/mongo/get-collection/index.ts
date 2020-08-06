import { createClient } from '../create-client'

interface IMongoGetCollectionEnv {
  env: {
    MONGODB_SECRET_ID: string
  }
}

declare var process: IMongoGetCollectionEnv

export async function getCollection(collectionName) {
  const secretId = process.env.MONGODB_SECRET_ID
  const client = await createClient(secretId)
  const db = client.db()

  const collection = db.collection(collectionName)

  return collection
}
