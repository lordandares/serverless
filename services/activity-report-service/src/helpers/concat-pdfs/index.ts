import { each } from 'lodash/fp'
import * as uuid from 'node-uuid'

import * as hummus from '@lighthouse/hummus-lambda'

export async function concatPdfs(filePaths, directoryPath) {
  const fileName = 'output.pdf'
  const filePath = `${directoryPath}/${fileName}`

  const pdfWriter = hummus.createWriter(filePath)
  each(path => appendPDFPageFromPDFWithAnnotations(pdfWriter, path), filePaths)
  pdfWriter.end()

  return filePath
}

/* istanbul ignore next */
function appendPDFPageFromPDFWithAnnotations(pdfWriter, sourcePDFPath) {
  const cpyCxt = pdfWriter.createPDFCopyingContext(sourcePDFPath)
  const cpyCxtParser = cpyCxt.getSourceDocumentParser()

  for (let i = 0; i < cpyCxtParser.getPagesCount(); ++i) {
    const pageDictionary = cpyCxtParser.parsePageDictionary(i)

    if (!pageDictionary.exists('Annots')) {
      // no annotation. append as is
      cpyCxt.appendPDFPageFromPDF(i)
    } else {
      // this let here will save any reffed objects from the copied annotations object.
      // they will be written after the page copy writing as to not to disturb the
      // page object writing itself.
      let reffedObjects

      pdfWriter.getEvents().once('OnPageWrite', params => {
        // using the page write event, write the new annotations. just copy the object
        // as is, saving any referenced objects for future writes
        params.pageDictionaryContext.writeKey('Annots')
        reffedObjects = cpyCxt.copyDirectObjectWithDeepCopy(
          pageDictionary.queryObject('Annots'),
        )
      })
      // write page. this will trigger the event
      cpyCxt.appendPDFPageFromPDF(i)
      // now write the reffed object (should be populated cause onPageWrite was written)
      // note that some or all annotations may be embedded, in which case this array
      // wont hold all annotation objects
      if (reffedObjects && reffedObjects.length > 0) {
        cpyCxt.copyNewObjectsForDirectObject(reffedObjects)
      }
    }
  }
}
