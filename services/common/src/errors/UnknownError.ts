import DomainError from './DomainError'

/*
 * Generic error for when we don't have a catch for a specific problem
 */
export default class UnknownError extends DomainError {
  public data: object
  public status: number
  constructor() {
    super(
      'Something went wrong! Try again or contact support if the problem persists.',
    )
    this.status = 500
  }
}
