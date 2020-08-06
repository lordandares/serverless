import { errors, http, schemas } from '@lighthouse/serverless-common'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { ScheduleService } from '../service/ScheduleService'

export async function getScheduleHandler(
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  try {
    const { headers, pathParameters } = event

    if (!headers) {
      throw new errors.ApplicationError({
        message: 'GetScheduleHandler: missing headers on event',
      })
    }

    if (!pathParameters) {
      throw new errors.ApplicationError({
        message: 'GetScheduleHandler: missing pathParameters on event',
      })
    }

    const applicationId: string = headers['lio-application-id']
    const scheduleId: string = pathParameters.id

    const schedule: schemas.SchedulePayloadSchema = await ScheduleService.getSchedule(
      {
        applicationId,
        scheduleId,
      },
    )

    return {
      body: JSON.stringify(schedule),
      statusCode: http.STATUS_CODES.SUCCESSFUL.OK,
    }
  } catch (err) {
    console.error('GetScheduleError', {
      err,
      event,
    })

    return errors.httpErrorHandler(err)
  }
}
