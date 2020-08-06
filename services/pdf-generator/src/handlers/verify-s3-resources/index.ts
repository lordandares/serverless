import * as AWS from 'aws-sdk'
import * as BPromise from 'bluebird'
import * as s3 from '../../s3'

const s3Client = new AWS.S3()

export async function verifyS3Resources(s3Resources) {
  return BPromise.map(s3Resources, resource => {
    return s3.exists(s3Client, resource).catch(err => {
      if (err.name === 'Forbidden') {
        const message = `Missing resource: ${resource.bucket}/${resource.key}`
        const error = new Error(message)
        error.name = 'MissingS3Resource'

        return BPromise.reject(error)
      }

      return BPromise.reject(err)
    })
  })
}
