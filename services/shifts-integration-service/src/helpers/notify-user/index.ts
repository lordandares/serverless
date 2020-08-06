import { errors, schemas } from '@lighthouse/serverless-common'
import * as AWS from 'aws-sdk'
import { getOr, isEmpty } from 'lodash/fp'

import { getPlatformEndpoint, sendMessage } from '../'

interface NotifyUserParams {
  message: string
  user: schemas.UserSchema
}

export default async function notifyUser(
  params: NotifyUserParams,
): Promise<void> {
  const { message, user } = params

  if (!message || !user) {
    throw new errors.ValidationError({
      data: {
        message,
        user,
      },
      message: 'notifyUser :: Missing required params',
    })
  }

  const deviceReceivers = getOr([], 'speakerbox.deviceReceivers', user)

  if (isEmpty(deviceReceivers)) return

  const sns = new AWS.SNS()

  const endpoints: AWS.SNS.CreateEndpointResponse[] = await Promise.all(
    deviceReceivers.map(
      async receiver => await getPlatformEndpoint(sns, receiver),
    ),
  )

  await sendMessage(sns, endpoints, params)
}
