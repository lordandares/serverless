import { scheduling } from '@lighthouse/common'
import { errors, mongo, schemas } from '@lighthouse/serverless-common'
import { SNS, StepFunctions } from 'aws-sdk'
import { DocumentClient as DC } from 'aws-sdk/clients/dynamodb'
import * as BPromise from 'bluebird'
import {
  filter,
  first,
  get,
  isEmpty,
  map,
  toString,
  uniq,
  without,
} from 'lodash'
import * as moment from 'moment'
import { v4 as uuid } from 'uuid'

import { OCCURRENCE_STATUS_PENDING } from '../constants'
import { DynamoRepository } from '../repository/dynamo'
import {
  documentToSchedulePayload,
  payloadToScheduleDocument,
} from '../service/lib/transform'

declare var process: {
  env: {
    CREATE_SCHEDULE_STEP_FUNCTION: string
    OCCURRENCE_EXPIRED_ARN: string
    TABLE_SCHEDULES: string
    UPDATE_SCHEDULE_STEP_FUNCTION: string
  }
}

interface Document {
  pk: string
  sk: string
}

interface CreateSchedule {
  applicationId: string
  body: schemas.SchedulePayloadSchema
  userId: string
}

const createSchedule = async ({
  applicationId,
  body,
  userId,
}: CreateSchedule): Promise<schemas.SchedulePayloadSchema> => {
  const table: string = process.env.TABLE_SCHEDULES
  const dbObject = DynamoRepository(table)
  const sfs = new StepFunctions()

  if (!applicationId) {
    throw new errors.ApplicationError({
      message: `The \`applicationId\` is missing from headers`,
    })
  }

  if (!userId) {
    throw new errors.ApplicationError({
      message: `The \`userId\` is missing from headers`,
    })
  }

  if (isEmpty(body)) {
    throw new errors.ValidationError({
      message: `A schedule body is required`,
    })
  }

  console.debug('CreateSchedule: body', { body })

  await schemas.validate({
    data: body,
    schema: schemas.schedulePayloadSchema,
  })

  const { locations } = body

  const includedLocations = await BPromise.reduce(
    locations,
    async (accum, id) => {
      const location = await getArea({ applicationId, locationId: id })

      if (!location) {
        return accum
      }

      const { name } = location

      accum[id] = { name }
      return accum
    },
    {},
  )

  console.debug('CreateSchedule: included locations', { includedLocations })

  const included = { locations: includedLocations }

  const additional = { applicationId, included, userId }

  const document: schemas.ScheduleDocumentSchema = payloadToScheduleDocument({
    payload: body,
    additional,
  })

  try {
    await schemas.validate({
      data: document,
      options: { context: { isNew: true } },
      schema: schemas.scheduleDocumentSchema,
    })
  } catch (err) {
    throw new errors.ApplicationError({ message: err.message })
  }

  const { scheduleId } = document

  console.debug('CreateSchedule: document to be created', { document })

  const scheduleDocument: schemas.ScheduleDocumentSchema = await dbObject.put(
    document,
  )

  console.debug('CreateSchedule: invoking step function', {
    applicationId,
    locations,
    scheduleId,
    stateMachineArn: process.env.CREATE_SCHEDULE_STEP_FUNCTION,
  })

  await sfs
    .startExecution({
      input: JSON.stringify({
        applicationId,
        locations,
        scheduleId,
      }),
      name: `${applicationId}-${scheduleId}-${Date.now()}`,
      stateMachineArn: process.env.CREATE_SCHEDULE_STEP_FUNCTION,
    })
    .promise()

  const responsePayload: schemas.SchedulePayloadSchema = documentToSchedulePayload(
    {
      document: scheduleDocument,
    },
  )

  console.debug('CreateSchedule: response payload', { responsePayload })

  return responsePayload
}

const deleteOccurrences = async (
  scheduleId: string,
): Promise<DC.TransactWriteItemsOutput | []> => {
  const table: string = process.env.TABLE_SCHEDULES
  const dbObject = DynamoRepository(table)

  if (!scheduleId) {
    throw new errors.ApplicationError({
      message: 'The schedule `id` of the resource to delete is missing',
    })
  }

  const occurrences = (await dbObject.getBySchedule({
    groupType: 'occurrence',
    scheduleId,
    status: 'pending',
  })) as schemas.ScheduleOccurrenceDocumentSchema[]

  const items = map(occurrences, occurrence => ({
    pk: occurrence.pk,
    sk: occurrence.sk,
  }))

  console.debug('DeleteOccurrences: items to be deleted', { items })

  const results = await dbObject.remove(items)

  return results
}

