import * as AWS from 'aws-sdk'
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

export async function mergeReportPdfs(event) {
  const isJson = typeof event.body === 'string'
  const payload = isJson ? JSON.parse(event.body) : event

  const {
    pdfs: { pdfsToMerge, mergedS3Path },
  } = payload

  try {
    const s3Client = new AWS.S3()
    const directoryPath = `/tmp/${uuid.v4()}`

    console.info(`creating directory path ${directoryPath}`)
    await fse.mkdirp(directoryPath)

    console.info('downloading files')
    const filePaths = await downloadFiles(s3Client, pdfsToMerge, directoryPath)

    console.info('concatenating pdfs')
    const filePath = await concatPdfs(filePaths, directoryPath)

    const s3Bucket = process.env.S3_BUCKET_UPLOADS

    console.info('reading merged pdf')
    const buffer = await fse.readFile(filePath)

    console.info('uploading report to s3')
    await s3.put(s3Client, {
      bucket: s3Bucket,
      buffer,
      contentDisposition: 'inline',
      contentType: 'application/pdf',
      key: mergedS3Path,
    })

    console.info(`removing files folder ${directoryPath}`)
    await fse.remove(directoryPath)

    return mergedS3Path
  } catch (err) {
    console.error('MergeReportPdfsError', {
      err,
      payload,
    })

    throw err
  }
}

export default mergeReportPdfs
