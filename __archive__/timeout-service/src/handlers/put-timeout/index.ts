import { DynamoDB } from 'aws-sdk'
import { getOr } from 'lodash/fp'

import { validateTimeout } from '../../helpers'

declare var process: ITimeoutServiceProcess

export async function putTimeout(event, context, callback) {
  const config = { apiVersion: '2012-08-10' }
  const ddb = new DynamoDB.DocumentClient(config)

  const message = getOr('{}', 'Records.0.Sns.Message', event)
  const payload = JSON.parse(message)
  const table = process.env.TABLE_TIMEOUTS

  try {
    validateTimeout(payload)
    const params = { Item: payload, TableName: table }
    const results = await ddb.put(params).promise()
    callback(null, results)
  } catch (err) {
    callback(err)
  }
}

export default putTimeout
