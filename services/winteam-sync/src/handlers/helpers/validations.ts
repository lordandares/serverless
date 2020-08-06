import { errors } from '@lighthouse/serverless-common'

export const validateError = ({ context, data }, fieldName: string) => {
  if (!data[fieldName]) {
    const err = new errors.ValidationError({
      message: fieldName + ' is required',
    })

    context.log.error(err.message, {
      data,
    })

    throw err
  }
}
