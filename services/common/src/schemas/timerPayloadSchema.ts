import { InferType, object, string } from 'yup'

export const timerPayloadSchema = object().shape({
  scheduleId: string().required(),
  datetime: string().required(),
  targetArn: string().required(),
  targetPk: string().required(),
  targetSk: string().required(),
  type: string().required(),
})

export type TimerPayloadSchema = InferType<typeof timerPayloadSchema>

export default timerPayloadSchema
