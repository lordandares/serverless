import { buildAuditPdf, buildIssuePdf, buildTaskPdf } from '@lighthouse/common'

interface PdfData {
  entity: object
  locations?: object
  timezone: string
  users?: object
  zones?: object
}

interface Options {
  cloudinaryBaseUrl: string
  logoUrl?: string
  pageSize: string
  s3BaseUrl: string
  type: string
}

const buildMap = {
  audit: buildAuditPdf,
  issue: buildIssuePdf,
  task: buildTaskPdf,
}

export default function buildPdfDefinition(pdfData: PdfData, options: Options) {
  const { entity, locations, timezone, users, zones } = pdfData

  const { cloudinaryBaseUrl, pageSize, logoUrl, s3BaseUrl, type } = options

  const buildFn = buildMap[type]

  if (!buildFn) {
    return Promise.reject(
      new Error(`Invalid type:${type} value supplied to buildPdfDefinition`),
    )
  }

  const pdfOptions = {
    logoUrl,
    pageSize,
  }

  const data = {
    entity,
    locations,
    settings: {
      awsS3BaseUrl: s3BaseUrl,
      cloudinaryBaseUrl,
    },
    timezone,
    users,
    zones,
  }

  return buildFn(pdfOptions, data)
}
