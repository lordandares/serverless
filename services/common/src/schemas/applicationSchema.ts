import { InferType, mixed, object, string } from 'yup'

export const applicationSchema = object().shape({
  _id: string(),
  authenticationStrategies: mixed(),
  flags: mixed(),
  name: string().required(),
  plugins: mixed(),
  settings: mixed(),
  speakerbox: object().shape({
    consumerId: string(),
    token: string(),
  }),
  theme: object().shape({
    logos: object(),
  }),
})

export type ApplicationSchema = InferType<typeof applicationSchema>

export default applicationSchema
