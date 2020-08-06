import { getOr, isEmpty } from 'lodash/fp'
import { errors, schemas } from '@lighthouse/serverless-common'
import { winteam } from '@lighthouse/serverless-integrations'
import { getWinTeamTimePunch } from '../../helpers/'

interface WinteamShiftParams {
  application: schemas.ApplicationSchema
  event: string
  shift: schemas.ShiftSchema
  user: schemas.UserSchema
}

const endpoints = {
  'shift-break-end': '/WinTeam/TimePunch/v1/api/TimePunch/EndBreak',
  'shift-break-start': '/WinTeam/TimePunch/v1/api/TimePunch/StartBreak',
  'shift-end': '/WinTeam/TimePunch/v1/api/TimePunch/EndShift',
  'shift-start': '/WinTeam/TimePunch/v1/api/TimePunch/StartShift',
}

export default async function winteamShiftHandler(params: WinteamShiftParams) {
  const { application, event, shift, user } = params

  const winteamEnabled = getOr(false, 'plugins.winteam.enabled', application)

  if (!winteamEnabled) return

  const endpoint = endpoints[event]

  if (!endpoint) {
    throw new errors.ApplicationError({
      message: 'WinteamShiftError: Could not find endpoint for event',
      data: {
        endpoint,
        event,
      },
    })
  }

  const message = await getWinTeamTimePunch({
    event,
    shift,
    user,
  })

  if (!message) {
    return
  }

  console.info('WinTeamShiftHandler:: sending message to WT', message)

  const response = await winteam.request(application, {
    endpoint,
    message,
    method: 'POST',
  })

  const { Errors: responseErrors, Result: result } = response
  // NOTE: hasError is required as a boolean for the step function

  return {
    ...params,
    hasErrors: !isEmpty(responseErrors),
    errors: responseErrors,
    result,
  }
}
