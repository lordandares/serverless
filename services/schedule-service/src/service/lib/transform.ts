import { schemas } from '@lighthouse/serverless-common'
import * as moment from 'moment'
import { v4 as uuid } from 'uuid'

interface DocumentToSchedulePayloadOptions {
  document: schemas.ScheduleDocumentSchema
}

export function documentToSchedulePayload(
  options: DocumentToSchedulePayloadOptions,
): schemas.ScheduleResponseSchema {
  const { document } = options
  const {
    createdAt,
    createdBy,
    data: {
      areas,
      enabled,
      included,
      locations,
      serviceHours,
      name,
      strategy,
      type,
    },
    endAt,
    scheduleId,
    startAt,
    updatedAt,
    updatedBy,
  } = document

  const payload: schemas.ScheduleResponseSchema = {
    areas,
    createdAt,
    createdBy,
    enabled,
    endAt,
    id: scheduleId,
    included,
    locations,
    name,
    serviceHours,
    startAt,
    strategy,
    type,
    updatedAt,
    updatedBy,
  }

  return payload
}

interface PayloadToScheduleDocumentOptions {
  payload: schemas.SchedulePayloadSchema
  additional: {
    applicationId: string
    createdAt?: string
    createdBy?: schemas.ActorSchema
    id?: string
    included: object
    userId: string
  }
}

export function payloadToScheduleDocument(
  options: PayloadToScheduleDocumentOptions,
): schemas.ScheduleDocumentSchema {
  const { payload, additional } = options
  const {
    areas,
    enabled,
    endAt,
    locations,
    name,
    serviceHours,
    startAt,
    strategy,
    type,
  } = payload

  const {
    applicationId,
    createdAt,
    createdBy,
    id,
    included,
    userId,
  } = additional

  const isNew: boolean = !id

  const now: string = moment
    .utc()
    .toDate()
    .toISOString()

  const actor = { id: userId, label: 'Unknown User', type: 'user' }

  const scheduleId: string = isNew ? uuid() : id

  const document: schemas.ScheduleDocumentSchema = {
    applicationId,
    createdAt: createdAt || now,
    createdBy: createdBy || actor,
    data: {
      areas,
      enabled,
      included,
      locations,
      name,
      serviceHours,
      strategy,
      type,
    },
    endAt,
    groupType: 'schedule',
    pk: `${applicationId}-schedule`,
    scheduleId,
    sk: `${isNew ? now : createdAt}-${scheduleId}`,
    startAt,
    updatedAt: now,
    updatedBy: actor,
  }

  return document
}
