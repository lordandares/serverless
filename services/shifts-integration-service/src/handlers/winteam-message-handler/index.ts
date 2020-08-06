import { errors, mongo } from '@lighthouse/serverless-common'
import { ShiftMessageSchema } from '@lighthouse/serverless-common/dist/schemas/types'
import { winteam } from '@lighthouse/serverless-integrations'
import { SNSEvent } from 'aws-lambda'
import { attempt, find, getOr, isEmpty, isError, toString } from 'lodash/fp'
import { getEmployeeReference } from '../../helpers/get-winteam-time-punch'

const { getCollection, ObjectId } = mongo

interface ShiftResponseMessage {
  _id: string
  application: string
  event: string
  module: string
  messageId: number
}

const endpoints = {
  message: '/WinTeam/TimePunch/v1/api/PunchMessageResponse',
}

export default async function messageHandler(event: SNSEvent) {
  const message = getOr(null, 'Records.0.Sns.Message', event)

  if (!message) {
    throw new errors.ApplicationError({
      message: 'ShiftError - message could not be read',
      data: {
        message,
      },
    })
  }

  const parsedMessage: ShiftResponseMessage = attempt(() => JSON.parse(message))

  if (isError(parsedMessage)) {
    throw new errors.ApplicationError({
      message: 'ShiftError - message could not be parsed',
      data: {
        message,
      },
    })
  }

  const { _id, application, event: eventName, messageId } = parsedMessage

  const endpoint = endpoints[eventName]

  if (!endpoint) {
    throw new errors.ApplicationError({
      message: 'ShiftError - Could not find endpoint for event',
      data: {
        endpoint,
        eventName,
      },
    })
  }

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

  const winteamEnabled = getOr(
    false,
    'plugins.winteam.enabled',
    shiftApplication,
  )

  if (!winteamEnabled) {
    return
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

  const { user } = shift

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

  const messageRespondedTo = find<ShiftMessageSchema>(
    message => message._id.toString() === messageId.toString(),
    shift.messages,
  )
  if (!messageRespondedTo) {
    throw new errors.ApplicationError({
      message: 'ShiftError - could not find message',
      data: {
        applicationId,
        messageRespondedTo,
        shift,
        user,
      },
    })
  }

  console.info('messageRespondedTo', messageRespondedTo)

  const payload = {
    ...getEmployeeReference(applicationUser),
    DateRead: messageRespondedTo.responseTime,
    Id: messageRespondedTo.messageId,
    Message: messageRespondedTo.message,
    Response: messageRespondedTo.responseText,
  }

  console.info('payload', payload)

  const result = await winteam.request(shiftApplication, {
    endpoint,
    message: payload,
    method: 'POST',
  })

  console.info('result', result)

  return result
}
