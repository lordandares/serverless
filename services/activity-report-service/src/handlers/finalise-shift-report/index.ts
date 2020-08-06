import { mongo } from '@lighthouse/serverless-common'

export async function finaliseShiftReport(event) {
  const isJson = typeof event.body === 'string'
  const payload = isJson ? JSON.parse(event.body) : event

  const { shiftId, pdfs } = payload
  const { summaryS3Path, summaryAndFormsS3Path } = pdfs

  const collection = await mongo.getCollection('shifts')

  console.info(`updating files summary path to ${summaryS3Path}`)
  console.info(`updating files pdf path to ${summaryAndFormsS3Path}`)

  const timestamp = new Date()

  await collection.findOneAndUpdate(
    { _id: new mongo.ObjectId(shiftId) },
    {
      $set: {
        files: {
          activityReportSummary: {
            path: summaryS3Path,
            timestamp,
          },
          activityReportSummaryAndForms: {
            path: summaryAndFormsS3Path,
            timestamp,
          },
          pdf: {
            path: summaryAndFormsS3Path,
            timestamp,
          },
        },
      },
    },
  )

  console.info('updated files pdf and summary paths')
}

export default finaliseShiftReport
