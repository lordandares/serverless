import * as pdfFonts from '@lighthouse/common/lib/pdf/fonts'
import * as pdfMake from 'pdfmake/build/pdfmake'

pdfMake.vfs = pdfFonts.pdfMake.vfs
pdfMake.fonts = {
  Gotham: {
    normal: 'GothamBook.ttf',
    italics: 'GothamBook.ttf',
    bold: 'GothamBold.ttf',
    bolditalics: 'GothamBold.ttf',
  },
}

export default pdfMake
