interface GetOptions {
  bucket: string
  key: string
}

interface PutOptions {
  buffer: string
  bucket: string
  contentDisposition: string
  contentType: string
  key: string
}

export { exists, get, put }

function exists(s3Client, { bucket, key }: GetOptions) {
  console.info('s3-object-exists-request', {
    bucket,
    key,
  })

  return s3Client
    .headObject({
      Bucket: bucket,
      Key: key,
    })
    .promise()
}

function get(s3Client, { bucket, key }: GetOptions) {
  console.info('s3-get-request', {
    bucket,
    key,
  })

  return s3Client
    .getObject({
      Bucket: bucket,
      Key: key,
    })
    .promise()
}

function put(
  s3Client,
  { buffer, bucket, key, contentType, contentDisposition }: PutOptions,
) {
  const params = {
    Body: Buffer.from(buffer),
    Bucket: bucket,
    ContentDisposition: contentDisposition,
    ContentType: contentType,
    Key: key,
  }

  console.info('s3-put-request', {
    bucket,
    key,
  })

  return s3Client
    .putObject(params)
    .promise()
    .then(() => `https://${bucket}.s3.amazonaws.com/${key}`)
}
