import { errors, mongo, schemas } from '@lighthouse/serverless-common'
import { map } from 'lodash/fp'

import { notifyUser } from '../../helpers'

interface RejectShiftParams {
  errors: WinTeamShiftError[]
  shift: schemas.ShiftSchema
  user: schemas.UserSchema
}

interface WinTeamShiftError {
  AttemptedValue?: string
  ErrorMessage: string
  ErrorType: string
  FieldName?: string
}

export default async function rejectShiftHandler(params: RejectShiftParams) {
  const { errors: shiftErrors, shift, user } = params

  const shiftId = shift && shift._id

  if (!shiftId) {
    throw new errors.ResourceNotFoundError({
      id: shiftId,
      resource: 'shift',
    })
  }

  const collection = await mongo.getCollection('shifts')

  const doc = await collection.findOneAndUpdate(
    { _id: new mongo.ObjectId(shiftId) },
    {
      $set: {
        end: {
          time: new Date(),
        },
        status: 'rejected',
        verificationErrors: formatShiftErrors(shiftErrors),
      },
    },
    { returnOriginal: false },
  )

  const notification = {
    message: 'Unable to start shift. Open Lighthouse for details',
    title: 'Shift rejected',
    type: 'shift-rejected',
    user,
  }

  await notifyUser(notification)

  return {
    ...params,
    shift: doc.value,
  }
}

export function formatShiftErrors(errors: WinTeamShiftError[]) {
  return map((error: WinTeamShiftError) => ({
    attemptedValue: error.AttemptedValue,
    errorMessage: error.ErrorMessage,
    errorType: error.ErrorType,
    field: error.FieldName,
  }))(errors)
}
