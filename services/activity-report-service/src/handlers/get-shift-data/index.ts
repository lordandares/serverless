import * as dateFns from 'date-fns'

import { buildShiftSummaryPdf } from '../../helpers/build-shift-summary-pdf'
import { getFormS3Paths } from '../../helpers/get-references'
import { getShiftSummaryData } from '../../helpers/get-shift-summary-data'

export async function getShiftData(event) {
  const isJson = typeof event.body === 'string'
  const payload = isJson ? JSON.parse(event.body) : event

  const data = await getShiftSummaryData(payload)

  const { applicationId } = data
  const summaryS3Path = await buildShiftSummaryPdf(data)
  const formS3Paths = await getFormS3Paths(data)

  const pdfsToMerge = [summaryS3Path, ...formS3Paths]
  const mergedS3Path = getMergedPdfPath({
    applicationId,
    shiftId: payload.shiftId,
  })

  return {
    mergedS3Path,
    pdfsToMerge,
    skip: false,
    summaryS3Path,
  }
}

function getMergedPdfPath({ applicationId, shiftId }) {
  const date = new Date()
  const year = dateFns.format(date, 'YYYY')
  const month = dateFns.format(date, 'MM')
  const day = dateFns.format(date, 'DD')
  const unix = date.getTime()

  const s3PathName = `activity-reports/shifts/${applicationId}/${year}/${month}/${day}`
  const s3FileName = `${year}-${month}-${day}-shift-${shiftId}-summary-and-forms-${unix}.pdf`

  return `${s3PathName}/${s3FileName}`
}

export default getShiftData
