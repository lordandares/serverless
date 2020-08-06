import { InferType, object, string } from 'yup'

const hookTypes = ['sns']

export const hookSchema = object().shape({
  endpoint: string().required(),
  type: string()
    .oneOf(hookTypes)
    .required(),
})

export type HookSchema = InferType<typeof hookSchema>

export default hookSchema
