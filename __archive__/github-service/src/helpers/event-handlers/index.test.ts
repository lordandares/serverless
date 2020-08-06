import { eventTypeHandlerMap } from './'

describe('eventTypeHandlers', () => {
  it('exports event handlers', () => {
    expect(eventTypeHandlerMap.pull_request).toBeDefined()
    expect(eventTypeHandlerMap.pull_request_review).toBeDefined()
  })
})
