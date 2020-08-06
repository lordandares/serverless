import { InferType, object, string } from 'yup'

export const actionSchema = object().shape({
  type: string().required(),
  endpoint: string().required(),
  data: object(),
})

export type ActionSchema = InferType<typeof actionSchema>

export default actionSchema
