interface Options {
  bucket: string
  key: string
}

export default function getS3File(s3, options: Options) {
  if (!s3) {
    return Promise.reject(new Error('Missing `s3` argument'))
  }

  const { bucket, key } = options

  if (!bucket || !key) {
    console.error('Invalid arguments for getS3File', { options })
    return Promise.reject(new Error('Invalid getS3File options'))
  }

  return s3
    .getObject({
      Bucket: bucket,
      Key: key,
    })
    .promise()
    .catch(err => {
      console.error('Error getting S3 file', { err })
      return Promise.reject(err)
    })
}
