import { CloudWatch, DynamoDB, SNS } from 'aws-sdk'

import {
  getExpiredTimeouts,
  getTimeoutResourcesMap,
  sendTimeoutNotifications,
} from '../../helpers'

declare var process: ITimeoutServiceProcess

export async function jobTimeoutsProcessExpired(event, context, callback) {
  const config = { apiVersion: '2012-08-10' }

  const cw = new CloudWatch(config)
  const ddb = new DynamoDB.DocumentClient(config)
  const sns = new SNS(config)

  try {
    const resourceMap = await getTimeoutResourcesMap({
      ddb,
      table: process.env.TABLE_TIMEOUT_RESOURCES,
    })
    const timeouts = await getExpiredTimeouts({
      ddb,
      table: process.env.TABLE_TIMEOUTS,
    })

    const batchCount = timeouts.length
    const functionName = context.functionName
    await sendBatchCountMetric({ batchCount, cw, functionName })

    const snsResponses = await sendTimeoutNotifications({
      sns,
      timeouts,
      resourceMap,
    })
    callback(null, snsResponses)
  } catch (err) {
    callback(err)
  }
}

async function sendBatchCountMetric({ batchCount, cw, functionName }) {
  const metric = {
    MetricData: [
      {
        Dimensions: [
          {
            Name: 'Lambda',
            Value: functionName,
          },
        ],
        MetricName: 'BatchCount',
        Unit: 'Count',
        Value: batchCount,
      },
    ],
    Namespace: 'TimeoutService',
  }

  await cw.putMetricData(metric).promise()
}

export default jobTimeoutsProcessExpired
