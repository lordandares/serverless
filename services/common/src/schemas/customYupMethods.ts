import { Schema } from 'yup'

declare module 'yup' {
  interface Schema<T> {
    requiredWhen(contextName: string): Schema<T>
  }
}

import { addMethod, mixed } from 'yup'

addMethod(mixed, 'requiredWhen', function(property, value = true) {
  return this.when(property, {
    is: value,
    then: s => s.required(),
  })
})
