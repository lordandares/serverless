import { errors, mongo, schemas } from '@lighthouse/serverless-common'
import { getOr, last } from 'lodash/fp'
import * as moment from 'moment-timezone'
import * as querystring from 'querystring'

// 2018-08-03 16:00:00.000-0400
const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss.SSSZZ'

interface TimePunchEvent extends TimePunch {
  event: string
}

interface TimePunch {
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

interface TimePunchResponse {
  GeoCoordinate?: {
    Latitude: number
    Longitude: number
  }
  EmployeeId?: string
  EmployeeNumber?: string
  JobId?: string
  JobNumber?: string
  PunchTime: string
}

export async function getWinTeamTimePunch(
  timePunchEvent: TimePunchEvent,
): Promise<TimePunchResponse | void> {
  const { event, shift, user } = timePunchEvent
  const { application: applicationId, location: locationId } = shift

  if (!event) {
    throw new errors.ValidationError({
      message: 'Missing event from TimePunch',
    })
  }

  const employeeReference = getEmployeeReference(user)

  if (!employeeReference) {
    console.info('GetWinTeamTimePunch :: Missing Employee Reference', {
      shift,
      user,
    })

    return
  }

  const shiftEntity = getShiftEntity(shift, event)
  const shiftTimestamp = getOr(false, 'time', shiftEntity)

  if (!shiftTimestamp) {
    throw new errors.ValidationError({
      message: 'Missing timestamp from TimePunch',
      data: {
        shiftEntity,
        shiftTimestamp,
      },
    })
  }

  const jobReference = await getJobReference(
    shiftEntity,
    applicationId,
    locationId,
  )

  const punchTime = moment.utc(shiftTimestamp).format(DATE_FORMAT)

  const payload: TimePunchResponse = {
    ...employeeReference,
    ...jobReference,
    PunchTime: punchTime,
  }

  // Append GeoCoordinates if they exist
  const gpsCoordinates = getOr([], 'gps.geometry.coordinates', shiftEntity)

  if (gpsCoordinates && gpsCoordinates.length === 2) {
    payload.GeoCoordinate = {
      Latitude: gpsCoordinates[1],
      Longitude: gpsCoordinates[0],
    }
  }

  return payload
}

export async function getWinTeamMessages(
  timePunch: TimePunch,
): Promise<string | undefined> {
  const { result, shift, user } = timePunch

  const { JobNumber } = result

  const employeeReference = getEmployeeReference(user)
  if (!employeeReference) {
    console.info('GetWinTeamMessages :: Missing Employee Reference', {
      shift,
      user,
    })

    return
  }

  if (!JobNumber) {
    console.info('GetWinTeamMessages :: Missing Job Reference', {
      result,
      shift,
      user,
    })

    return
  }

  const punchTime = moment.utc(shift.start.time).format(DATE_FORMAT)

  const params = {
    ...employeeReference,
    JobNumber,
    PunchTime: punchTime,
  }

  return querystring.stringify(params)
}

export function getEmployeeReference(user: schemas.UserSchema): object | void {
  const employeeId = getOr(false, 'plugins.winteam.options.employeeId', user)
  const employeeNumber = getOr(
    false,
    'plugins.winteam.options.employeeNumber',
    user,
  )

  if (employeeId || employeeNumber) {
    return { EmployeeNumber: employeeId || employeeNumber }
  }
}

export async function getJobReference(
  shiftEntity: schemas.ShiftEventSchema,
  applicationId: string,
  locationId?: string,
): Promise<object | void> {
  const areaLocationId = getOr(false, 'area.location.id', shiftEntity)

  // If within an area location / legacy location, attempt to find the job number
  if (areaLocationId || locationId) {
    const isLegacy = !areaLocationId

    const collectionName = isLegacy ? 'locations' : 'areas'

    const queryLocationId = isLegacy ? locationId : areaLocationId
    const query = {
      _id: new mongo.ObjectId(queryLocationId),
      application: new mongo.ObjectId(applicationId),
    }

    const collection = await mongo.getCollection(collectionName)
    const location = await collection.findOne(query)

    if (location) {
      const jobId = getOr(false, 'plugins.winteam.options.jobId', location)
      const jobNumber = getOr(
        false,
        'plugins.winteam.options.jobNumber',
        location,
      )

      if (jobId || jobNumber) {
        return { JobNumber: jobId || jobNumber }
      }
    }
  }
}

export function getShiftEntity(
  shift: schemas.ShiftSchema,
  event: string,
): object | void {
  switch (event) {
    case 'shift-break-end':
      return last<schemas.ShiftBreakSchema>(shift.breaks)!.end
    case 'shift-end':
      return shift.end
    case 'shift-break-start':
      return last<schemas.ShiftBreakSchema>(shift.breaks)!.start
    case 'shift-start':
      return shift.start
    default:
      return {}
  }
}
