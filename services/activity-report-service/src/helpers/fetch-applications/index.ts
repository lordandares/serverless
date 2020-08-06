import { mongo } from '@lighthouse/serverless-common'

export async function fetchApplications() {
  const collection = await mongo.getCollection('applications')

  return collection.find({}).toArray()
}
