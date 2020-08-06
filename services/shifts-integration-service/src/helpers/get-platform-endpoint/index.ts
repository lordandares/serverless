interface DeviceReceiver {
  deviceToken: string
  platform: string
}

export default async function getPlatformEndpoint(
  client: AWS.SNS,
  receiver: DeviceReceiver,
): Promise<AWS.SNS.CreateEndpointResponse | void> {
  const platformConfig = {
    android: {
      arn: process.env.AWS_SNS_ANDROID_ARN,
      service: process.env.AWS_SNS_ANDROID_SERVICE,
    },
    ios: {
      arn: process.env.AWS_SNS_IOS_ARN,
      service: process.env.AWS_SNS_IOS_SERVICE,
    },
  }

  const { deviceToken, platform } = receiver

  if (!deviceToken || !platform) return

  const config = platformConfig[platform]

  const params = {
    PlatformApplicationArn: config.arn,
    Token: deviceToken,
  }

  const endpoint = await client.createPlatformEndpoint(params).promise()

  return endpoint
}
