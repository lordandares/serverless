interface IGithubServiceProcess extends NodeJS.Process {
  env: {
    SLACK_WEBHOOK_URL: string
    SNS_TOPIC_DELETE_TIMEOUT_ARN: string
    SNS_TOPIC_PUT_TIMEOUT_ARN: string
    WEBHOOK_SECRET: string
  }
}
