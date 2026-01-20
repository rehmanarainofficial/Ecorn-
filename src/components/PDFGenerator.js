import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import RNBlobUtil from 'react-native-blob-util';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { formatDate, formatDateString } from '../utils/DateUtils';
import { formatNumber, formatQuantity } from '../utils/NumberUtils';
import FileViewer from 'react-native-file-viewer';

export const generateAndDownloadPDF = async (data, reference) => {
  try {
    const header = data.data_header?.[0];
    const details = data.data_detail || [];

    // Check if it's a quotation - check multiple variations
    const documentType = header?.type || 'Document';
    const typeLC = documentType.toLowerCase();
    const isQuotation = typeLC.includes('quotation') ||
      typeLC.includes('quote') ||
      typeLC === 'sq' ||
      typeLC.includes('sales quote');

    console.log('PDF Type:', documentType, '| Is Quotation:', isQuotation);

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Add a page with A4 size
    let page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();

    // Embed fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let yPosition = height - 50;

    // Title - Use type from header data
    page.drawText(`${documentType} - ${reference}`, {
      x: 50,
      y: yPosition,
      size: 16,
      font: boldFont,
      color: rgb(0.2, 0.4, 0.6),
    });
    yPosition -= 40;

    // Header Information - Simple and clean
    page.drawText('Document Information', {
      x: 50,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: rgb(0.2, 0.4, 0.6),
    });
    yPosition -= 25;

    // Build header fields - exclude Location for quotations
    const headerFields = [
      { label: 'Reference:', value: header?.reference },
      { label: 'Date:', value: formatDateString(header?.trans_date) },
      { label: 'Due Date:', value: formatDateString(header?.due_date) },
      { label: 'Type:', value: header?.type },
      { label: 'Customer:', value: header?.name },
      // Only include Cost center if NOT a quotation
      ...(!isQuotation ? [{ label: 'Cost center:', value: header?.location_name }] : []),
      { label: 'Salesman:', value: header?.salesman },
      { label: 'Payment Terms:', value: header?.payment_terms },
      { label: 'Total Amount:', value: formatNumber(header?.total) },
    ];

    headerFields.forEach(field => {
      if (field.value) {
        page.drawText(`${field.label}`, {
          x: 50,
          y: yPosition,
          size: 10,
          font: boldFont,
          color: rgb(0.3, 0.3, 0.3),
        });

        page.drawText(field.value.toString(), {
          x: 150,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        });
        yPosition -= 15;
      }
    });

    // Comments
    if (header?.comments) {
      yPosition -= 10;
      page.drawText('Comments:', {
        x: 50,
        y: yPosition,
        size: 11,
        font: boldFont,
        color: rgb(0.2, 0.4, 0.6),
      });
      yPosition -= 15;

      const comments = cleanText(header.comments);
      const lines = wrapText(comments, width - 100, 9, font);

      lines.forEach(line => {
        if (yPosition < 100) {
          page = pdfDoc.addPage([595, 842]);
          yPosition = height - 50;
        }

        page.drawText(line, {
          x: 50,
          y: yPosition,
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
        });
        yPosition -= 10;
      });

      yPosition -= 10;
    }

    yPosition -= 20;

    // Line Items - Card style layout
    if (details.length > 0) {
      page.drawText('Line Items', {
        x: 50,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: rgb(0.2, 0.4, 0.6),
      });
      yPosition -= 30;

      details.forEach((item, index) => {
        // Check if we need a new page before starting new item
        if (yPosition < 200) {
          page = pdfDoc.addPage([595, 842]);
          yPosition = height - 50;
        }

        // Draw card background
        const cardHeight = item.long_description ? 140 : 100;
        page.drawRectangle({
          x: 45,
          y: yPosition - cardHeight + 20,
          width: width - 90,
          height: cardHeight,
          color: rgb(0.95, 0.95, 0.95),
          borderColor: rgb(0.8, 0.8, 0.8),
          borderWidth: 1,
        });

        // Item header with serial number
        page.drawText(`Item ${index + 1}`, {
          x: 55,
          y: yPosition,
          size: 11,
          font: boldFont,
          color: rgb(0.2, 0.4, 0.6),
        });
        yPosition -= 25;

        // Card style layout - Labels on top, values below
        const cardStartX = 55;
        const columnWidth = 100;

        // Row 1: Stock ID, Qty, Unit Price, Total
        const row1Items = [
          { label: 'Stock ID', value: item.stock_id || 'N/A' },
          { label: 'Qty', value: formatQuantity(item.quantity) },
          { label: 'Unit Price', value: formatNumber(item.unit_price) },
          { label: 'Total', value: formatNumber(parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0)) },
        ];

        row1Items.forEach((field, colIndex) => {
          const xPos = cardStartX + (colIndex * columnWidth);

          // Label on top
          page.drawText(field.label, {
            x: xPos,
            y: yPosition,
            size: 8,
            font: boldFont,
            color: rgb(0.4, 0.4, 0.4),
          });

          // Value below
          page.drawText(field.value.toString(), {
            x: xPos,
            y: yPosition - 12,
            size: 10,
            font: font,
            color: rgb(0, 0, 0),
          });
        });

        yPosition -= 35;

        // Row 2: Discount (if applicable)
        if (item.discount_percent && parseFloat(item.discount_percent) > 0) {
          page.drawText('Discount', {
            x: cardStartX,
            y: yPosition,
            size: 8,
            font: boldFont,
            color: rgb(0.4, 0.4, 0.4),
          });

          page.drawText(`${item.discount_percent}%`, {
            x: cardStartX,
            y: yPosition - 12,
            size: 10,
            font: font,
            color: rgb(0, 0, 0),
          });

          yPosition -= 30;
        }

        // Long Description with proper text wrapping
        if (item.long_description) {
          page.drawText('Description', {
            x: cardStartX,
            y: yPosition,
            size: 8,
            font: boldFont,
            color: rgb(0.4, 0.4, 0.4),
          });
          yPosition -= 12;

          const longDesc = cleanText(item.long_description);
          const descLines = wrapText(longDesc, width - 120, 8, font);
          const maxLines = 3; // Limit description lines in card

          descLines.slice(0, maxLines).forEach(line => {
            page.drawText(line, {
              x: cardStartX,
              y: yPosition,
              size: 8,
              font: font,
              color: rgb(0.2, 0.2, 0.2),
            });
            yPosition -= 10;
          });

          if (descLines.length > maxLines) {
            page.drawText('...', {
              x: cardStartX,
              y: yPosition,
              size: 8,
              font: font,
              color: rgb(0.5, 0.5, 0.5),
            });
            yPosition -= 10;
          }
        }

        yPosition -= 25;
      });
    }

    // Footer with page numbers
    const totalPages = pdfDoc.getPageCount();
    pdfDoc.getPages().forEach((p, index) => {
      p.drawText(`Page ${index + 1} of ${totalPages}`, {
        x: width - 100,
        y: 30,
        size: 8,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });

      p.drawText(`Generated on: ${formatDate(new Date())}`, {
        x: 50,
        y: 30,
        size: 8,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });
    });

    const pdfBytes = await pdfDoc.save();
    const downloadDir = RNBlobUtil.fs.dirs.DownloadDir;
    const fileName = `${reference}_${Date.now()}.pdf`;

    let downloadPath;
    if (Platform.OS === 'android') {
      downloadPath = `/storage/emulated/0/Download/${fileName}`;
    } else {
      downloadPath = `${downloadDir}/${fileName}`;
    }

    const pdfBase64 = arrayBufferToBase64(pdfBytes);
    await RNBlobUtil.fs.writeFile(downloadPath, pdfBase64, 'base64');

    // Show notification in notification panel (Android)
    if (Platform.OS === 'android') {
      await RNBlobUtil.android.addCompleteDownload({
        title: `${reference}.pdf`,
        description: 'PDF Downloaded Successfully',
        mime: 'application/pdf',
        path: downloadPath,
        showNotification: true,
        notification: true,
      });
    }

    Toast.show({
      type: 'success',
      text1: 'PDF Downloaded Successfully',
      text2: 'Tap notification to open PDF',
      visibilityTime: 3000,
      onPress: () => {
        // Open PDF when toast is tapped
        FileViewer.open(downloadPath, { showOpenWithDialog: true }).catch(err => {
          console.log('Error opening file:', err);
        });
      },
    });

    console.log('PDF saved to:', downloadPath);
    return downloadPath;
  } catch (error) {
    console.log('PDF Generation Error:', error);
    throw error;
  }
};

// Improved text cleaning function
const cleanText = text => {
  if (!text) return '';

  return (
    text
      // Replace HTML entities
      .replace(/&#039;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      // Replace newline characters with spaces
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ')
      // Remove multiple spaces
      .replace(/\s+/g, ' ')
      .trim()
  );
};

// Improved wrapText function that handles special characters
const wrapText = (text, maxWidth, fontSize, font) => {
  const lines = [];
  const words = text.split(' ');
  let currentLine = '';

  words.forEach(word => {
    // Clean each word from any special characters
    const cleanWord = word.replace(/[^\x20-\x7E]/g, '');

    if (cleanWord === '') return; // Skip empty words

    const testLine = currentLine ? `${currentLine} ${cleanWord}` : cleanWord;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = cleanWord;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

const arrayBufferToBase64 = buffer => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};
