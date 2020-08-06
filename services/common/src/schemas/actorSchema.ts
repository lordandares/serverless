import { InferType, object, string } from 'yup'

export const actorSchema = object().shape({
  id: string().required(),
  label: string().required(),
  type: string().required(),
})

export type ActorSchema = InferType<typeof actorSchema>

export default actorSchema
