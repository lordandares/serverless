import { mongo } from '@lighthouse/serverless-common'
import { attempt, isError } from 'lodash/fp'

export async function fetchLocations(application: string) {
  const applicationId = attempt(() => new mongo.ObjectId(application))

  if (!application || isError(applicationId)) {
    throw new Error(
      'fetchLocations: Missing required environment variables / params',
    )
  }

  const collection = await mongo.getCollection('locations')

  return collection
    .find({
      application: applicationId,
      activityReportTriggerTime: {
        $exists: true,
      },
      deleted: { $ne: true },
      timezone: { $exists: true },
    })
    .toArray()
}
