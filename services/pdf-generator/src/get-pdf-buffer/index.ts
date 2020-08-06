import { promisify } from 'bluebird'
import pdfMake from '../pdf-make'

function getPdfBuffer(docDefinition: object, callback) {
  const pdfDocGenerator = pdfMake.createPdf(docDefinition)

  console.info('get-pdf-buffer')

  return pdfDocGenerator.getBuffer(buffer => {
    callback(null, buffer)
  })
}

export default promisify(getPdfBuffer)
