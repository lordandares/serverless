import { buildShiftPdf } from '@lighthouse/common'
import * as dateFns from 'date-fns'

import { buildConfig, createSummaryPdf } from '../create-summary-pdf'

export async function buildShiftSummaryPdf(data) {
  const config = buildConfig(data)
  const { data: summaryData, pdfOptions } = config

  const pdfDefinition = await buildShiftPdf(pdfOptions, summaryData)
  const s3FullPath = getShiftSummaryPdfPath(data)
  await createSummaryPdf(pdfDefinition, s3FullPath)

  return s3FullPath
}

function getShiftSummaryPdfPath({ applicationId, shift }) {
  const date = new Date()
  const year = dateFns.format(date, 'YYYY')
  const month = dateFns.format(date, 'MM')
  const day = dateFns.format(date, 'DD')
  const unix = date.getTime()

  const { _id: shiftId } = shift
  const s3PathName = `activity-reports/shifts/${applicationId}/${year}/${month}/${day}`
  const s3FileName = `${year}-${month}-${day}-shift-${shiftId}-summary-${unix}.pdf`
  return `${s3PathName}/${s3FileName}`
}
