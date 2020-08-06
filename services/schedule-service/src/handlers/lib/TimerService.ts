/* istanbul ignore file */

interface Clear {
  id: string
}

interface Set {
  data: object
  id: string
  timestamp: string
}

/* istanbul ignore file */

export function clear({ id }: Clear) {
  // TODO probably fire SNS event or clear cloudwatch timer
  return id
}

export function set({ data, id, timestamp }: Set) {
  // TODO probably fire SNS event or clear cloudwatch timer
  return id
}
