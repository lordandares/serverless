import { errors } from '@lighthouse/serverless-common'

import { ScheduleService } from '../service/ScheduleService'

interface DeleteOccurrencesHandler {
  scheduleId: string
}

export async function deleteOccurrencesHandler(
  event: DeleteOccurrencesHandler,
) {
  try {
    if (!event) {
      throw new errors.ApplicationError({
        message: 'DeleteOccurrencesHandler: missing event',
      })
    }

    const { scheduleId } = event
    const results = await ScheduleService.deleteOccurrences(scheduleId)

    return results
  } catch (err) {
    console.error('DeleteOccurrencesError', {
      err,
      event,
    })

    if (errors.isKnownError(err)) {
      throw err
    }

    throw new errors.UnknownError()
  }
}
