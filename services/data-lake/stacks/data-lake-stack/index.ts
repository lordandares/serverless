import iam = require('@aws-cdk/aws-iam')
import kms = require('@aws-cdk/aws-kms')
import cdk = require('@aws-cdk/core')
import { each, getOr } from 'lodash/fp'

import { Account, config } from '../../config'
import { ByApplicationBucket } from '../../lib/by-application-bucket'

export enum Stacks {
  DataLakeAuProd = 'DataLakeAuProd',
  DataLakeUsProd = 'DataLakeUsProd',
  DataLakeUsDevelop = 'DataLakeUsDevelop',
}

export default class DataLakeStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    const environment = getOr('dev', 'tags.environment', props)
    const region = getOr('us-east-1', 'env.region', props)
    const removalPolicy = getOr(
      cdk.RemovalPolicy.RETAIN,
      'tags.removalPolicy',
      props,
    )

    const accounts: Account[] = getOr([], `${region}.${environment}`, config)
    const stackName = `lio-data-lake-${region}-${environment}-by-application`

    const encryptionKey = new kms.Key(
      this,
      'DataLakeByApplicationEncryptionKey',
      {
        alias: stackName,
        enableKeyRotation: true,
        enabled: true,
        removalPolicy,
      },
    )

    each((account: Account) => {
      const principal = new iam.AccountPrincipal(account.awsCustomerAccountId)

      encryptionKey.grantDecrypt(principal)
    })(accounts)

    new ByApplicationBucket(this, 'DataLakeByApplicationBucket', {
      bucketName: stackName,
      config: accounts,
      encryptionKey,
      removalPolicy,
    })
  }
}
