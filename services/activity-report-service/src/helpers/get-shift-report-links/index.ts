import * as dateFns from 'date-fns'

import { mongo } from '@lighthouse/serverless-common'

export async function getShiftReportLinks({
  datetime,
  shift,
  withFormSubmissions,
}) {
  const baseUrl = process.env.S3_BASE_URL

  const { _id: shiftId, files = {}, user } = shift

  const pdfReport = withFormSubmissions
    ? files.activityReportSummaryAndForms
    : files.activityReportSummary

  const userCollection = await mongo.getCollection('users')
  const userData = await userCollection.findOne({
    _id: new mongo.ObjectId(user),
  })

  const fullName = userData.firstName + ' ' + userData.lastName

  if (!pdfReport || !pdfReport.path || !pdfReport.timestamp) {
    console.warn(`Missing required path/timestamp for ${shiftId}`)
    return {
      id: shiftId,
      link: null,
      fullName: fullName,
      timestamp: null,
      lastName: userData.lastName,
    }
  }

  const { path, timestamp } = pdfReport

  const endTime = datetime
  const startTime = dateFns.subDays(endTime, 1)
  const isWithin24Hours = dateFns.isWithinRange(timestamp, startTime, endTime)

  // NOTE: if the report is not within 24 hours it is from a
  // previous day therefore we should return link as null.
  const link = isWithin24Hours ? `${baseUrl}/${path}` : null

  return {
    id: shiftId,
    link,
    fullName,
    timestamp,
    lastName: userData.lastName,
  }
}
