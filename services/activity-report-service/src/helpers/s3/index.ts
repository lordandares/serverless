interface IGetOptions {
  bucket: string
  key: string
}

interface IListObjectsOptions {
  bucket: string
  delimiter: string
  prefix: string
}

interface IPutOptions {
  buffer: ArrayBuffer
  bucket: string
  contentDisposition: string
  contentType: string
  key: string
}

export function get(s3Client, { bucket, key }: IGetOptions) {
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

export function listObjects(
  s3Client,
  { bucket, delimiter, prefix }: IListObjectsOptions,
) {
  const params = {
    Bucket: bucket,
    Delimiter: delimiter,
    Prefix: prefix,
  }

  return s3Client.listObjects(params).promise()
}

export function put(
  s3Client,
  { buffer, bucket, key, contentType, contentDisposition }: IPutOptions,
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
