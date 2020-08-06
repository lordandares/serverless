import * as dateFns from 'date-fns'

export async function getLocationReportLinks({
  location,
  withFormSubmissions,
}) {
  const baseUrl = process.env.S3_BASE_URL

  const { _id: locationId, name, files = {} } = location

  const activityReportPdf = withFormSubmissions
    ? files.activityReportSummaryAndForms
    : files.activityReportSummary

  // TODO This enables legacy support for reports generated before the change of
  // schema for activity report files. Can be safely deleted after 24h or
  // reports have been processed
  const pdf =
    activityReportPdf && activityReportPdf.path ? activityReportPdf : files.pdf

  if (!pdf || !pdf.path || !pdf.timestamp) {
    console.warn(`Missing required path/timestamp for ${locationId}`)
    return {
      id: locationId,
      link: null,
      name,
    }
  }

  const { path, timestamp } = pdf

  const now = new Date()
  const startDate = dateFns.subDays(now, 1)
  const isWithin24Hours = dateFns.isWithinRange(timestamp, startDate, now)

  // NOTE: if the report is not within 24 hours it is from a
  // previous day therefore we should return link as null.
  const link = isWithin24Hours ? `${baseUrl}/${path}` : null

  return {
    id: locationId,
    link,
    name,
  }
}
