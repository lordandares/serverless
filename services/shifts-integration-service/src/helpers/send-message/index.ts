import { getSnsPayload, validateEndpointAttributes } from '../'

interface SendMessageParams {
  message: string
  title: string
  type: string
}

export default async function sendMessage(
  client: AWS.SNS,
  endpoints: AWS.SNS.CreateEndpointResponse[],
  params: SendMessageParams,
): Promise<object[]> {
  const result = await Promise.all(
    endpoints.map(async endpoint => {
      const { EndpointArn: endpointArn } = endpoint

      await validateEndpointAttributes(client, endpointArn)

      const payload = getSnsPayload({ endpointArn, ...params })

      console.info('sending message', params)

      const result = await client.publish(payload).promise()

      console.info('sent message', result)
      return result
    }),
  )

  return result
}
