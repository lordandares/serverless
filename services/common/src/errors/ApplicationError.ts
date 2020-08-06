import DomainError from './DomainError'

interface Options {
  data?: object
  message: string
}

export default class ApplicationError extends DomainError {
  public data: object | undefined
  public status: number
  constructor({ data, message }: Options) {
    super(message)
    this.status = 500
    this.data = data
  }
}
