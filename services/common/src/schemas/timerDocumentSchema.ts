import { InferType, object, string } from 'yup'

export const timerDocumentSchema = object().shape({
  expiresAt: string().required(),
  groupType: string().required(),
  pk: string().required(),
  scheduleId: string().required(),
  sk: string().required(),
  targetArn: string().required(),
})

export type TimerDocumentSchema = InferType<typeof timerDocumentSchema>

export default timerDocumentSchema
