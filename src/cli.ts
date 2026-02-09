import { promises as fs } from 'node:fs';
import path from 'node:path';
import { TCreatedPdf } from 'pdfmake/build/pdfmake';
import { generateFA1 } from './lib-public/FA1-generator';
import { generateFA2 } from './lib-public/FA2-generator';
import { generateFA3 } from './lib-public/FA3-generator';
import { AdditionalDataTypes } from './lib-public/types/common.types';
import { parseXMLString } from './shared/XML-parser';

type CliOptions = {
  inputPath: string;
  outputPath: string;
  nrKSeF: string;
  qrCode?: string;
};

function printUsage(): void {
  const lines = [
    'Usage: npm run cli -- <input.xml> [--out <output.pdf>] [--nrKSeF <value>] [--qrCode <url>]',
    '',
    'Options:',
    '  --out, -o     Output PDF path (default: <input>.pdf)',
    '  --nrKSeF      KSeF number to render in footer (optional)',
    '  --qrCode      QR verification URL (optional)',
    '  --help, -h    Show this help',
  ];

  console.log(lines.join('\n'));
}

function parseArgs(args: string[]): CliOptions {
  let inputPath = '';
  let outputPath = '';
  let nrKSeF = '';
  let qrCode: string | undefined;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (!arg.startsWith('-') && !inputPath) {
      inputPath = arg;
      continue;
    }

    switch (arg) {
      case '--out':
      case '-o':
        outputPath = args[i + 1] ?? '';
        i += 1;
        break;
      case '--nrKSeF':
        nrKSeF = args[i + 1] ?? '';
        i += 1;
        break;
      case '--qrCode':
        qrCode = args[i + 1] ?? '';
        i += 1;
        break;
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!inputPath) {
    throw new Error('Missing input XML path.');
  }

  if (!outputPath) {
    const parsed = path.parse(inputPath);
    outputPath = path.join(parsed.dir, `${parsed.name}.pdf`);
  }

  return { inputPath, outputPath, nrKSeF, qrCode };
}

function createPdfFromXml(xml: unknown, additionalData: AdditionalDataTypes): TCreatedPdf {
  const wersja: string | undefined = (xml as any)?.Faktura?.Naglowek?.KodFormularza?._attributes?.kodSystemowy;

  switch (wersja) {
    case 'FA (1)':
      return generateFA1((xml as any).Faktura, additionalData);
    case 'FA (2)':
      return generateFA2((xml as any).Faktura, additionalData);
    case 'FA (3)':
      return generateFA3((xml as any).Faktura, additionalData);
    default:
      throw new Error(`Unsupported invoice version: ${wersja ?? 'unknown'}`);
  }
}

function pdfToBuffer(pdf: TCreatedPdf): Promise<Buffer> {
  return new Promise((resolve, reject): void => {
    try {
      pdf.getBuffer((buffer: Uint8Array): void => {
        resolve(Buffer.from(buffer));
      });
    } catch (error) {
      reject(error);
    }
  });
}

async function main(): Promise<void> {
  try {
    const options = parseArgs(process.argv.slice(2));
    const xmlContent = await fs.readFile(options.inputPath, 'utf8');
    const xml = parseXMLString(xmlContent);

    const additionalData: AdditionalDataTypes = {
      nrKSeF: options.nrKSeF,
      qrCode: options.qrCode,
    };

    const pdf = createPdfFromXml(xml, additionalData);
    const buffer = await pdfToBuffer(pdf);

    await fs.writeFile(options.outputPath, buffer);
    console.log(`Saved PDF to ${options.outputPath}`);
  } catch (error) {
    console.error((error as Error).message);
    printUsage();
    process.exit(1);
  }
}

main();
