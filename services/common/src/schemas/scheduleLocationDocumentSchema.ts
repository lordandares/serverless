import { serviceHours } from '@lighthouse/common'
import { InferType, array, object, string } from 'yup'

import { actorSchema } from './actorSchema'
import { groupTypes } from './constants'

export const scheduleLocationDocumentSchema = object().shape({
  applicationId: string().required(),
  createdAt: string().required(),
  createdBy: actorSchema.required(),
  data: object()
    .shape({
      name: string().required(),
      serviceHours: serviceHours.schema.required(),
    })
    .required(),
  groupType: string()
    .oneOf(groupTypes)
    .required(),
  pk: string().required(),
  schedules: array(),
  sk: string().required(),
  updatedAt: string(),
  updatedBy: actorSchema,
})

export type ScheduleLocationDocumentSchema = InferType<
  typeof scheduleLocationDocumentSchema
>

export default scheduleLocationDocumentSchema
