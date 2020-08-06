# Winteam Sync

See https://github.com/serverless/serverless-azure-functions for more details.

## Running Offline

To run the functions locally:

1.  Build typescript `yarn build`
2.  Temporarily point handlers at typescript dist dir. The
    serverless-azure-functions doesn't current tie into the serverless-webpack
    plugin for the offline command, so this has to be done manually
3.  `sls offline`

You will be provided with local URLs for each function for testing.

## Test Deploy

1.  Ensure you're environment is configured as per: https://github.com/serverless/serverless-azure-functions#advanced-authentication
2.  sls deploy --stage <your-test-stage> --region <azure-region>
