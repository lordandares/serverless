import { InferType, boolean, number, object, string } from 'yup'

export const userSchema = object().shape({
  _id: string(),
  anonymous: boolean(),
  auth: object().shape({
    anonymousId: string(),
    failedLoginCount: number(),
    inviteToken: string(),
    password: string(),
    token: string(),
    resetPassword: object().shape({
      expires: string(),
      token: string(),
    }),
    username: string().required(),
  }),
  email: string().required(),
  firstName: string().required(),
  lastName: string().required(),
  location: string().nullable(),
  mobile: string(),
  superadmin: boolean(),
  tempPassword: string(),
})

export type UserSchema = InferType<typeof userSchema>

export default userSchema
