import { startOfHour, subMinutes } from 'date-fns'

export async function getExpiredTimeouts({ ddb, table }) {
  // NOTE: we minus one minute so that we are able to
  // ensure that all timeouts raised within an hour
  // are processed as we move between hourly buckets
  const expiration = subMinutes(new Date(), 1)
  const hourBucket = startOfHour(expiration)

  const expiredTimeouts = await ddb
    .query({
      ExpressionAttributeNames: {
        '#B': 'bucket',
        '#E': 'expiration',
      },
      ExpressionAttributeValues: {
        ':b': hourBucket.toISOString(),
        ':e': expiration.toISOString(),
      },
      IndexName: 'BucketIndex',
      KeyConditionExpression: '#B = :b and #E <= :e',
      TableName: table,
    })
    .promise()

  return expiredTimeouts.Items
}

export default getExpiredTimeouts
