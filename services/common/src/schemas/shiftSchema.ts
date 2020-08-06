import { InferType, array, boolean, number, object, string } from 'yup'

export const shiftEventSchema = object().shape({
  area: object().shape({
    location: object().shape({
      id: string(),
    }),
  }),
  time: string().required(),
})

export const shiftMessageSchema = object().shape({
  _id: string(),
  isGlobal: boolean(),
  message: string().required(),
  messageId: number().required(),
  punchActionId: number().required(),
  response1: string().required(),
  response1Id: number(),
  response2: string().required(),
  response2Id: number(),
  responseText: string(),
  responseTime: string(),
})

export const shiftBreakSchema = object().shape({
  end: shiftEventSchema,
  start: shiftEventSchema.required(),
})

export const shiftSchema = object().shape({
  _id: string(),
  application: string().required(),
  breaks: array().of(shiftBreakSchema),
  end: shiftEventSchema.nullable(),
  location: string().nullable(),
  messages: array().of(shiftMessageSchema),
  start: shiftEventSchema.required(),
  user: string().required(),
})

export type ShiftEventSchema = InferType<typeof shiftEventSchema>
export type ShiftMessageSchema = InferType<typeof shiftMessageSchema>
export type ShiftBreakSchema = InferType<typeof shiftBreakSchema>
export type ShiftSchema = InferType<typeof shiftSchema>

export default shiftSchema
