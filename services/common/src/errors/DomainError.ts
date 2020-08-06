// https://rclayton.silvrback.com/custom-errors-in-node-js

export default class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}
