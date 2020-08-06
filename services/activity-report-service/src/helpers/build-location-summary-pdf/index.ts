import { buildActivityPdf } from '@lighthouse/common'
import * as dateFns from 'date-fns'

import { buildConfig, createSummaryPdf } from '../create-summary-pdf'

export async function buildLocationSummaryPdf(data) {
  const config = buildConfig(data)
  const { data: summaryData, pdfOptions } = config

  const pdfDefinition = await buildActivityPdf(pdfOptions, summaryData)
  const s3FullPath = getLocationSummaryPdfPath(data)
  await createSummaryPdf(pdfDefinition, s3FullPath)

  return s3FullPath
}

function getLocationSummaryPdfPath({ location }) {
  const date = new Date()
  const year = dateFns.format(date, 'YYYY')
  const month = dateFns.format(date, 'MM')
  const day = dateFns.format(date, 'DD')
  const unix = date.getTime()

  const { _id: locationId } = location
  const s3PathName = `activity-reports/${locationId}/${year}/${month}`
  const s3FileName = `${year}-${month}-${day}-summary-${unix}.pdf`
  return `${s3PathName}/${s3FileName}`
}
