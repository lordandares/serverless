import { InferType, array, object, string } from 'yup'
import { scheduleDocumentBaseSchema } from './scheduleDocumentBaseSchema'

import { statuses } from './constants'
import './customYupMethods'

export const scheduleOccurrenceDocumentSchema = scheduleDocumentBaseSchema.shape(
  {
    data: object({
      occurrenceInterval: array().required(),
      scheduleName: string().required(),
      serviceInterval: array().required(),
      timezone: string().required(),
    }),
    endAt: string().required(),
    locationId: string().required(),
    location_endAt_occurrenceId: string().required(),
    occurrenceId: string().required(),
    status: string()
      .oneOf(statuses)
      .required(),
  },
)

export type ScheduleOccurrenceDocumentSchema = InferType<
  typeof scheduleOccurrenceDocumentSchema
>

export default scheduleOccurrenceDocumentSchema
