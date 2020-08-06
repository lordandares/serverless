import { reduce } from 'lodash/fp'
import mongo from 'mongodb'

const REGEX_OBJECT_ID = /^[0-9a-fA-F]{24}$/
// @ts-ignore
const reduceWithKey = reduce.convert({ cap: false })

export function parseQueryParams(queryParams: object) {
  return reduceWithKey((accum, value, key) => {
    const paramValue = REGEX_OBJECT_ID.test(value)
      ? new mongo.ObjectId(value)
      : value

    accum[key] = paramValue

    return accum
  }, {})(queryParams)
}

export default {
  parseQueryParams,
}
