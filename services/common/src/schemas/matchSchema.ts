import { InferType, object, string } from 'yup'

export const matchSchema = object().shape({
  locationId: string(),
  pk: string().required(),
  roleId: string(),
  sk: string().required(),
})

export type MatchSchema = InferType<typeof matchSchema>

export default matchSchema
