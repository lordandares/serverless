import * as dateFns from 'date-fns'
import * as MockDate from 'mockdate'

MockDate.set('2000-01-01T00:00:00.000Z')
const timestamp = dateFns.subHours(new Date('2019-11-07T11:15:00Z'), 6)

export const SUMMARY_REPORT_PATH =
  'activity-reports-shifts/7af476e9c68b751112e38cb8/2019/10/10/2019-10-10-shift-5be365d9c68b740001d27ba7-summary-1548194730622.pdf'

export const SUMMARY_REPORT_AND_FORMS_PATH =
  'activity-reports-shifts/7af476e9c68b751112e38cb8/2019/10/10/2019-10-10-shift-5be365d9c68b740001d27ba7-summary-and-forms-1447283621511.pdf'

export const S3_BASE_URL = 'http://baseurl.com'

export const shift = {
  _id: '5be365d9c68b740001d27ba7',
  user: '5be365d9c68b740001d20001',
  files: {
    activityReportSummary: {
      path: SUMMARY_REPORT_PATH,
      timestamp,
    },
    activityReportSummaryAndForms: {
      path: SUMMARY_REPORT_AND_FORMS_PATH,
      timestamp,
    },
  },
}

export const user = {
  _id: '5be365d9c68b740001d20001',
  firstName: 'Steve',
  lastName: 'Jobs',
  files: {
    activityReportSummary: {
      path: SUMMARY_REPORT_PATH,
      timestamp,
    },
    activityReportSummaryAndForms: {
      path: SUMMARY_REPORT_AND_FORMS_PATH,
      timestamp,
    },
  },
}