interface GetArea {
  applicationId: string
  locationId: string
}

async function getArea({ applicationId, locationId }: GetArea) {
  const areasCollection = await mongo.getCollection('areas')

  const area = await areasCollection.findOne({
    _id: new mongo.ObjectId(toString(locationId)),
    application: new mongo.ObjectId(toString(applicationId)),
  })

  console.debug('GetArea: returned area', { applicationId, area, locationId })

  return area
}

interface GetSchedule {
  applicationId: string
  scheduleId?: string
}

const getSchedule = async ({
  applicationId,
  scheduleId,
}: GetSchedule): Promise<schemas.SchedulePayloadSchema> => {
  const table: string = process.env.TABLE_SCHEDULES
  const dbObject = DynamoRepository(table)

  if (!applicationId) {
    throw new errors.ApplicationError({
      message: `The \`applicationId\` is missing from headers`,
    })
  }

  if (!scheduleId) {
    throw new errors.ValidationError({
      message: `The schedule \`id\` is required`,
    })
  }

  const result = (await dbObject.getBySchedule({
    groupType: 'schedule',
    limit: 1,
    scheduleId,
  })) as schemas.ScheduleDocumentSchema[]

  if (isEmpty(result)) {
    throw new errors.ResourceNotFoundError({
      id: scheduleId,
      resource: 'Schedule',
    })
  }

  const document: schemas.ScheduleDocumentSchema = result[0]
  const responsePayload: schemas.SchedulePayloadSchema = documentToSchedulePayload(
    {
      document,
    },
  )

  return responsePayload
}

interface ListSchedules {
  applicationId: string
}

const listSchedules = async ({
  applicationId,
}: ListSchedules): Promise<schemas.SchedulePayloadSchema[]> => {
  const table: string = process.env.TABLE_SCHEDULES
  const dbObject = DynamoRepository(table)

  if (!applicationId) {
    throw new errors.ApplicationError({
      message: `The \`applicationId\` is missing from headers`,
    })
  }

  const scheduleDocuments = (await dbObject.listSchedules(
    applicationId,
  )) as schemas.ScheduleDocumentSchema[]

  const responsePayload: schemas.SchedulePayloadSchema[] = map(
    scheduleDocuments,
    scheduleDocument =>
      documentToSchedulePayload({
        document: scheduleDocument,
      }),
  )

  return responsePayload
}

interface RemoveSchedule {
  applicationId: string
  scheduleId: string
}

const removeSchedule = async ({
  applicationId,
  scheduleId,
}: RemoveSchedule): Promise<void> => {
  const table: string = process.env.TABLE_SCHEDULES
  const dbObject = DynamoRepository(table)

  if (!applicationId) {
    throw new errors.ApplicationError({
      message: `The \`applicationId\` is missing from headers`,
    })
  }

  if (!scheduleId) {
    throw new errors.ValidationError({
      message: 'The schedule `id` of the resource to delete is missing',
    })
  }

  const items = (await dbObject.getBySchedule({
    scheduleId,
  })) as Array<
    schemas.ScheduleDocumentSchema | schemas.ScheduleOccurrenceDocumentSchema
  >

  console.debug('RemoveSchedule: database results', { results: items })

  const itemKeys = items.map(({ pk, sk }) => ({ pk, sk }))

  console.debug('RemoveSchedule: items to be removed', { items: itemKeys })

  await dbObject.remove(itemKeys)

  const schedule = first(
    filter(items, { groupType: 'schedule' }),
  ) as schemas.ScheduleDocumentSchema

  if (!schedule) {
    return
  }

  const { locations } = schedule.data

  console.debug('RemoveSchedule: schedule locations', { locations })

  await BPromise.each(locations, async (locationId: string) => {
    const locationDocument = (await dbObject.get({
      pk: `${applicationId}-location`,
      sk: locationId,
    })) as schemas.ScheduleLocationDocumentSchema

    console.debug('RemoveSchedule: location database result', {
      locationDocument,
    })

    if (!locationDocument) {
      console.info('RemoveSchedule: Schedule referenced a missing location', {
        locationId,
        scheduleId,
      })

      return
    }

    const { schedules } = locationDocument

    const updatedSchedules = without(schedules, scheduleId)

    const updatedLocationDocument = {
      ...locationDocument,
      schedules: updatedSchedules,
    }

    console.debug('RemoveSchedule: location document update', {
      updatedLocationDocument,
    })

    await dbObject.put(updatedLocationDocument)
  })
}

