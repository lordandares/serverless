import { attempt, getOr, isError, isEmpty, toString } from 'lodash/fp'
import { errors, mongo } from '@lighthouse/serverless-common'
import { SNSEvent } from 'aws-lambda'
import * as AWS from 'aws-sdk'

const { getCollection, ObjectId } = mongo

interface ShiftMessage {
  _id: string
  application: string
  event: string
  module: string
}

interface ShiftResponse {
  application: object
  event: string
  shift: object
  user: object
}

export default async function shiftHandler(event: SNSEvent) {
  const stateMachineArn = process.env.INTEGRATION_STATE_MACHINE_ARN

  if (!stateMachineArn) {
    throw new errors.ApplicationError({
      message: 'ShiftError - INTEGRATION_STATE_MACHINE_ARN is missing',
    })
  }

  const message = getOr(null, 'Records.0.Sns.Message', event)

  if (!message) {
    throw new errors.ApplicationError({
      message: 'ShiftError - message could not be read',
      data: {
        message,
      },
    })
  }

  const parsedMessage: ShiftMessage = attempt(() => JSON.parse(message))

  if (isError(parsedMessage)) {
    throw new errors.ApplicationError({
      message: 'ShiftError - message could not be parsed',
      data: {
        message,
      },
    })
  }

  const { _id, application, event: eventName } = parsedMessage

  /**
   * NOTE: Copying mongoose behaviour here - All ObjectIds are first cast to a string
   * https://github.com/Automattic/mongoose/blob/884306c759a0b191d3344fee7f6f0d9f35394315/lib/schema/objectid.js#L56
   */
  const applicationIdString = toString(application)
  const idString = toString(_id)

  const applicationId = new ObjectId(applicationIdString)
  const shiftId = new ObjectId(idString)

  const applicationCollection = await getCollection('applications')

  const shiftApplication = await applicationCollection.findOne({
    _id: applicationId,
  })

  if (isEmpty(shiftApplication)) {
    throw new errors.ApplicationError({
      message: 'ShiftError - could not find application',
      data: {
        applicationId,
      },
    })
  }

  const shiftCollection = await getCollection('shifts')
  const shift = await shiftCollection.findOne({
    _id: shiftId,
    application: applicationId,
  })

  if (isEmpty(shift)) {
    throw new errors.ApplicationError({
      message: 'ShiftError - could not find shift',
    })
  }

  const user = getOr(false, 'user', shift)

  if (!user) {
    throw new errors.ApplicationError({
      message: 'ShiftError - user missing from shift entry',
    })
  }

  const applicationUserCollection = await getCollection('applicationusers')
  const applicationUser = await applicationUserCollection.findOne({
    application: applicationId,
    user: ObjectId(user),
  })

  if (isEmpty(applicationUser)) {
    throw new errors.ApplicationError({
      message: 'ShiftError - could not find application user',
      data: {
        applicationId,
        user,
      },
    })
  }

  const eventType = `shift-${eventName}`

  const wtApplicationEnabled = getOr(
    false,
    'plugins.winteam.enabled',
    shiftApplication,
  )
  const wtUserEnabled = getOr(false, 'plugins.winteam.enabled', applicationUser)

  const request = {
    input: JSON.stringify({
      application: shiftApplication,
      event: eventType,
      plugins: {
        winteamEnabled: wtApplicationEnabled && wtUserEnabled,
      },
      shift,
      user: applicationUser,
    }),
    name: `${applicationUser._id}-${eventType}-${new Date().getTime()}`,
    stateMachineArn,
  }

  return new AWS.StepFunctions().startExecution(request).promise()
}
