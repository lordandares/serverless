jest.mock('../pdf-make')

import pdfMake from '../pdf-make'
import getPdfBuffer from './'

describe('helpers:getPdfBuffer', () => {
  it('should return buffer', () => {
    expect.assertions(2)

    const spies = {
      getBuffer: jest.fn(),
    }

    pdfMake.createPdf.mockReturnValue({
      getBuffer: spies.getBuffer.mockImplementation(cb => {
        cb('buffer')
      }),
    })

    const definition = {
      test: 'definition',
    }

    return getPdfBuffer(definition).then(() => {
      expect(pdfMake.createPdf).toBeCalledWith(definition)
      expect(spies.getBuffer).toBeCalled()
    })
  })
})
