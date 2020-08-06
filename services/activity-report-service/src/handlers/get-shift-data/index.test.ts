jest.mock('../../helpers/build-shift-summary-pdf')
jest.mock('../../helpers/get-references')
jest.mock('../../helpers/get-shift-summary-data')

import { buildShiftSummaryPdf } from '../../helpers/build-shift-summary-pdf'
import { getFormS3Paths } from '../../helpers/get-references'
import { getShiftSummaryData } from '../../helpers/get-shift-summary-data'

import * as MockDate from 'mockdate'
import getShiftData from './'
import * as mockData from './fixtures'

describe('handlers:getShiftData', () => {
  beforeEach(() => {
    MockDate.set('2000-01-01T00:00:00.000Z')
  })

  afterEach(() => {
    jest.clearAllMocks()
    MockDate.reset()
  })

  it('should process stringified event body and return results', async () => {
    const event = { body: JSON.stringify(mockData.body) }

    getShiftSummaryData.mockResolvedValue(mockData.data)
    buildShiftSummaryPdf.mockResolvedValue(mockData.summaryS3Path)
    getFormS3Paths.mockResolvedValue(mockData.formS3Path)

    const result = await getShiftData(event)

    expect(getShiftSummaryData).toHaveBeenCalledTimes(1)
    expect(getShiftSummaryData).toBeCalledWith(mockData.body)

    expect(buildShiftSummaryPdf).toHaveBeenCalledTimes(1)
    expect(buildShiftSummaryPdf).toBeCalledWith(mockData.data)

    expect(getFormS3Paths).toHaveBeenCalledTimes(1)
    expect(getFormS3Paths).toBeCalledWith(mockData.data)

    expect(result).toEqual(mockData.referencesShouldNotSkip)

    expect.assertions(7)
  })

  it('should handle no data and return results', async () => {
    const event = mockData.body

    getShiftSummaryData.mockResolvedValue(mockData.emptyData)
    buildShiftSummaryPdf.mockResolvedValue(mockData.summaryS3Path)
    getFormS3Paths.mockResolvedValue(mockData.formS3Path)

    const result = await getShiftData(event)

    expect(getShiftSummaryData).toHaveBeenCalledTimes(1)
    expect(getShiftSummaryData).toBeCalledWith(mockData.body)

    expect(buildShiftSummaryPdf).toHaveBeenCalledTimes(1)
    expect(buildShiftSummaryPdf).toBeCalledWith(mockData.emptyData)

    expect(getFormS3Paths).toHaveBeenCalledTimes(1)
    expect(getFormS3Paths).toBeCalledWith(mockData.emptyData)

    expect(result).toEqual(mockData.referencesShouldNotSkip)

    expect.assertions(7)
  })

  it('should process object event and return results', async () => {
    const event = mockData.body

    getShiftSummaryData.mockResolvedValue(mockData.data)
    buildShiftSummaryPdf.mockResolvedValue(mockData.summaryS3Path)
    getFormS3Paths.mockResolvedValue(mockData.formS3Path)

    const result = await getShiftData(event)

    expect(getShiftSummaryData).toHaveBeenCalledTimes(1)
    expect(getShiftSummaryData).toBeCalledWith(mockData.body)

    expect(buildShiftSummaryPdf).toHaveBeenCalledTimes(1)
    expect(buildShiftSummaryPdf).toBeCalledWith(mockData.data)

    expect(getFormS3Paths).toHaveBeenCalledTimes(1)
    expect(getFormS3Paths).toBeCalledWith(mockData.data)

    expect(result).toEqual(mockData.referencesShouldNotSkip)

    expect.assertions(7)
  })
})
