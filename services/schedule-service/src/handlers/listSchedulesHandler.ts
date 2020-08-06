import { errors, http, schemas } from '@lighthouse/serverless-common'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { ScheduleService } from '../service/ScheduleService'

export async function listSchedulesHandler(
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  try {
    const { headers } = event

    if (!headers) {
      throw new errors.ApplicationError({
        message: 'ListSchedulesHandlers: missing headers on event',
      })
    }

    const applicationId: string = headers['lio-application-id']
    const schedules: schemas.SchedulePayloadSchema[] = await ScheduleService.listSchedules(
      {
        applicationId,
      },
    )

    return {
      body: JSON.stringify(schedules),
      statusCode: http.STATUS_CODES.SUCCESSFUL.OK,
    }
  } catch (err) {
    console.error('ListSchedulesError', {
      err,
      event,
    })

    return errors.httpErrorHandler(err)
  }
}
