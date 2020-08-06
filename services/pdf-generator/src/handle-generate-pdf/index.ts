import * as AWS from 'aws-sdk'
import * as dateFns from 'date-fns'
import { attempt, isEmpty, isError, isObject, map } from 'lodash/fp'
import buildPdfDefinition from '../build-pdf-definition'
import getPdfBuffer from '../get-pdf-buffer'
import * as s3 from '../s3'

const s3Client = new AWS.S3()

interface S3Object {
  bucket: string
  key: string
}

interface Options {
  cloudinaryBaseUrl: string
  logoUrl?: string
  pageSize: string
  s3BaseUrl: string
  s3Bucket: string
}

interface PdfBody {
  data: any
  filename: string
  options: Options
  type: string
}

interface S3Data {
  Body: string
}

export default function handleGeneratePdf(
  s3Object: S3Object,
  options: Options,
) {
  const { bucket, key } = s3Object
  const { cloudinaryBaseUrl, pageSize, s3BaseUrl, s3Bucket } = options

  return s3
    .get(s3Client, {
      bucket,
      key,
    })
    .then(result => {
      const body: PdfBody | Error = attempt(() => JSON.parse(result.Body))

      if (isError(body) || !isObject(body)) {
        return Promise.reject(new Error('Invalid S3 `Body` received'))
      }

      const { data, filename, options: pdfOptions, type } = body

      if (!filename) {
        return Promise.reject(
          new Error('Missing `filename` supplied to handleGeneratePdf'),
        )
      }

      if (!type) {
        return Promise.reject(
          new Error('Missing `type` supplied to handleGeneratePdf'),
        )
      }

      if (isEmpty(data.entity)) {
        return Promise.reject(
          new Error('Invalid `data` supplied to handleGeneratePdf'),
        )
      }

      const { _id: entityId, application: applicationId } = data.entity

      const now = new Date()
      const dateBucket = dateFns.format(now, 'YYYY-MM-DD')
      const unix = now.getTime()
      const objectKey = `${applicationId}/pdfs/${dateBucket}/${unix}-${type}-${entityId}.pdf`
      const logoUrl = pdfOptions && pdfOptions.logoUrl

      console.info('handle-generate-pdf', {
        filename,
        type,
      })

      return buildPdfDefinition(data, {
        cloudinaryBaseUrl,
        logoUrl,
        pageSize,
        s3BaseUrl,
        type,
      })
        .then(docDefinition => getPdfBuffer(docDefinition))
        .then(buffer =>
          s3.put(s3Client, {
            bucket: s3Bucket,
            buffer,
            contentDisposition: 'inline',
            contentType: 'application/pdf',
            key: objectKey,
          }),
        )
        .then(url => ({
          applicationId,
          entityId,
          filename,
          key: objectKey,
          type,
          url,
        }))
        .catch(err => {
          console.error('Error generating pdf', { err })
          return Promise.reject(err)
        })
    })
}
