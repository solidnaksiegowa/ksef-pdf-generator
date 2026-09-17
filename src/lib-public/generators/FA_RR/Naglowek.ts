import { Content, ContentText } from 'pdfmake/interfaces';
import { formatText, getValue } from '../../../shared/PDF-functions';
import { TRodzajFaktury } from '../../../shared/consts/FA.const';
import { FakturaRR as Fa } from '../../types/FaRR.types';
import FormatTyp, { Position } from '../../../shared/enums/common.enum';
import { AdditionalDataTypes } from '../../types/common.types';
import i18n from 'i18next';

export function generateNaglowek(fa?: Fa, additionalData?: AdditionalDataTypes): Content[] {
  const toRightAlignedText = (
    value: string | number | undefined | null,
    format: FormatTyp | FormatTyp[]
  ): ContentText => {
    const node = formatText(value, format);

    if (typeof node === 'string') {
      return {
        text: node || ' ',
        alignment: Position.RIGHT,
      };
    }

    return {
      ...node,
      alignment: Position.RIGHT,
    };
  };

  let invoiceName = '';

  switch (getValue(fa?.RodzajFaktury)) {
    case TRodzajFaktury.VAT_RR:
      invoiceName = i18n.t('invoice.header.primalInvoiceVatRr');
      break;
    case TRodzajFaktury.KOR_VAT_RR:
      invoiceName = i18n.t('invoice.header.correctedInvoiceVatRr');
      break;
  }

  return [
    {
      text: [
        { text: i18n.t('invoice.header.ksefPart1'), fontSize: 18 },
        { text: i18n.t('invoice.header.ksefPart2'), color: 'red', bold: true, fontSize: 18 },
        { text: i18n.t('invoice.header.ksefPart3'), bold: true, fontSize: 18 },
      ],
    },
    {
      ...toRightAlignedText(i18n.t('invoice.header.invoiceNumberLabel'), FormatTyp.ValueMedium),
    },
    {
      ...toRightAlignedText(getValue(fa?.P_4C), FormatTyp.HeaderPosition),
    },
    {
      ...toRightAlignedText(invoiceName, [FormatTyp.ValueMedium, FormatTyp.Default]),
    },
    ...(additionalData?.nrKSeF
      ? [
          {
            text: [
              formatText(i18n.t('invoice.header.ksefNumberLabel'), FormatTyp.LabelMedium) as ContentText,
              formatText(additionalData?.nrKSeF, FormatTyp.ValueMedium),
            ],
            alignment: Position.RIGHT,
          } as Content,
        ]
      : []),
    ...(additionalData?.acDate
      ? [
          {
            text: [
              formatText(i18n.t('invoice.header.acquisitionDate'), FormatTyp.LabelMedium),
              ' ',
              formatText(additionalData?.acDate, FormatTyp.ValueMedium),
            ],
            alignment: Position.RIGHT,
          } as Content,
        ]
      : []),
  ];
}
