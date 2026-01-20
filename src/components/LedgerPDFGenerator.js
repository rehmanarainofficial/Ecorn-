import {PDFDocument, StandardFonts, rgb} from 'pdf-lib';
import RNFetchBlob from 'react-native-blob-util';
import {ToastAndroid, PermissionsAndroid, Platform} from 'react-native';
import {formatDate, formatDateString} from '../utils/DateUtils';
import {formatNumber} from '../utils/NumberUtils';

export const generateLedgerPDF = async (
  ledgerData,
  setLoading,
  fromDate,
  toDate,
) => {
  try {
    setLoading(true);

    // --- Android Storage Permission ---
    if (Platform.OS === 'android') {
      const sdk = parseInt(Platform.Version, 10);
      if (sdk < 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission Required',
            message: 'App needs access to save PDF file.',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          ToastAndroid.show('Storage permission denied!', ToastAndroid.SHORT);
          setLoading(false);
          return;
        }
      }
    }

    // --- Create PDF ---
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595.28, 841.89]);
    const {width, height} = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = height - 50;
    const lineHeight = 18;
    const drawText = (
      text,
      x,
      y,
      size = 11,
      bold = false,
      color = rgb(0, 0, 0),
    ) => {
      page.drawText(String(text), {
        x,
        y,
        size,
        font: bold ? fontBold : font,
        color,
      });
    };
    const addSpace = (space = lineHeight) => (y -= space);

    // --- Header ---
    drawText('Ledger Transactions Report', 50, y, 18, true, rgb(0.2, 0.2, 0.2));
    addSpace(25);

    const firstTx = ledgerData?.[0]?.transactions?.[0]?.person_name || 'N/A';
    const customerName = firstTx;
    const currentDate = formatDate(new Date());

    drawText(`Customer: ${customerName}`, 50, y, 12, true);
    drawText(`Company: Ercon Industries Pvt. Ltd`, 300, y, 12, true);
    addSpace(15);

    drawText(`From: ${fromDate}   To: ${toDate}`, 50, y, 11);
    drawText(`Generated on: ${currentDate}`, 300, y, 11);
    addSpace(20);

    // --- Table Header ---
    const colX = [50, 150, 300, 420, 500];
    ['Date', 'Reference', 'Name', 'Amount', 'Balance'].forEach((h, i) =>
      drawText(h, colX[i], y, 11, true),
    );
    addSpace(15);

    page.drawLine({
      start: {x: 50, y},
      end: {x: width - 50, y},
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    addSpace(10);

    // --- Table Rows ---
    ledgerData.forEach(section => {
      section.transactions.forEach(tx => {
        drawText(formatDateString(section.date), colX[0], y, 10);
        drawText(tx.reference || '-', colX[1], y, 10);
        drawText(tx.person_name.slice(0, 20) + '..' || '-', colX[2], y, 10);
        drawText(formatNumber(tx.amount || 0), colX[3], y, 10);
        drawText(formatNumber(tx.balance || 0), colX[4], y, 10);
        addSpace(15);

        if (tx.memo) {
          drawText(
            `Memo: ${tx.memo}`,
            colX[0],
            y,
            9,
            false,
            rgb(0.3, 0.3, 0.3),
          );
          addSpace(12);
        }

        if (y < 80) {
          y = height - 50;
          page = pdfDoc.addPage([595.28, 841.89]);
        }
      });
    });

    addSpace(20);
    drawText(
      'FATIMA BOARD AND PAPER MILL (PVT) LTD',
      150,
      y,
      11,
      false,
      rgb(0.5, 0.5, 0.5),
    );

    // --- File Naming ---
    const safeName = (customerName || 'Ledger_Report').replace(
      /[^a-zA-Z0-9_]/g,
      '_',
    );
    const fileName = `${safeName}_${Date.now()}.pdf`;

    // --- Public Downloads Folder ---
    const downloadDir = '/storage/emulated/0/Download';
    const appFolder = `${downloadDir}/MyAppReports`;
    await RNFetchBlob.fs.mkdir(appFolder).catch(() => {});
    const filePath = `${appFolder}/${fileName}`;

    // --- Save PDF bytes as base64 (pure RN compatible) ---
    const pdfBytes = await pdfDoc.save(); // Uint8Array
    // Convert Uint8Array to base64 manually
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < pdfBytes.length; i += chunkSize) {
      const subArray = pdfBytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, subArray);
    }
    const base64Data = RNFetchBlob.base64.encode(binary);

    await RNFetchBlob.fs.writeFile(filePath, base64Data, 'base64');

    console.log('PDF saved at public Downloads:', filePath);
    ToastAndroid.show(`PDF saved to Downloads/MyAppReports`, ToastAndroid.LONG);
  } catch (err) {
    console.error('PDF generation failed:', err);
    ToastAndroid.show('PDF generation failed!', ToastAndroid.SHORT);
  } finally {
    setLoading(false);
  }
};
