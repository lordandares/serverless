import { delay } from 'bluebird'
import { argv, logger, option, task } from 'just-scripts'
import * as shell from 'shelljs'
import { Stacks } from './stacks/data-lake-stack/index'

option('region', {
  demandOption: true,
})

option('stage', {
  demandOption: true,
})

interface StackStrategies {
  [key: string]: Stacks
}

// NOTE this corresponds to a Stack in bin/index
const stacks: StackStrategies = {
  'ap-southeast-2:production': Stacks.DataLakeAuProd,
  'us-east-1:develop': Stacks.DataLakeUsDevelop,
  'us-east-1:production': Stacks.DataLakeUsProd,
}

task('diff', () => {
  const stack = getStack(argv())
  shell.exec(`yarn cdk diff ${stack}`)
})

task('synth', () => {
  const stack = getStack(argv())
  shell.exec(`yarn cdk synth ${stack}`)
})

task('deploy', async () => {
  const stack = getStack(argv())

  logger.warn(`${stack} stack will deploy in 10s...`)
  logger.warn(`Abort now if not sure!`)

  await delay(10000)

  shell.exec(`yarn cdk deploy ${stack}`)
})

interface GetStackOptions {
  region: string
  stage: string
}

function getStack(options: GetStackOptions): Stacks {
  const { region, stage } = options

  const stackKey = `${region}:${stage}`
  return stacks[stackKey]
}
