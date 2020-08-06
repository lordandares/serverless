import { errors, http } from '@lighthouse/serverless-common'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { ScheduleService } from '../service/ScheduleService'

export async function deleteScheduleHandler(
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  try {
    const { headers, pathParameters } = event
    if (!headers) {
      throw new errors.ApplicationError({
        message: 'DeleteOccurrencesHandler: missing headers on event',
      })
    }

    if (!pathParameters) {
      throw new errors.ApplicationError({
        message: 'DeleteOccurrencesHandler: missing pathParameters on event',
      })
    }

    const applicationId: string = headers['lio-application-id']
    const scheduleId: string = pathParameters.id

    await ScheduleService.removeSchedule({ applicationId, scheduleId })

    return {
      statusCode: http.STATUS_CODES.SUCCESSFUL.NO_CONTENT,
      body: '',
    }
  } catch (err) {
    console.error('DeleteScheduleError', {
      err,
      event,
    })

    return errors.httpErrorHandler(err)
  }
}
