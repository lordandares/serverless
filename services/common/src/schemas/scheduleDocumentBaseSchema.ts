import { InferType, date, object, string } from 'yup'

import { actorSchema } from './actorSchema'
import { groupTypes } from './constants'

import './customYupMethods'

export const scheduleDocumentBaseSchema = object().shape({
  applicationId: string().requiredWhen('$isNew'),
  createdAt: string().requiredWhen('$isNew'),
  createdBy: actorSchema.requiredWhen('$isNew'),
  endAt: string(),
  groupType: string()
    .oneOf(groupTypes)
    .requiredWhen('$isNew'),
  pk: string().required(),
  scheduleId: string().requiredWhen('$isNew'),
  sk: string().required(),
  startAt: string().requiredWhen('$isNew'),
  updatedAt: string().notRequired(),
  updatedBy: actorSchema.notRequired(),
})

export type ScheduleDocumentBaseSchema = InferType<
  typeof scheduleDocumentBaseSchema
>

export default scheduleDocumentBaseSchema
