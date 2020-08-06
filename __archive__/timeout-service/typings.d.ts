interface ITimeoutServiceProcess extends NodeJS.Process {
  env: {
    TABLE_TIMEOUTS: string
    TABLE_TIMEOUT_RESOURCES: string
  }
}

interface ITimeout {
  bucket: string
  expiration: string
  id: string
  resource: string
}
