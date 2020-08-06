export default async function validateEndpointAttributes(
  client: AWS.SNS,
  arn: string,
): Promise<void> {
  const { Attributes } = await client
    .getEndpointAttributes({
      EndpointArn: arn,
    })
    .promise()

  const isEnabled = Attributes && Attributes.Enabled === 'true'

  if (isEnabled) return

  await client
    .setEndpointAttributes({
      EndpointArn: arn,
      Attributes: {
        ...Attributes,
        Enabled: 'true',
      },
    })
    .promise()
}
