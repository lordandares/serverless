import { mongo } from '@lighthouse/serverless-common'
import * as MockDate from 'mockdate'
import finaliseShiftReport from './'

mongo.getCollection = jest.fn()

describe('handlers:finaliseShiftReport', () => {
  const MOCK_PAYLOAD = {
    pdfs: {
      summaryAndFormsS3Path:
        'activity-reports/5b68d7411f7b2b288279417a/2000/01/2000-01-01-summary-and-forms-946684800000.pdf',
      summaryS3Path:
        'activity-reports/5b68d7411f7b2b288279417a/2000/01/2000-01-01-summary-946684800000.pdf',
    },
    shiftId: '5b68d7411f7b2b288279417a',
  }

  beforeEach(() => {
    MockDate.set('2000-01-01T00:00:00.000Z')
  })

  afterEach(() => {
    jest.clearAllMocks()
    MockDate.reset()
  })

  it('should process stringified event body', async () => {
    const mockFindOneAndUpdate = jest.fn()
    mongo.getCollection.mockResolvedValue({
      findOneAndUpdate: mockFindOneAndUpdate,
    })

    const event = { body: JSON.stringify(MOCK_PAYLOAD) }
    await finaliseShiftReport(event)

    expect(mongo.getCollection).toHaveBeenCalledTimes(1)
    expect(mongo.getCollection).toBeCalledWith('shifts')

    expect(mockFindOneAndUpdate).toHaveBeenCalledTimes(1)
    expect(mockFindOneAndUpdate).toBeCalledWith(
      { _id: new mongo.ObjectId(MOCK_PAYLOAD.shiftId) },
      {
        $set: {
          files: {
            activityReportSummary: {
              path: MOCK_PAYLOAD.pdfs.summaryS3Path,
              timestamp: new Date(),
            },
            activityReportSummaryAndForms: {
              path: MOCK_PAYLOAD.pdfs.summaryAndFormsS3Path,
              timestamp: new Date(),
            },
            pdf: {
              path: MOCK_PAYLOAD.pdfs.summaryAndFormsS3Path,
              timestamp: new Date(),
            },
          },
        },
      },
    )
    expect.assertions(4)
  })

  it('should process object event', async () => {
    const mockFindOneAndUpdate = jest.fn()
    mongo.getCollection.mockResolvedValue({
      findOneAndUpdate: mockFindOneAndUpdate,
    })

    const event = MOCK_PAYLOAD
    await finaliseShiftReport(event)

    expect(mongo.getCollection).toHaveBeenCalledTimes(1)
    expect(mongo.getCollection).toBeCalledWith('shifts')

    expect(mockFindOneAndUpdate).toHaveBeenCalledTimes(1)
    expect(mockFindOneAndUpdate).toBeCalledWith(
      { _id: new mongo.ObjectId(MOCK_PAYLOAD.shiftId) },
      {
        $set: {
          files: {
            activityReportSummary: {
              path: MOCK_PAYLOAD.pdfs.summaryS3Path,
              timestamp: new Date(),
            },
            activityReportSummaryAndForms: {
              path: MOCK_PAYLOAD.pdfs.summaryAndFormsS3Path,
              timestamp: new Date(),
            },
            pdf: {
              path: MOCK_PAYLOAD.pdfs.summaryAndFormsS3Path,
              timestamp: new Date(),
            },
          },
        },
      },
    )
    expect.assertions(4)
  })
})