interface UpdateSchedule {
  applicationId: string
  body: schemas.SchedulePayloadSchema
  scheduleId: string | null
  userId: string
}

const updateSchedule = async ({
  applicationId,
  body,
  scheduleId,
  userId,
}: UpdateSchedule): Promise<schemas.SchedulePayloadSchema> => {
  const table: string = process.env.TABLE_SCHEDULES
  const dbObject = DynamoRepository(table)
  const sfs = new StepFunctions()

  if (!applicationId) {
    throw new errors.ApplicationError({
      message: `The \`applicationId\` is missing from headers`,
    })
  }

  if (!userId) {
    throw new errors.ApplicationError({
      message: `The \`userId\` is missing from headers`,
    })
  }

  if (!scheduleId) {
    throw new errors.ValidationError({
      message: `The schedule \`id\` is required`,
    })
  }

  if (isEmpty(body)) {
    throw new errors.ValidationError({
      message: `A schedule body is required`,
    })
  }

  console.debug('UpdateSchedule: body', { body })

  await schemas.validate({
    data: body,
    schema: schemas.schedulePayloadSchema,
  })

  const result = (await dbObject.getBySchedule({
    groupType: 'schedule',
    limit: 1,
    scheduleId,
  })) as schemas.ScheduleDocumentSchema[]

  console.debug('UpdateSchedule: database result', { result })

  if (isEmpty(result)) {
    throw new errors.ResourceNotFoundError({
      id: scheduleId,
      resource: 'Schedule',
    })
  }

  const existingDocument: schemas.ScheduleDocumentSchema = result[0]

  console.debug('UpdateSchedule: existing document', { existingDocument })

  const existingDocumentPayload: schemas.ScheduleResponseSchema = documentToSchedulePayload(
    {
      document: existingDocument,
    },
  )

  console.debug('UpdateSchedule: existing document payload', {
    existingDocumentPayload,
  })

  const { locations } = body

  const includedLocations = await BPromise.reduce(
    locations,
    async (accum, id) => {
      const location = await getArea({ applicationId, locationId: id })

      if (!location) {
        return accum
      }

      const { name } = location

      accum[id] = { name }
      return accum
    },
    {},
  )

  console.debug('UpdateSchedule: included locations', { includedLocations })

  const included = { locations: includedLocations }

  const payload = {
    ...existingDocumentPayload,
    ...body,
  }

  const additional = {
    applicationId,
    createdAt: existingDocument.createdAt,
    createdBy: existingDocument.createdBy,
    id: scheduleId,
    included,
    userId,
  }

  const document: schemas.ScheduleDocumentSchema = payloadToScheduleDocument({
    payload,
    additional,
  })

  console.debug('UpdateSchedule: payload to document', { document })

  try {
    await schemas.validate({
      data: document,
      options: { context: { isNew: false } },
      schema: schemas.scheduleDocumentSchema,
    })
  } catch (err) {
    throw new errors.ApplicationError({ message: err.message })
  }

  console.debug('UpdateSchedule: document to be updated', { document })

  const updatedDocument: schemas.ScheduleDocumentSchema = await dbObject.put(
    document,
  )

  console.debug('UpdateSchedule: invoking step function', {
    applicationId,
    locations,
    scheduleId,
    stateMachineArn: process.env.UPDATE_SCHEDULE_STEP_FUNCTION,
  })

  await sfs
    .startExecution({
      input: JSON.stringify({
        applicationId,
        locations,
        scheduleId,
      }),
      name: `${applicationId}-${scheduleId}-${Date.now()}`,
      stateMachineArn: process.env.UPDATE_SCHEDULE_STEP_FUNCTION,
    })
    .promise()

  const responsePayload: schemas.ScheduleResponseSchema = documentToSchedulePayload(
    {
      document: updatedDocument,
    },
  )

  console.debug('UpdateSchedule: response payload', { responsePayload })

  return responsePayload
}

