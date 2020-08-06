## Data Lake

## Useful commands

- `yarn build` compile typescript to js
- `yarn watch` watch for changes and compile
- `yarn deploy --region us-east-1 --stage develop` deploy this stack to your default AWS account/region
- `yarn diff --region us-east-1 --stage develop` compare deployed stack with current state
- `yarn synth --region us-east-1 --stage develop` emits the synthesized CloudFormation template

## Setting up a new application

### AWS Setup (Management Account)

1.  Go to the AWS Console for the management account
2.  Go to My Organisation via the top-right menu
3.  Add Account with email pattern: `accounts+<slug>@lighthouse.io`
4.  Under 'Organize Accounts', move the newly created customer to `Customer Accounts > Production > <Region>`
5.  Go to SSO control panel (us-east-1)
6.  Assign newly created account to the `LighthouseDataTeam` group with the
    `AministratorAccess` permission set

### CDK

1.  Setup config for the new account in `config.ts`
2.  Run `yarn diff --region <region> --stage production` and sanity check the
    changes that will be made to CloudFormation templates
3.  PR, Code Review & merge the changes
4.  The `deploy` command will be ran as part of the CI process after merging

### AWS Setup (Customer Account)

1.  Login into customer account via [SSO](https://lighthouseio.awsapps.com/start#/)
2.  Goto IAM
3.  Create a new policy called `KMSDecrypt`. Look at other accounts for a
    template, but here's what the policy should be:

    ```
    {
     "Version": "2012-10-17",
     "Statement": [
         {
             "Sid": "VisualEditor0",
             "Effect": "Allow",
             "Action": "kms:Decrypt",
             "Resource": "*"
         }
     ]
     }
    ```

    This gives the account access to kms via cross-account policy from lighthouse (for s3 encryption)

4.  Goto Glue > Crawlers > Add Crawler

    1.  Name: LighthouseDataLake
    2.  Tags: region=au/us customer=slug
    3.  Crawler Type: Data Sources
    4.  Paths: One path per data collection (s3 prefix). See other applications
        for examples e.g:

    ```
    s3://lio-data-lake-ap-southeast-2-production-by-application/145673884201/collection=activities/
    ```

5.  Choose to create a new IAM role with a suffix of `LighthouseDataLake`
6.  Set 'Frequency' to run daily at midnight of the region
7.  Name the database `lio`
8.  For the options, it's important to select the following:

    1.  Create a single schema for each s3 path
    2.  Add new columns only
    3.  Update all new and existing partitions with metadata
    4.  Ignore change and don't update table

### Quicksight Setup (Customer Account)

1.  Login into customers Quicksight account
2.  Make sure you're in us-east-1. The data will live in sydney region for AU
    customers but the setup has to be done in us-east-1 so we get full feature
    set
3.  Signup to quicksight with your email address
    1.  Choose the enterprise option
    2.  Choose North Virginia (us-east-1)
    3.  Account Name: Lighthouse-<CustomerName>
    4.  Notifications Email: `accounts+slug@lighthouse.io`
    5.  Check S3 option and choose 'cross account bucket'
        1.  Add the cross account bucket name, not the url to the bucket

### Queries

1.  Login to Quicksight
2.  Select `Manage Data`
3.  Add a new Athena Data Source
4.  Paste one of the queries from the examples in this repo
5.  Update any date fields to `Date` and use this format: `yyyy-MM-dd'T'HH:mm:ss.SSS'Z'`
6.  Select the `Spice` format before saving
7.  Set the refresh schedule to after the Glue schedule (e.g. 1.30am)
8.  Share _each_ data set with the relevant users

### Troubleshooting

**I can't add some queries because of missing data sets**

Make sure that the bucket prefix is included in the Glue Crawler config. If it's
been added after setup, it will need to be updated.

**I get bucket access error when running the crawler**

1.  Ensure the Glue Crawler IAM profile has the relevant policy definition for the
    bucket prefix in question
2.  Ensure the KMSDecrypt policy (see above) has been created
