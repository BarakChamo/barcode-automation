import * as readline from 'readline'
import fs from 'fs'
import { stdin as input, stdout as output } from 'process'
import PDFDocument from 'pdfkit'
import Printer from 'pdf-to-printer'
import OnOff from 'onoff'

const { Gpio } = OnOff

const PIN = 17
let GPIO
try {
  GPIO = new Gpio(17, 'out')
} catch (error) {}

const TIMEOUT = 3000
const PRINTER = 'POS'
const PPI = 72
const INCH_TO_MM = 25.4
const WIDTH = PPI * (58 / INCH_TO_MM)
const HEIGHT = PPI * (70 / INCH_TO_MM)
const MARGIN = PPI * (5 / INCH_TO_MM)
let printerDeviceId = ''
let busy = false

function createDocument(edition) {
  const doc = new PDFDocument({
    size: [WIDTH, HEIGHT],
    margins: { top: 0, bottom: MARGIN, left: MARGIN, right: MARGIN },
  })

  doc.pipe(fs.createWriteStream('doc.pdf'))
  doc.image('can.png', MARGIN, MARGIN, {
    align: 'center',
    valign: 'center',
    fit: [WIDTH - MARGIN * 2, WIDTH - MARGIN * 2],
  })
  doc.moveDown()
  doc.font('Times-Roman').text(`Edition #${edition.toFixed(0)}`, 10, WIDTH, { align: 'center' })

  doc
    .lineCap('butt')
    .moveTo(MARGIN, HEIGHT - MARGIN)
    .lineTo(WIDTH - MARGIN, HEIGHT - MARGIN)
    .dash(5, { space: 5 })
    .stroke()
  doc.end()
}

async function listPrinters() {
  const printers = await Printer.getPrinters()
  const printer = printers.filter(printer => printer.name.indexOf(PRINTER) >= 0)[0]

  if (!printer) console.log('Printer not found!')

  return printer.deviceId
}

function asyncDelay(delay) {
  return new Promise((res, rej) => setTimeout(res, delay))
}

let I = 1

async function onLine(line) {
  if (busy) return
  busy = true

  // turn on
  GPIO ? GPIO.writeSync(Gpio.HIGH) : console.log('ON')

  // create doc
  createDocument(I)

  // wait
  await asyncDelay(500)

  // print
  Printer.print('doc.pdf', { printer: printerDeviceId, monochrome: true })

  // wait
  await asyncDelay(TIMEOUT)

  // turn off
  GPIO ? GPIO.writeSync(Gpio.LOW) : console.log('OFF')

  I++
  busy = false
}

listPrinters().then(async printer => {
  if (!printer) return console.log('Printer not found!')
  printerDeviceId = printer
  console.log(printerDeviceId)
  const rl = readline.createInterface({ input, output })
  rl.on('line', onLine)
})

process.on('SIGINT', _ => {
  GPIO && GPIO.unexport()
})
