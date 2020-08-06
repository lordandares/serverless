import { isEmpty } from 'lodash/fp'

import { buildLocationSummaryPdf } from '../../helpers/build-location-summary-pdf'
import { getFormS3Paths } from '../../helpers/get-references'
import { getSummaryData } from '../../helpers/get-summary-data'

export async function setupDar(event) {
  const isJson = typeof event.body === 'string'
  const payload = isJson ? JSON.parse(event.body) : event

  const data = await getSummaryData(payload)

  const { audits, events, issues, tasks } = data
  const shouldSkip = isEmpty([...audits, ...events, ...issues, ...tasks])

  if (!shouldSkip) {
    const summaryS3Path = await buildLocationSummaryPdf(data)
    const formS3Paths = await getFormS3Paths(data)

    return { formS3Paths, skip: false, summaryS3Path }
  }

  return { skip: true }
}

export default setupDar
