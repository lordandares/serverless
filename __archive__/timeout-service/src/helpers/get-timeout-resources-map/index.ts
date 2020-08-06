import { keyBy } from 'lodash/fp'

export async function getTimeoutResourcesMap({ ddb, table }) {
  const timeoutResources = await ddb.scan({ TableName: table }).promise()

  const resourceLookupMap = keyBy(item => item.id, timeoutResources.Items)

  return resourceLookupMap
}

export default getTimeoutResourcesMap
