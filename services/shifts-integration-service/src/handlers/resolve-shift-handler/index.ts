import { errors, mongo, schemas } from '@lighthouse/serverless-common'
import { winteam } from '@lighthouse/serverless-integrations'
import { includes, isEmpty } from 'lodash/fp'

import { getWinTeamMessages } from '../../helpers/get-winteam-time-punch'
import { notifyUser, parseWinTeamMessages } from '../../helpers'

interface ResolveShiftParams {
  application: schemas.ApplicationSchema
  event: string
  result: {
    CallLogId: string
    HoursLogID?: string
    JobDescription: string
    JobID?: string
    JobNumber?: string
    PunchStatus: string
    PunchTime: string
    StatusReason?: string
  }
  shift: schemas.ShiftSchema
  user: schemas.UserSchema
}

interface ResolvedShift {
  status: string
  messages: schemas.ShiftMessageSchema[]
}

export default async function resolveShiftHandler(params: ResolveShiftParams) {
  const { application, result, shift, user } = params

  const shiftId = shift._id

  if (!shiftId) {
    throw new errors.ResourceNotFoundError({
      id: shiftId,
      resource: 'shift',
    })
  }

  const updatedShift: ResolvedShift = {
    messages: [],
    status: 'resolved',
  }

  try {
    const queryString = await getWinTeamMessages({ result, shift, user })

    console.info(`🚧 WT Querystring ${shift._id}`, queryString)

    if (queryString) {
      const endpoint = `/WinTeam/TimePunch/v1/api/PunchMessage?${queryString}`

      const winteamResponse = await winteam.request(application, {
        endpoint,
        method: 'GET',
      })

      console.info(`📡 Fetched WT Messages ${shift._id}`, winteamResponse)

      const mappedMessages = parseWinTeamMessages(winteamResponse)

      console.info('mappedMessages', mappedMessages)

      updatedShift.messages.push(...mappedMessages)
    }
  } catch (err) {
    console.error('🔴 Error fetching WinTeam messages', {
      err,
    })
  }

  console.info(`✅ Resolving shift ${shift._id}`, updatedShift)

  const collection = await mongo.getCollection('shifts')

  const doc = await collection.findOneAndUpdate(
    { _id: new mongo.ObjectId(shiftId) },
    {
      $set: updatedShift,
    },
    // Return updated shift
    { returnOriginal: false },
  )

  const hasShiftStartMessages = getStartShiftMessages(doc.value.messages)

  if (!isEmpty(hasShiftStartMessages)) {
    const notification = {
      message: 'Compliance Message(s) received.  Open Lighthouse for details',
      title: 'Compliance Message',
      type: 'shift-resolved-with-messages',
      user,
    }

    await notifyUser(notification)
  }

  return {
    ...params,
    shift: doc.value,
  }
}

export function getStartShiftMessages(
  messages: schemas.ShiftMessageSchema[],
): schemas.ShiftMessageSchema[] {
  if (!messages) return []

  return messages.filter(message => {
    const { isGlobal, punchActionId } = message

    const isStartShiftType = includes(punchActionId)([1, 3, 5])

    return isGlobal || isStartShiftType
  })
}