interface UpsertLocation {
  applicationId: string
  arn: string
  arnId: string
  locationId: string
  scheduleId?: string
}

const upsertLocation = async ({
  applicationId,
  arn,
  arnId,
  locationId,
  scheduleId,
}: UpsertLocation): Promise<schemas.ScheduleLocationDocumentSchema> => {
  const table: string = process.env.TABLE_SCHEDULES
  const dbObject = DynamoRepository(table)

  if (!applicationId) {
    throw new errors.ApplicationError({
      message: 'The `applicationId` is missing',
    })
  }

  if (!arn) {
    throw new errors.ApplicationError({
      message: 'The `arn` is missing',
    })
  }

  if (!arnId) {
    throw new errors.ApplicationError({
      message: 'The `arnId` is missing',
    })
  }

  if (!locationId) {
    throw new errors.ApplicationError({
      message: 'The `locationId` is missing',
    })
  }

  const area = await getArea({ applicationId, locationId })

  console.debug('UpsertLocation: area', { area })

  const { name, serviceHours } = area

  const existingLocation = await dbObject.get({
    pk: `${applicationId}-location`,
    sk: locationId,
  })

  console.debug('UpsertLocation: existing location', { existingLocation })

  const actor: schemas.ActorSchema = { id: arnId, label: arn, type: 'system' }

  const now: string = moment
    .utc()
    .toDate()
    .toISOString()

  const createdAt = existingLocation ? existingLocation.createdAt : now
  const createdBy = existingLocation ? existingLocation.createdBy : actor
  const schedules =
    existingLocation && scheduleId
      ? uniq([...existingLocation.schedules, scheduleId])
      : existingLocation && !scheduleId
        ? existingLocation.schedules
        : !existingLocation && scheduleId
          ? [scheduleId]
          : []

  const document: schemas.ScheduleLocationDocumentSchema = {
    applicationId,
    createdAt,
    createdBy,
    data: { name, serviceHours },
    groupType: 'location',
    pk: `${applicationId}-location`,
    schedules,
    sk: locationId,
    updatedAt: now,
    updatedBy: actor,
  }

  try {
    await schemas.validate({
      data: document,
      schema: schemas.scheduleLocationDocumentSchema,
    })
  } catch (err) {
    throw new errors.ApplicationError({ message: err.message })
  }

  console.debug('UpsertLocation: document to be created', { document })

  const result = (await dbObject.put(
    document,
  )) as schemas.ScheduleLocationDocumentSchema

  if (existingLocation && !isEmpty(existingLocation.schedules)) {
    await BPromise.each(existingLocation.schedules, async (id: string) => {
      const scheduleResult = (await dbObject.getBySchedule({
        groupType: 'schedule',
        limit: 1,
        scheduleId: id,
      })) as schemas.ScheduleDocumentSchema[]

      console.debug('UpsertLocation: schedule database result', {
        scheduleResult,
      })

      if (isEmpty(scheduleResult)) {
        console.debug(
          'UpsertLocation: Location references a missing schedule',
          {
            locationId,
            scheduleId: id,
          },
        )

        return
      }

      const existingDocument = scheduleResult[0]

      console.debug('UpsertLocation: schedule', { schedule: existingDocument })

      const nextSchedule: schemas.ScheduleDocumentSchema = {
        ...existingDocument,
        data: {
          ...existingDocument.data,
          included: {
            ...existingDocument.data.included,
            locations: {
              ...existingDocument.data.included.locations,
              [locationId]: { name },
            },
          },
        },
      }

      console.debug('UpsertLocation: document to be updated', {
        document: nextSchedule,
      })

      await dbObject.put(nextSchedule)
    })
  }

  return result
}

const ScheduleService = {
  createSchedule,
  deleteOccurrences,
  getSchedule,
  listSchedules,
  removeSchedule,
  updateSchedule,
  upsertLocation,
}

export { ScheduleService }
