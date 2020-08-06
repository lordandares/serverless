const mockEnd = jest.fn()
const mockV4 = jest.fn()

const mockCreateWriter = jest.fn().mockReturnValue({
  createPDFCopyingContext: jest.fn().mockReturnValue({
    getSourceDocumentParser: jest.fn().mockReturnValue({
      getPagesCount: jest.fn().mockReturnValue(0),
    }),
  }),
  end: mockEnd,
})
jest.mock('@lighthouse/hummus-lambda', () => ({
  createWriter: mockCreateWriter,
}))
jest.mock('node-uuid', () => ({ v4: mockV4 }))

import { concatPdfs } from './'

describe('helpers:concatPdfs', () => {
  const MOCK_DIRECTORY = '/tmp/1111-2222-3333-4444/'
  const MOCK_FILE_PATHS = ['tmp/1234-5678-1234-56789/1111-2222-3333-4444.pdf']

  afterEach(() => jest.clearAllMocks())

  it('iterates file paths and creates merged pdf', async () => {
    const filePath = await concatPdfs(MOCK_FILE_PATHS, MOCK_DIRECTORY)

    expect(mockCreateWriter).toHaveBeenCalledTimes(1)
    expect(mockCreateWriter).toBeCalledWith(`${MOCK_DIRECTORY}/output.pdf`)
    expect(mockEnd).toHaveBeenCalledTimes(1)

    expect(filePath).toEqual(`${MOCK_DIRECTORY}/output.pdf`)
  })
})
