import * as AWS from 'aws-sdk'
import * as dateFns from 'date-fns'
import * as fse from 'fs-extra'
import * as uuid from 'node-uuid'

import { concatPdfs } from '../../helpers/concat-pdfs'
import { downloadFiles } from '../../helpers/download-files'
import * as s3 from '../../helpers/s3'

interface Env {
  env: {
    S3_BUCKET_UPLOADS: string
  }
}

declare var process: Env

export async function mergePdfs(event) {
  const isJson = typeof event.body === 'string'
  const payload = isJson ? JSON.parse(event.body) : event

  const { locationId, pdfs = {} } = payload
  const { formS3Paths = [], summaryS3Path } = pdfs

  const s3Client = new AWS.S3()
  const directoryPath = `/tmp/${uuid.v4()}`

  console.info(`creating directory path ${directoryPath}`)
  const directory = await fse.mkdirp(directoryPath)

  const filePaths = await downloadFiles(
    s3Client,
    [summaryS3Path, ...formS3Paths],
    directoryPath,
  )

  const filePath = await concatPdfs(filePaths, directoryPath)

  const date = new Date()
  const year = dateFns.format(date, 'YYYY')
  const month = dateFns.format(date, 'MM')
  const day = dateFns.format(date, 'DD')
  const unix = date.getTime()

  const s3PathName = `activity-reports/${locationId}/${year}/${month}`
  const s3FileName = `${year}-${month}-${day}-summary-and-forms-${unix}.pdf`

  const s3Bucket = process.env.S3_BUCKET_UPLOADS
  const s3Key = `${s3PathName}/${s3FileName}`

  const buffer = await fse.readFile(filePath)

  console.info('uploading location report to s3')
  await s3.put(s3Client, {
    bucket: s3Bucket,
    buffer,
    contentDisposition: 'inline',
    contentType: 'application/pdf',
    key: s3Key,
  })
  console.info('uploaded location report to s3')

  console.info(`removing files folder ${directoryPath}`)
  await fse.remove(directoryPath)
  console.info(`removed files folder`)

  return s3Key
}

export default mergePdfs
