import { scheduling, serviceHours } from '@lighthouse/common'
import { mapValues, values } from 'lodash'
import {
  InferType,
  array,
  boolean,
  date,
  lazy,
  number,
  object,
  string,
} from 'yup'
import { actorSchema } from './actorSchema'
import { includedSchema } from './includedSchema'

export const schedulePayloadSchema = object().shape({
  areas: array(),
  enabled: boolean(),
  endAt: string(),
  locations: array(),
  name: string(),
  serviceHours: serviceHours.schema.notRequired(),
  startAt: string(),
  strategy: object({
    options: object({
      duration: object({
        unit: string().oneOf(values(scheduling.Unit)),
        value: number(),
      }),
      frequency: object({
        unit: string().oneOf(values(scheduling.Unit)),
        value: number(),
      }),
    }),
    type: string().oneOf(values(scheduling.StrategyTypes)),
  }),
  type: string(),
})

export type SchedulePayloadSchema = InferType<typeof schedulePayloadSchema>

export const scheduleResponseSchema = object().shape({
  id: string(),
  areas: array(),
  createdAt: string(),
  createdBy: actorSchema,
  enabled: boolean(),
  endAt: string(),
  included: includedSchema,
  locations: array(),
  name: string(),
  serviceHours: serviceHours.schema.notRequired(),
  startAt: string(),
  strategy: object({
    options: object({
      duration: object({
        unit: string().oneOf(values(scheduling.Unit)),
        value: number(),
      }),
      frequency: object({
        unit: string().oneOf(values(scheduling.Unit)),
        value: number(),
      }),
    }),
    type: string().oneOf(values(scheduling.StrategyTypes)),
  }),
  type: string(),
  updatedAt: string(),
  updatedBy: actorSchema,
})

export type ScheduleResponseSchema = InferType<typeof scheduleResponseSchema>
