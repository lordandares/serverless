import { mapValues } from 'lodash'
import { InferType, lazy, object, string } from 'yup'

interface Location {
  name: string
}

export const includedSchema = object().shape({
  locations: lazy(obj =>
    object(
      mapValues(obj as Location, () =>
        object().shape({
          name: string(),
        }),
      ),
    ),
  ),
})

export type IncludedSchema = InferType<typeof includedSchema>

export default includedSchema
