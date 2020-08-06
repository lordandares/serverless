export enum Regions {
  UsEast1 = 'us-east-1',
  ApSoutheast2 = 'ap-southeast-2',
}

export enum Environments {
  develop = 'develop',
  production = 'production',
}

export interface Account {
  awsCustomerAccountId: string
  description: string
}

export type RegionsConfig = {
  [region in Regions]: { [environment in Environments]: Account[] }
}

// NOTE: This account is required in all environments/regions so KMS can decrypt the s3 objects
const lighthouseAdmin: Account = {
  awsCustomerAccountId: '047871223545',
  description: 'Lighthouse Administration Account',
}

export const config: RegionsConfig = {
  'ap-southeast-2': {
    develop: [lighthouseAdmin],
    production: [
      lighthouseAdmin,
      {
        awsCustomerAccountId: '145673884201',
        description: 'GJK Customer Account',
      },
      {
        awsCustomerAccountId: '961530587609',
        description: 'Ikon Customer Account',
      },
      {
        awsCustomerAccountId: '483630347039',
        description: 'Monjon Customer Account',
      },
      {
        awsCustomerAccountId: '965108981528',
        description: 'Spotless Cleaning Customer Account',
      },
      {
        awsCustomerAccountId: '080682692667',
        description: 'Spotless Security Customer Account',
      },
    ],
  },
  'us-east-1': {
    develop: [
      lighthouseAdmin,
      {
        awsCustomerAccountId: '131402847089',
        description: 'Lighthouse Development Customer Account',
      },
    ],
    production: [
      lighthouseAdmin,
      {
        awsCustomerAccountId: '086468758294',
        description: 'Team Lighthouse Customer Account',
      },
      {
        awsCustomerAccountId: '744217152501',
        description: 'Strategic Security Customer Account',
      },
    ],
  },
}
