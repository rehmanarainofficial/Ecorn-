import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
  StatusBar,
  Platform,
  ScrollView,
  PermissionsAndroid,
  ToastAndroid,
  Alert,
} from 'react-native';
import axios from 'axios';
import {BASEURL} from '../../../../utils/BaseUrl';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {APPCOLORS} from '../../../../utils/APPCOLORS';
import DatePicker from 'react-native-date-picker';
import moment from 'moment';
import PlatformGradient from '../../../../components/PlatformGradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {formatNumber} from '../../../../utils/NumberUtils';
import Orientation from 'react-native-orientation-locker';
import {PDFDocument, StandardFonts, rgb} from 'pdf-lib';
import RNBlobUtil from 'react-native-blob-util';
import FileViewer from 'react-native-file-viewer';

const Ledger = ({navigation, route}) => {
  const {name, item} = route.params;
  
  const insets = useSafeAreaInsets();

  const [aging, setAgingData] = useState([]);
  const [opening, setOpening] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);

  const [fromDate, setFromDate] = useState(new Date());
  const [openFrom, setOpenFrom] = useState(false);

  const [EndDate, setEndDate] = useState(new Date());
  const [openEnd, setOpenEnd] = useState(false);

  const [Loader, setLoader] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Lock to Landscape orientation when screen opens
  useEffect(() => {
    Orientation.lockToLandscape();
    
    // Cleanup: Unlock orientation when leaving screen
    return () => {
      Orientation.lockToPortrait();
    };
  }, []);

  useEffect(() => {
    const nav = navigation.addListener('focus', () => {
      // Re-lock to landscape when screen comes back into focus
      Orientation.lockToLandscape();
      
      if (name === 'Customer') getLeger();
      else if (name === 'Suppliers') getSupplierLeger();
      else if (name === 'Items') getItemsLedger();
      else if (name === 'Banks') getBanksLeger();
      else if (name === 'Audit') getAuditLedger();
      else if (name === 'ShortTermLoan') getShortTermLoanLedger();
    });

    const blurNav = navigation.addListener('blur', () => {
      // Unlock to portrait when leaving screen
      Orientation.lockToPortrait();
    });

    return () => {
      nav();
      blurNav();
    };
  }, [navigation]);

  useEffect(() => {
    if (name === 'Customer') getLeger();
    else if (name === 'Suppliers') getSupplierLeger();
    else if (name === 'Items') getItemsLedger();
    else if (name === 'Banks') getBanksLeger();
    else if (name === 'Audit') getAuditLedger();
    else if (name === 'ShortTermLoan') getShortTermLoanLedger();
  }, [fromDate, EndDate]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);
  const getLeger = () => {
    setLoader(true);
    let data = new FormData();
    data.append('customer_id', item.customer_id);
    data.append(
      'from_date',
      moment(fromDate).subtract(1, 'months').format('YYYY-MM-DD'),
    );
    data.append('to_date', moment(EndDate).format('YYYY-MM-DD'));

    axios
      .post(`${BASEURL}dash_cust_ledger.php`, data, {
        headers: {'Content-Type': 'multipart/form-data'},
        timeout: 30000,
      })
      .then(res => {
        setAgingData(res.data.data_cust_age || []);
        setOpening(res.data.opening || 0);
        console.log("res.data.data_cust_age", res.data.opening);
        
        calculateClosingBalance(res.data.data_cust_age, res.data.opening);
      })
      .catch(error => {
        console.log(' API Error Details:', {
          message: error.message,
          code: error.code,
          response: error.response,
          request: error.request,
        });
      })
      .finally(() => setLoader(false));
  };

  const getSupplierLeger = () => {
    setLoader(true);
    let data = new FormData();
    data.append('supplier_id', item.supplier_id);
    data.append('supplier_id', item.supplier_id);
    data.append(
      'from_date',
      moment(fromDate).subtract(1, 'months').format('YYYY-MM-DD'),
    );
    data.append('to_date', moment(EndDate).format('YYYY-MM-DD'));

    axios
      .post(`${BASEURL}dash_supp_ledger.php`, data, {
        headers: {'Content-Type': 'multipart/form-data'},
      })
      .then(res => {
        setAgingData(res.data.data_cust_age);
        console.log('Supplier Ledger Response:', res);
        setOpening(res.data.opening);
        calculateClosingBalance(res.data.data_cust_age, res.data.opening);
      })
      .catch(console.log)
      .finally(() => setLoader(false));
  };

  const getItemsLedger = () => {
    setLoader(true);
    let data = new FormData();
    data.append('stock_id', item?.stock_id);
    console.log('Item stock_id:', item?.stock_id);

    axios
      .post(`${BASEURL}dash_item_ledger.php`, data, {
        headers: {'Content-Type': 'multipart/form-data'},
      })
      .then(res => {
        setAgingData(res.data.data_cust_age);
        console.log(res);

        setOpening(0);
        setClosingBalance(0);
      })
      .catch(console.log)
      .finally(() => setLoader(false));
  };

  const getBanksLeger = () => {
    setLoader(true);
    let data = new FormData();
    data.append('id', item?.id);
    data.append(
      'from_date',
      moment(fromDate).subtract(1, 'months').format('YYYY-MM-DD'),
    );
    data.append('to_date', moment(EndDate).format('YYYY-MM-DD'));

    axios
      .post(`${BASEURL}dash_bank_ledger.php`, data, {
        headers: {'Content-Type': 'multipart/form-data'},
      })
      .then(res => {
        setAgingData(res.data.data_bank_ledger);
        setOpening(0);
        calculateClosingBalance(res.data.data_bank_ledger, 0);
        console.log("res.data.data_bank_ledger", res.data.data_bank_ledger);
        
      })
      .catch(console.log)
      .finally(() => setLoader(false));
  };

  const getAuditLedger = () => {
    setLoader(true);
    let data = new FormData();
    data.append(
      'from_date',
      moment(fromDate).subtract('days', 10).format('YYYY-MM-DD'),
    );
    data.append('to_date', moment(EndDate).format('YYYY-MM-DD'));

    axios
      .post(`${BASEURL}dash_audit_ledger.php`, data, {
        headers: {'content-type': 'multipart/form-data'},
      })
      .then(res => {
        setAgingData(res.data.data_audit_age);
        setOpening(0);
        setClosingBalance(0);
      })
      .catch(console.log)
      .finally(() => setLoader(false));
  };

  const getShortTermLoanLedger = () => {
    setLoader(true);
    let data = new FormData();
    data.append('account', item?.account_code);
    data.append(
      'from_date',
      moment(fromDate).subtract(1, 'months').format('YYYY-MM-DD'),
    );
    data.append('to_date', moment(EndDate).format('YYYY-MM-DD'));

    axios
      .post(`${BASEURL}gl_account_inquiry.php`, data, {
        headers: {'Content-Type': 'multipart/form-data'},
      })
      .then(res => {
        if (res.data?.status === 'true') {
          // Transform GL data to match Ledger structure
          const openingBal = parseFloat(res.data.opening) || 0;
          console.log("openingBal", openingBal);
          
          let currentBalance = openingBal;
          const transformedData = (res.data.data || []).map(tx => {
            const amount = parseFloat(tx.amount) || 0;
            const debit = amount < 0 ? Math.abs(amount) : 0;
            const credit = amount > 0 ? amount : 0;
            currentBalance = currentBalance + amount; // GL amount is already signed usually

            return {
              reference: tx.reference,
              tran_date: tx.doc_date,
              debit: debit,
              credit: credit,
              balance: currentBalance,
              memo: tx.memo,
              person: tx.person_name,
            };
          });

          setAgingData(transformedData);
          setOpening(openingBal);
          setClosingBalance(currentBalance);
        } else {
          setAgingData([]);
          setOpening(0);
          setClosingBalance(0);
        }
      })
      .catch(err => {
        console.log('ShortTermLoan Ledger Error:', err);
        setAgingData([]);
      })
      .finally(() => setLoader(false));
  };

  const calculateClosingBalance = (transactions, openingBalance) => {
    if (!transactions || !Array.isArray(transactions)) {
      setClosingBalance(openingBalance);
      setTotalDebit(0);
      setTotalCredit(0);
      return;
    }

    let currentBalance = parseFloat(openingBalance) || 0;
    let debitSum = 0;
    let creditSum = 0;

    transactions.forEach(transaction => {
      const debit = parseFloat(transaction.debit) || 0;
      const credit = parseFloat(transaction.credit) || 0;
      debitSum += debit;
      creditSum += credit;
      currentBalance = currentBalance + debit - credit;
    });

    setTotalDebit(debitSum);
    setTotalCredit(creditSum);
    setClosingBalance(currentBalance);
  };

  const handleDownload = async () => {
    if (aging.length === 0) {
      if (Platform.OS === 'android') {
        ToastAndroid.show('No data to download!', ToastAndroid.SHORT);
      } else {
        Alert.alert('Error', 'No data to download!');
      }
      return;
    }

    try {
      setDownloadLoading(true);

      // Request storage permission for Android
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
            setDownloadLoading(false);
            return;
          }
        }
      }

      // Create PDF Document (Landscape)
      const pdfDoc = await PDFDocument.create();
      let page = pdfDoc.addPage([841.89, 595.28]); // Landscape A4
      const {width, height} = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      let y = height - 40;
      const lineHeight = 16;
      const margin = 30;

      const drawText = (text, x, yPos, size = 10, bold = false, color = rgb(0, 0, 0)) => {
        page.drawText(String(text || ''), {
          x,
          y: yPos,
          size,
          font: bold ? fontBold : font,
          color,
        });
      };

      const addNewPage = () => {
        page = pdfDoc.addPage([841.89, 595.28]);
        y = height - 40;
      };

      // Header
      drawText(getTitle(), margin, y, 16, true, rgb(0.13, 0.13, 0.47));
      y -= 20;

      drawText(`Account: ${getAccountName()}`, margin, y, 11, true);
      drawText(`Company: Ercon Industries Pvt. Ltd`, width - 250, y, 11, true);
      y -= 15;

      const fromDateStr = moment(fromDate).subtract(1, 'months').format('DD/MM/YYYY');
      const toDateStr = moment(EndDate).format('DD/MM/YYYY');
      drawText(`From: ${fromDateStr}   To: ${toDateStr}`, margin, y, 10);
      drawText(`Generated: ${moment().format('DD/MM/YYYY HH:mm')}`, width - 200, y, 10);
      y -= 20;

      // Balance Info
      drawText(`Opening Balance: ${formatNumber(opening)}`, margin, y, 10, true);
      drawText(`Net Difference: ${formatNumber(totalDebit - totalCredit)}`, 250, y, 10, true);
      drawText(`Closing Balance: ${formatNumber(closingBalance)}`, 450, y, 10, true);
      y -= 25;

      // Table Header
      const colWidths = [100, 80, 100, 150, 90, 90, 90];
      const colX = [margin];
      for (let i = 1; i < colWidths.length; i++) {
        colX.push(colX[i - 1] + colWidths[i - 1]);
      }
      const headers = ['Reference', 'Date', 'Counter', 'Particular', 'Debit', 'Credit', 'Balance'];

      // Draw header background
      page.drawRectangle({
        x: margin,
        y: y - 5,
        width: width - 2 * margin,
        height: 20,
        color: rgb(0.13, 0.13, 0.47),
      });

      headers.forEach((header, index) => {
        drawText(header, colX[index] + 5, y, 9, true, rgb(1, 1, 1));
      });
      y -= 25;

      // Table Rows
      aging.forEach((item, index) => {
        if (y < 60) {
          addNewPage();
          // Redraw header on new page
          page.drawRectangle({
            x: margin,
            y: y - 5,
            width: width - 2 * margin,
            height: 20,
            color: rgb(0.13, 0.13, 0.47),
          });
          headers.forEach((header, idx) => {
            drawText(header, colX[idx] + 5, y, 9, true, rgb(1, 1, 1));
          });
          y -= 25;
        }

        // Alternating row background
        if (index % 2 === 0) {
          page.drawRectangle({
            x: margin,
            y: y - 5,
            width: width - 2 * margin,
            height: 18,
            color: rgb(0.96, 0.96, 0.96),
          });
        }

        // Draw row data
        const reference = item.reference || '';
        const date = formatDateDisplay(item.tran_date || item.trans_date || item.date || '');
        const counter = item.account || item.account_name || '';
        const particular = (item.particular || item.memo || item.person || '').substring(0, 25);
        const debit = parseFloat(item.debit) || 0;
        const credit = Math.abs(parseFloat(item.credit) || 0);
        const balance = Math.abs(parseFloat(item.balance) || 0);

        drawText(reference.substring(0, 15), colX[0] + 5, y, 8);
        drawText(date, colX[1] + 5, y, 8);
        drawText(counter.substring(0, 15), colX[2] + 5, y, 8);
        drawText(particular, colX[3] + 5, y, 8);
        drawText(debit ? formatNumber(debit) : '', colX[4] + 5, y, 8);
        drawText(credit ? formatNumber(credit) : '', colX[5] + 5, y, 8);
        drawText(balance ? formatNumber(balance) : '', colX[6] + 5, y, 8);

        y -= 18;
      });

      // Totals Row
      y -= 5;
      page.drawRectangle({
        x: margin,
        y: y - 5,
        width: width - 2 * margin,
        height: 20,
        color: rgb(0.9, 0.9, 0.9),
      });
      page.drawLine({
        start: {x: margin, y: y + 15},
        end: {x: width - margin, y: y + 15},
        thickness: 1,
        color: rgb(0.13, 0.13, 0.47),
      });

      drawText('TOTAL', colX[0] + 5, y, 9, true);
      drawText(formatNumber(totalDebit), colX[4] + 5, y, 9, true, rgb(0.13, 0.13, 0.47));
      drawText(formatNumber(Math.abs(totalCredit)), colX[5] + 5, y, 9, true, rgb(0.13, 0.13, 0.47));
      drawText(formatNumber(Math.abs(closingBalance)), colX[6] + 5, y, 9, true, rgb(0.13, 0.13, 0.47));

      // Generate filename: ledgername_fromdate_todate
      const safeLedgerName = getAccountName().replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
      const safeFromDate = moment(fromDate).subtract(1, 'months').format('DDMMYYYY');
      const safeToDate = moment(EndDate).format('DDMMYYYY');
      const fileName = `${safeLedgerName}_${safeFromDate}_${safeToDate}.pdf`;

      // Save PDF
      const pdfBytes = await pdfDoc.save();
      let binary = '';
      const chunkSize = 0x8000;
      for (let i = 0; i < pdfBytes.length; i += chunkSize) {
        const subArray = pdfBytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, subArray);
      }
      const base64Data = RNBlobUtil.base64.encode(binary);

      let filePath;
      if (Platform.OS === 'android') {
        const downloadDir = '/storage/emulated/0/Download';
        const appFolder = `${downloadDir}/LedgerReports`;
        await RNBlobUtil.fs.mkdir(appFolder).catch(() => {});
        filePath = `${appFolder}/${fileName}`;
        await RNBlobUtil.fs.writeFile(filePath, base64Data, 'base64');

        // Show notification
        RNBlobUtil.android.addCompleteDownload({
          title: fileName,
          description: 'Ledger PDF downloaded successfully',
          mime: 'application/pdf',
          path: filePath,
          showNotification: true,
        });

        ToastAndroid.show('PDF saved! Tap notification to open.', ToastAndroid.LONG);

        // Auto open PDF
        setTimeout(() => {
          FileViewer.open(filePath, {showOpenWithDialog: true})
            .catch(err => console.log('Error opening file:', err));
        }, 500);
      } else {
        // iOS
        const dirs = RNBlobUtil.fs.dirs;
        filePath = `${dirs.DocumentDir}/${fileName}`;
        await RNBlobUtil.fs.writeFile(filePath, base64Data, 'base64');
        
        FileViewer.open(filePath, {showOpenWithDialog: true})
          .catch(err => {
            Alert.alert('Success', 'PDF saved successfully!');
          });
      }

    } catch (error) {
      console.error('PDF generation error:', error);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Failed to generate PDF!', ToastAndroid.SHORT);
      } else {
        Alert.alert('Error', 'Failed to generate PDF!');
      }
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleResetFilter = () => {
    setFromDate(new Date());
    setEndDate(new Date());
  };

  const getTitle = () => {
    switch (name) {
      case 'Customer':
        return 'Customer Ledger';
      case 'Suppliers':
        return 'Supplier Ledger';
      case 'Items':
        return 'Item Ledger';
      case 'Banks':
        return 'Bank Ledger';
      case 'Audit':
        return 'Audit Trail';
      case 'ShortTermLoan':
        return 'Loan Ledger';
      default:
        return 'Ledger';
    }
  };

  const getAccountName = () => {
    return (
      item?.name ||
      item?.bank_name ||
      item?.supp_name ||
      item?.account_name ||
      'Account'
    );
  };

  // Get table headers based on type
  const getTableHeaders = () => {
    if (name === 'Items') {
      return ['Reference', 'Date', 'Counter', 'Particular', 'Location', 'QOH'];
    } else if (name === 'Audit') {
      return ['Reference', 'Date', 'Counter', 'Particular', 'Debit', 'Credit', 'Balance'];
    } else {
      // Customer, Suppliers, Banks, ShortTermLoan - all use same columns
      return ['Reference', 'Date', 'Counter', 'Particular', 'Debit', 'Credit', 'Balance'];
    }
  };

  // Format date to dd/mm/yyyy
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    try {
      // Handle various date formats
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr; // Return original if invalid
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // Table Cell Component with dotted border
  const TableCell = ({value, isAmount = false, isLast = false, isCredit = false, isBalance = false, isDate = false}) => {
    let displayValue = '';
    
    if (isAmount) {
      const numValue = parseFloat(value) || 0;
      // Make credit and balance always positive
      const absValue = (isCredit || isBalance) ? Math.abs(numValue) : numValue;
      displayValue = absValue !== 0 ? formatNumber(absValue) : '';
    } else if (isDate) {
      // Format date as dd/mm/yyyy
      displayValue = formatDateDisplay(value);
    } else {
      // For non-amount values, show empty if no value
      displayValue = value && value !== '0' && value !== 0 ? value.toString() : '';
    }
    
    return (
      <View style={[styles.tableCell, isLast && styles.lastCell]}>
        <Text style={[styles.cellText, isAmount && styles.amountText]} numberOfLines={2}>
          {displayValue}
        </Text>
      </View>
    );
  };

  // Render Table Header
  const renderTableHeader = () => {
    const headers = getTableHeaders();
    return (
      <View style={styles.tableHeader}>
        {headers.map((header, index) => (
          <View 
            key={index} 
            style={[
              styles.headerCell, 
              index === headers.length - 1 && styles.lastHeaderCell
            ]}>
            <Text style={styles.headerText}>{header}</Text>
          </View>
        ))}
      </View>
    );
  };

  // Render Item based on type - Table Row Format
  const renderItem = ({item, index}) => {
    const isEven = index % 2 === 0;
    
    if (name === 'Items') {
      return (
        <Animated.View style={[styles.tableRow, isEven && styles.evenRow, {opacity: fadeAnim}]}>
          <TableCell value={item.reference} />
          <TableCell value={item.date || item.tran_date} isDate />
          <TableCell value={item.account || item.account_name} />
          <TableCell value={item.particular || item.memo || item.description} />
          <TableCell value={item.location_name} />
          <TableCell value={item.QOH} isLast />
        </Animated.View>
      );
    } else if (name === 'Banks') {
      return (
        <Animated.View style={[styles.tableRow, isEven && styles.evenRow, {opacity: fadeAnim}]}>
          <TableCell value={item.reference} />
          <TableCell value={item.trans_date || item.tran_date} isDate />
          <TableCell value={item.account || item.account_name} />
          <TableCell value={item.particular || item.memo || item.person} />
          <TableCell value={item.debit} isAmount />
          <TableCell value={item.credit} isAmount isCredit />
          <TableCell value={item.balance} isAmount isBalance isLast />
        </Animated.View>
      );
    } else if (name === 'Audit') {
      return (
        <Animated.View style={[styles.tableRow, isEven && styles.evenRow, {opacity: fadeAnim}]}>
          <TableCell value={item.reference} />
          <TableCell value={item.date || item.trans_date} isDate />
          <TableCell value={item.user_id || item.account} />
          <TableCell value={item.description || item.type} />
          <TableCell value={item.debit || item.amount} isAmount />
          <TableCell value={item.credit} isAmount isCredit />
          <TableCell value={item.balance} isAmount isBalance isLast />
        </Animated.View>
      );
    } else {
      // Customer, Suppliers, ShortTermLoan
      return (
        <Animated.View style={[styles.tableRow, isEven && styles.evenRow, {opacity: fadeAnim}]}>
          <TableCell value={item.reference} />
          <TableCell value={item.tran_date || item.trans_date} isDate />
          <TableCell value={item.account || item.account_name} />
          <TableCell value={item.particular || item.memo || item.person} />
          <TableCell value={item.debit} isAmount />
          <TableCell value={item.credit} isAmount isCredit />
          <TableCell value={item.balance} isAmount isBalance isLast />
        </Animated.View>
      );
    }
  };

  if (Loader && aging.length === 0) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={APPCOLORS.Primary} />
        <Text style={styles.loadingText}>Loading ledger data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor={APPCOLORS.Primary} />

      {/* Custom Header */}
      <PlatformGradient
        colors={[APPCOLORS.Primary, APPCOLORS.Secondary]}
        style={[
          styles.header,
          {
            paddingTop:
              Platform.OS === 'ios' ? insets.top + 25 : insets.top + 30,
          },
        ]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={APPCOLORS.WHITE} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{getTitle()}</Text>
          <Text style={styles.headerSubtitle}>{getAccountName()}</Text>
        </View>

        <TouchableOpacity
          onPress={handleDownload}
          disabled={downloadLoading || aging.length === 0}>
          {downloadLoading ? (
            <ActivityIndicator size="small" color={APPCOLORS.WHITE} />
          ) : (
            <MaterialIcons
              name="file-download"
              size={26}
              color={
                aging.length === 0 ? 'rgba(255,255,255,0.5)' : APPCOLORS.WHITE
              }
            />
          )}
        </TouchableOpacity>
      </PlatformGradient>

      {/* Date Pickers */}
      <DatePicker
        modal
        open={openFrom}
        date={fromDate}
        mode="date"
        onConfirm={date => {
          setOpenFrom(false);
          setFromDate(date);
        }}
        onCancel={() => setOpenFrom(false)}
      />

      <DatePicker
        modal
        open={openEnd}
        date={EndDate}
        mode="date"
        onConfirm={date => {
          setOpenEnd(false);
          setEndDate(date);
        }}
        onCancel={() => setOpenEnd(false)}
      />

      {/* Main Content - Scrollable in Landscape */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={{flexGrow: 1}}>
        <ScrollView 
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
          contentContainerStyle={{flexGrow: 1, paddingBottom: 20}}>
          
          {/* Filter Section */}
          <View style={styles.filterContainer}>
            <View style={styles.filterRow}>
              {/* From Date */}
              <View style={styles.dateContainer}>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setOpenFrom(true)}>
                  <Text style={styles.dateText}>
                    {moment(fromDate).subtract(1, 'months').format('DD/MM/YYYY')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* To Date */}
              <View style={styles.dateContainer}>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setOpenEnd(true)}>
                  <Text style={styles.dateText}>
                    {moment(EndDate).format('DD/MM/YYYY')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={handleResetFilter}>
                  <MaterialIcons
                    name="refresh"
                    size={20}
                    color={APPCOLORS.Primary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => {}} // Already auto-applies on date change
                  disabled={Loader}>
                  {Loader ? (
                    <ActivityIndicator size="small" color={APPCOLORS.WHITE} />
                  ) : (
                    <MaterialIcons
                      name="search"
                      size={20}
                      color={APPCOLORS.WHITE}
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Balance Information */}
            {(opening !== 0 || closingBalance !== 0 || aging.length > 0) && (
              <View style={styles.balanceContainer}>
                <View style={styles.balanceInfo}>
                  <Text style={styles.balanceLabel}>Opening Balance</Text>
                  <Text style={styles.balanceValue}>{formatNumber(opening)}</Text>
                </View>
                {aging.length > 0 && (
                  <View style={styles.balanceInfo}>
                    <Text style={styles.balanceLabel}>Net Difference</Text>
                    <Text style={[styles.balanceValue, (totalDebit - totalCredit) < 0 && {color: '#DC2626'}]}>
                      {formatNumber(totalDebit - totalCredit)}
                    </Text>
                  </View>
                )}
                {aging.length > 0 && (
                  <View style={styles.balanceInfo}>
                    <Text style={styles.balanceLabel}>Closing Balance</Text>
                    <Text style={styles.balanceValue}>
                      {formatNumber(closingBalance)}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Transactions List - Table Format */}
          <View style={styles.container}>
            {aging.length > 0 ? (
              <View style={styles.tableContainer}>
                {/* Table Header */}
                {renderTableHeader()}
                
                {/* Table Body - Render rows directly */}
                {aging.map((item, index) => (
                  <View key={index.toString()}>
                    {renderItem({item, index})}
                  </View>
                ))}
                
                {/* Totals Row */}
                {name !== 'Items' && (
                  <View style={styles.totalsRow}>
                    <View style={styles.tableCell}>
                      <Text style={styles.totalsText}>Total</Text>
                    </View>
                    <View style={styles.tableCell}>
                      <Text style={styles.totalsText}></Text>
                    </View>
                    <View style={styles.tableCell}>
                      <Text style={styles.totalsText}></Text>
                    </View>
                    <View style={styles.tableCell}>
                      <Text style={styles.totalsText}></Text>
                    </View>
                    <View style={styles.tableCell}>
                      <Text style={styles.totalsAmountText}>{formatNumber(totalDebit)}</Text>
                    </View>
                    <View style={styles.tableCell}>
                      <Text style={styles.totalsAmountText}>{formatNumber(Math.abs(totalCredit))}</Text>
                    </View>
                    <View style={[styles.tableCell, styles.lastCell]}>
                      <Text style={styles.totalsAmountText}>{formatNumber(Math.abs(closingBalance))}</Text>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <MaterialIcons
                  name="receipt-long"
                  size={60}
                  color={APPCOLORS.TEXTFIELDCOLOR}
                />
                <Text style={styles.noDataText}>
                  {Loader
                    ? 'Loading transactions...'
                    : 'No transactions found for selected period'}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
    paddingBottom: Platform.OS === 'android' ? 20 : 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  headerTitle: {
    color: APPCOLORS.WHITE,
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 2,
  },
  filterContainer: {
    backgroundColor: '#F0F2F5',
    padding: 16,
    margin: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 10,
  },
  dateContainer: {
    flex: 1,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    width: 100,
    gap: 8,
  },
  dateInput: {
    justifyContent: 'center',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    height: 48,
  },
  dateText: {
    fontSize: 14,
    color: APPCOLORS.BLACK,
    fontWeight: '500',
  },
  resetButton: {
    backgroundColor: '#E8EAED',
    borderRadius: 12,
    width: 46,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  applyButton: {
    backgroundColor: APPCOLORS.Primary,
    borderRadius: 12,
    width: 46,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: APPCOLORS.Primary,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  balanceContainer: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  balanceInfo: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: APPCOLORS.Primary,
  },
  container: {
    flex: 1,
    paddingHorizontal: 12,
  },
  listContent: {
    paddingBottom: 20,
  },
  // Table Styles
  tableContainer: {
    backgroundColor: APPCOLORS.WHITE,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 3},
    elevation: 4,
    minWidth: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 80,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: APPCOLORS.Primary,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: APPCOLORS.Secondary,
  },
  headerCell: {
    width: 110,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.3)',
  },
  lastHeaderCell: {
    borderRightWidth: 0,
  },
  headerText: {
    color: APPCOLORS.WHITE,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  evenRow: {
    backgroundColor: '#F9FAFB',
  },
  tableCell: {
    width: 110,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#D1D5DB',
    borderStyle: 'dashed',
  },
  lastCell: {
    borderRightWidth: 0,
  },
  cellText: {
    fontSize: 11,
    color: '#374151',
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  amountText: {
    fontWeight: '700',
    color: APPCOLORS.Primary,
    fontSize: 11,
  },
  totalsRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    backgroundColor: '#E5E7EB',
    borderTopWidth: 2,
    borderTopColor: APPCOLORS.Primary,
  },
  totalsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
  },
  totalsAmountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: APPCOLORS.Primary,
    textAlign: 'center',
  },
  loader: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: APPCOLORS.Primary,
    fontWeight: '500',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noDataText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
});

export default Ledger;
