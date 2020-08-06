// const subscriptionId = "d706c0fb-50e4-42ac-878c-fad3f1aa5fff" //Dev Testing

class AzureBuildPlugin {
  constructor(serverless, options) {
    this.serverless = serverless
    this.options = options

    this.commands = {
      deploy: {
        usage: 'Create Event Grid Topic and Subscription',
        lifecycleEvents: ['disableStats', 'publish'],
        options: {
          stage: {
            usage: 'Stage of service',
            shortcut: 's',
          },
        },
      },
    }

    this.hooks = {
      'before:deploy:deploy': this.disableStats.bind(this),
      'after:deploy:deploy': this.publish.bind(this),
    }

    this.execSync = require('child_process').execSync
  }

  disableStats() {
    this.serverless.cli.log('Disable Stats to prevent timeout...')
    this.execSync('serverless slstats --disable', { stdio: 'inherit' })
    this.serverless.cli.log('Installing az command line...')
    this.execSync('curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash', {
      stdio: 'inherit',
    })
  }

  publish() {
    const provider = this.serverless.service.provider
    const subscriber = this.serverless.pluginManager.serverlessConfigFile
      .functions.winteamEventSubscriber
    const service = this.serverless.pluginManager.serverlessConfigFile.service
    const egTopicName = subscriber.eventGrid.topicName
    const egResourceGroup = subscriber.eventGrid.resourceGroup
    const egSubscriptionName = subscriber.eventGrid.subscriptionName

    this.serverless.cli.log('AZ Login...')

    this.execSync(
      `az login --service-principal --username ${
        provider.environment.AZURE_CLIENT_ID
      } \
      --password ${provider.environment.AZURE_CLIENT_SECRET} --tenant ${
        provider.environment.AZURE_TENANT_ID
      }`,
      { stdio: 'inherit' },
    )

    this.serverless.cli.log('Create Topic...')

    this.execSync(
      `az eventgrid topic create -g ${egResourceGroup} --name ${egTopicName} -l "${
        provider.location
      }" --debug --verbose`,
      { stdio: 'inherit' },
    )

    this.serverless.cli.log('Create Subscription...')

    this.execSync(
      `az eventgrid event-subscription create --name ${egSubscriptionName} \
        --source-resource-id /subscriptions/${
          provider.environment.AZURE_SUBSCRIPTION_ID
        }/resourceGroups/${egResourceGroup}/providers/Microsoft.EventGrid/topics/${egTopicName} \
        --endpoint-type webhook \
        --endpoint "https://fa-cus-${provider.environment.STAGE}-${
        service.name
      }.azurewebsites.net/api/events" --debug --verbose`,
      { stdio: 'inherit' },
    )
  }
}

module.exports = AzureBuildPlugin
