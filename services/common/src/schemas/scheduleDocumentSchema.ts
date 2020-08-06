import { scheduling, serviceHours } from '@lighthouse/common'
import { values } from 'lodash'
import { InferType, array, boolean, number, object, string } from 'yup'
import { includedSchema } from './includedSchema'
import { scheduleDocumentBaseSchema } from './scheduleDocumentBaseSchema'

import './customYupMethods'

export const scheduleDocumentSchema = scheduleDocumentBaseSchema.shape({
  data: object({
    areas: array(),
    enabled: boolean().requiredWhen('$isNew'),
    included: includedSchema.requiredWhen('$isNew'),
    locations: array().requiredWhen('$isNew'),
    name: string().requiredWhen('$isNew'),
    serviceHours: serviceHours.schema.notRequired(),
    strategy: object({
      options: object({
        duration: object({
          unit: string()
            .oneOf(values(scheduling.Unit))
            .requiredWhen('$isNew'),
          value: number().required(),
        }).requiredWhen('$isNew'),
        frequency: object({
          unit: string()
            .oneOf(values(scheduling.Unit))
            .requiredWhen('$isNew'),
          value: number().requiredWhen('$isNew'),
        }),
      }).requiredWhen('$isNew'),
      type: string()
        .oneOf(values(scheduling.StrategyTypes))
        .requiredWhen('$isNew'),
    }).requiredWhen('$isNew'),
    type: string().requiredWhen('$isNew'),
  }).requiredWhen('$isNew'),
})

export type ScheduleDocumentSchema = InferType<typeof scheduleDocumentSchema>

export default scheduleDocumentSchema
