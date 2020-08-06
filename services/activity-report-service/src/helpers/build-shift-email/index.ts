import * as BPromise from 'bluebird'
import {
  filter,
  isEmpty,
  reject,
  sortBy,
  toUpper,
  trim,
  getOr,
  flow,
  find,
  get,
} from 'lodash/fp'
import { orderBy } from 'lodash'
import * as moment from 'moment-timezone'

import { getShiftReportLinks } from '../get-shift-report-links'

interface Env {
  env: {
    STAGE: string
    SES_CONFIGURATION_SET_NAME: string
  }
}

declare var process: Env

const getFormSubmissionOption = flow(
  get('notifications.channels'),
  find({ name: 'daily-shift-report' }),
  getOr(true, 'options.formSubmissions'),
)

export async function buildShiftEmail({ userDetails, datetime }) {
  try {
    const {
      applicationName,
      email,
      firstName,
      preferences,
      timezone,
      shifts,
    } = userDetails

    const isProduction = process.env.STAGE === 'production'
    const stage = toUpper(process.env.STAGE)
    const template = isProduction
      ? 'daily-shift-reports'
      : 'daily-shift-reports-test'

    const ConfigurationSetName = process.env.SES_CONFIGURATION_SET_NAME

    const mStartDate = moment(datetime)
      .utc()
      .tz(timezone)
      .subtract(1, 'day')

    const dateText = mStartDate.format('dddd Do MMMM')
    const shortDateText = mStartDate.format('MMMM D')

    const withFormSubmissions = getFormSubmissionOption(preferences)

    const shiftLinks = await BPromise.map(shifts, shift =>
      getShiftReportLinks({
        datetime,
        shift,
        withFormSubmissions,
      }),
    )

    const activeShifts = orderBy(
      filter('link')(shiftLinks),
      ['lastName', 'timestamp'],
      ['asc'],
    )

    const hasNoShifts = isEmpty(activeShifts)
    const name = trim(firstName)

    const data = JSON.stringify({
      activeShifts,
      applicationName,
      date: dateText,
      hasNoShifts,
      isProduction,
      name,
      shortDate: shortDateText,
      stage,
    })

    return {
      ...(ConfigurationSetName && { ConfigurationSetName }),
      Destination: {
        CcAddresses: [],
        ToAddresses: [email],
      },
      ReplyToAddresses: ['notifications@lighthouse.io'],
      Source: 'notifications@lighthouse.io',
      Template: template,
      TemplateData: data,
    }
  } catch (error) {
    console.error('Error building email', { error, userDetails })
    return false
  }
}
