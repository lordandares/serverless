import * as BPromise from 'bluebird'
import * as fse from 'fs-extra'
import * as uuid from 'node-uuid'

import * as s3 from '../s3'

interface Env {
  env: {
    S3_BUCKET_UPLOADS: string
  }
}

declare var process: Env

export async function downloadFiles(s3Client, references, directoryPath) {
  const s3Bucket = process.env.S3_BUCKET_UPLOADS

  const filePaths = BPromise.map(references, async reference => {
    const data = await s3.get(s3Client, {
      bucket: s3Bucket,
      key: reference,
    })

    const buffer = data.Body
    const filePath = `${directoryPath}/${uuid.v4()}.pdf`
    await fse.writeFile(filePath, buffer)

    return filePath
  })

  return filePaths
}
