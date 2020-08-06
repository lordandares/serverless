import { Construct, RemovalPolicy } from '@aws-cdk/core'
import { AccountPrincipal, Effect, PolicyStatement } from '@aws-cdk/aws-iam'
import { Bucket, BlockPublicAccess } from '@aws-cdk/aws-s3'
import { each, first, getOr, map, reduce, template } from 'lodash/fp'
import { IKey } from '@aws-cdk/aws-kms'

const tplCollection = template(
  'collection=<%= collection %>/applicationid=<%= applicationId %>',
)

interface ByApplicationBucketProps {
  bucketName: string
  config: any
  encryptionKey: IKey
  removalPolicy: RemovalPolicy
}

export class ByApplicationBucket extends Construct {
  constructor(scope: Construct, name: string, props: ByApplicationBucketProps) {
    super(scope, name)

    const { bucketName, config, encryptionKey, removalPolicy } = props

    const byApplicationBucket = new Bucket(this, name, {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      bucketName,
      encryptionKey,
      removalPolicy,
    })

    each(({ awsCustomerAccountId }) => {
      const arn = `arn:aws:s3:::${bucketName}`
      const applicationPrefix = `${awsCustomerAccountId}/*`
      const principals = buildPrincipals(awsCustomerAccountId)

      const bucketPolicy = new PolicyStatement({
        actions: ['s3:ListBucket'],
        effect: Effect.ALLOW,
        principals,
        resources: [arn],
        conditions: {
          StringLike: {
            's3:prefix': applicationPrefix,
          },
        },
      })

      const objectPolicy = new PolicyStatement({
        actions: ['s3:GetObject'],
        effect: Effect.ALLOW,
        principals,
        resources: [`${arn}/${applicationPrefix}`],
      })

      byApplicationBucket.addToResourcePolicy(bucketPolicy)
      byApplicationBucket.addToResourcePolicy(objectPolicy)
    }, config)
  }
}

function buildPrincipals(awsCustomerAccountId: string) {
  return [
    // Root account access
    new AccountPrincipal(awsCustomerAccountId),
  ]
}
