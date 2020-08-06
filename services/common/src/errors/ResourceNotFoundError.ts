import DomainError from './DomainError'

interface Options {
  data?: object
  id?: string | null
  resource: string
}

export default class ResourceNotFoundError extends DomainError {
  public data: object
  public status: number
  constructor({ id, data, resource }: Options) {
    super(
      `The Resource "${resource}" with ID of "${id ||
        'Unknown'}" could not be found`,
    )
    this.status = 404
    this.data = { resource, id, ...data }
  }
}
