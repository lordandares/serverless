import pdfMake from '../pdf-make'
import { promisify } from 'bluebird'

function getPdfBuffer(docDefinition: object, callback) {
  const pdfDocGenerator = pdfMake.createPdf(docDefinition)

  return pdfDocGenerator.getBuffer(buffer => {
    callback(null, buffer)
  })
}

export default promisify(getPdfBuffer)
