import { DynamoDB } from 'aws-sdk'
import { getOr } from 'lodash/fp'

declare var process: ITimeoutServiceProcess

export async function deleteTimeout(event, context, callback) {
  const config = { apiVersion: '2012-08-10' }
  const ddb = new DynamoDB.DocumentClient(config)

  const message = getOr('{}', 'Records.0.Sns.Message', event)
  const payload = JSON.parse(message)
  const id = payload.id
  const table = process.env.TABLE_TIMEOUTS

  try {
    const params = { Key: { id }, TableName: table }
    const results = await ddb.delete(params).promise()
    callback(null, results)
  } catch (err) {
    callback(err)
  }
}

export default deleteTimeout
