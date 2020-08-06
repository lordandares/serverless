import * as AWS from 'aws-sdk'
import * as BPromise from 'bluebird'
import { attempt, isError, isObject, map, trim, uniq } from 'lodash/fp'
import * as s3 from '../../s3'

const JPG_REGEX = /"([A-Za-z0-9-/])*\.(jpg|jpeg|png)"/gi // https://regexr.com/4fdak
const SPECIAL_CHARS_REGEX = /[^\w\d/.\-_]/gi // https://regexr.com/43iem

const s3Client = new AWS.S3()

interface S3Object {
  bucket: string
  key: string
}

export async function getPdfS3Paths(s3Object: S3Object) {
  const { bucket, key } = s3Object

  return s3
    .get(s3Client, {
      bucket,
      key,
    })
    .then(result => {
      const body = attempt(() => JSON.parse(result.Body))

      if (isError(body) || !isObject(body)) {
        return Promise.reject(new Error('Invalid S3 `Body` received'))
      }

      const values = findS3Resources(body)
      const count = values.length

      return {
        count,
        values,
      }
    })
}

export function findS3Resources(data) {
  const bucket = trim(process.env.S3_BUCKET_UPLOADS || '')

  if (!data || !bucket) {
    return []
  }

  const dataString = JSON.stringify(data)
  const matches = dataString.match(JPG_REGEX)
  const uniqueMatches = uniq(matches)

  return map((key: string) => {
    const trimmedKey = key.replace(SPECIAL_CHARS_REGEX, '')

    return {
      bucket,
      key: trimmedKey,
    }
  })(uniqueMatches)
}
