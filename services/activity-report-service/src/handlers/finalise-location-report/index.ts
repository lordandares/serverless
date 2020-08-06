import { mongo } from '@lighthouse/serverless-common'

export async function finaliseLocationReport(event) {
  const isJson = typeof event.body === 'string'
  const payload = isJson ? JSON.parse(event.body) : event

  const { locationId, pdfs } = payload
  const { summaryS3Path, summaryAndFormsS3Path } = pdfs

  const collection = await mongo.getCollection('locations')

  console.info(`updating location files summary path to ${summaryS3Path}`)
  console.info(`updating location files pdf path to ${summaryAndFormsS3Path}`)

  const timestamp = new Date()

  await collection.findOneAndUpdate(
    { _id: new mongo.ObjectId(locationId) },
    {
      $set: {
        files: {
          pdf: {
            path: summaryAndFormsS3Path,
            timestamp,
          },
          activityReportSummary: {
            path: summaryS3Path,
            timestamp,
          },
          activityReportSummaryAndForms: {
            path: summaryAndFormsS3Path,
            timestamp,
          },
        },
      },
    },
  )

  console.info('updated location files pdf and summary paths')
}

export default finaliseLocationReport
