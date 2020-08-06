import { pullRequest } from './pull-request'
import { pullRequestReview } from './pull-request-review'

export const eventTypeHandlerMap = {
  pull_request: pullRequest,
  pull_request_review: pullRequestReview,
}

export default eventTypeHandlerMap
