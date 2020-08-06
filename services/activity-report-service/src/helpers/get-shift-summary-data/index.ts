import { mongo } from '@lighthouse/serverless-common'
import { get } from 'lodash/fp'

import * as data from '../data'

const SHIFT_MAX_DURATION = 86400000

interface Env {
  env: {
    MONGODB_SECRET_ID: string
  }
}

declare var process: Env

export async function getShiftSummaryData(payload) {
  const { shiftId } = payload

  if (!shiftId) {
    throw new Error('Missing required params')
  }

  const secretId = process.env.MONGODB_SECRET_ID
  const client = await mongo.createClient(secretId)
  const db = client.db()

  console.info('fetching shift', { shiftId })

  const shift = await data.getShift({ db, shiftId })
  const {
    application: applicationId,
    duration,
    end: { time: end },
    start: { time: start },
    user: userId,
  } = shift

  console.info('fetching shift data', {
    end,
    start,
    userId,
  })

  if (duration > SHIFT_MAX_DURATION) {
    throw new Error(`Shift duration exceeded, shift: ${shiftId}`)
  }

  if (!start || !end) {
    throw new Error(
      `Shift start or end times does not exist, shift: ${shiftId}`,
    )
  }

  const application = await data.getApplication({ db, applicationId })
  const user = await data.getUser({ db, userId })

  const events = await data.getEvents({ db, applicationId, start, end, userId })
  const locations = await data.getLocations({ db, applicationId })
  const zones = await data.getZones({ db, applicationId })
  const audits = await data.getEntries({
    collection: 'auditentries',
    db,
    applicationId,
    start,
    end,
    userId,
  })
  const issues = await data.getEntries({
    collection: 'issues',
    db,
    applicationId,
    start,
    end,
    userId,
  })
  const tasks = await data.getEntries({
    collection: 'taskentries',
    db,
    applicationId,
    start,
    end,
    userId,
  })

  console.info('fetched shift data')

  return {
    application,
    applicationId,
    audits,
    events,
    issues,
    locations,
    shift,
    tasks,
    timestamp: start,
    timezone: shift.timezone || get('properties.timezone')(shift),
    user,
    zones,
  }
}
