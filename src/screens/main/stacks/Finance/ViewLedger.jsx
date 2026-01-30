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
import moment from 'moment';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import PlatformGradient from '../../../../components/PlatformGradient';
import {Dropdown} from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import {BASEURL} from '.././../../../utils/BaseUrl';
import {APPCOLORS} from '../../../../utils/APPCOLORS';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {formatNumber} from '../../../../utils/NumberUtils';
import Orientation from 'react-native-orientation-locker';
import {PDFDocument, StandardFonts, rgb} from 'pdf-lib';
import RNBlobUtil from 'react-native-blob-util';
import FileViewer from 'react-native-file-viewer';

const ViewLedger = ({navigation, route}) => {
  const insets = useSafeAreaInsets();

  // Get params from navigation (for bank click)
  const passedAccountCode = route?.params?.accountCode;
  const passedAccountName = route?.params?.accountName;

  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [flatData, setFlatData] = useState([]); // Flat array for table
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);

  // Filter states
  const [accounts, setAccounts] = useState([]);
  const [counterParties, setCounterParties] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedCounterParty, setSelectedCounterParty] = useState(null);
  const [fromDate, setFromDate] = useState(
    moment().subtract(1, 'month').format('YYYY-MM-DD'),
  );
  const [toDate, setToDate] = useState(moment().format('YYYY-MM-DD'));

  // Date picker states
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);

  // Loading states
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [counterPartiesLoading, setCounterPartiesLoading] = useState(false);
  const [autoFetchDone, setAutoFetchDone] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [transactionBalances, setTransactionBalances] = useState({});

  // Lock to Landscape orientation when screen opens
  useEffect(() => {
    Orientation.lockToLandscape();

    return () => {
      Orientation.lockToPortrait();
    };
  }, []);

  useEffect(() => {
    const nav = navigation.addListener('focus', () => {
      Orientation.lockToLandscape();
    });

    const blurNav = navigation.addListener('blur', () => {
      Orientation.lockToPortrait();
    });

    return () => {
      nav();
      blurNav();
    };
  }, [navigation]);

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Reset autoFetchDone when route params change (new bank card clicked)
  useEffect(() => {
    setAutoFetchDone(false);
    setSelectedAccount(null);
    setFlatData([]);
    setOpeningBalance(0);
    setClosingBalance(0);
    setTotalDebit(0);
    setTotalCredit(0);
  }, [passedAccountCode, passedAccountName]);

  // Auto-select account if passed from bank click (but don't auto-fetch)
  useEffect(() => {
    if (
      (passedAccountCode || passedAccountName) &&
      accounts.length > 0 &&
      !autoFetchDone
    ) {
      // Try to match by account_code first
      let matchedAccount = accounts.find(
        acc => acc.value === passedAccountCode,
      );

      // If not found, try exact match by account name (for banks)
      if (!matchedAccount && passedAccountName) {
        // First try exact match
        matchedAccount = accounts.find(
          acc =>
            acc.account_name?.toLowerCase() === passedAccountName.toLowerCase(),
        );

        // If still not found, try partial match
        if (!matchedAccount) {
          matchedAccount = accounts.find(
            acc =>
              acc.account_name
                ?.toLowerCase()
                .includes(passedAccountName.toLowerCase()) ||
              passedAccountName
                .toLowerCase()
                .includes(acc.account_name?.toLowerCase()),
          );
        }
      }


      if (matchedAccount) {
        setSelectedAccount(matchedAccount);
        setAutoFetchDone(true);
        fetchCounterParties(matchedAccount.value);
      } else {
        console.log('No matching account found for:', passedAccountName);
      }
    }
  }, [passedAccountCode, passedAccountName, accounts, autoFetchDone]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Format date to dd/mm/yyyy
  const formatDateDisplay = dateStr => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // Fetch accounts for 1st dropdown - GET request
  const fetchAccounts = async () => {
    try {
      setAccountsLoading(true);
      const response = await fetch(`${BASEURL}get_gl_account.php`);
      const json = await response.json();

      if (json.status === 'true' && Array.isArray(json.data)) {
        const formattedAccounts = json.data.map(account => ({
          label: `${account.account_code} - ${account.account_name}`,
          value: account.account_code,
          account_name: account.account_name,
          inactive: account.inactive,
        }));
        setAccounts(formattedAccounts);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setAccountsLoading(false);
    }
  };

  const fetchCounterParties = async accountValue => {
    try {
      setCounterPartiesLoading(true);

      const formData = new FormData();
      formData.append('account', accountValue);

      const response = await fetch(`${BASEURL}get_counter_party.php`, {
        method: 'POST',
        headers: {'Content-Type': 'multipart/form-data'},
        body: formData,
      });

      const json = await response.json();

      if (json.status === 'true' && Array.isArray(json.data)) {
        setCounterParties(
          json.data.map(party => ({
            label: party.name,
            value: party.id,
            name: party.name,
            inactive: party.inactive,
          })),
        );
      } else {
        setCounterParties([]);
      }
    } catch (error) {
      console.error('Error fetching counter parties:', error);
      setCounterParties([]);
    } finally {
      setCounterPartiesLoading(false);
    }
  };

  // Fetch ledger data with filters - FORM DATA with POST
  const fetchData = async () => {
    if (!selectedAccount) return;
    fetchDataWithAccount(selectedAccount);
  };

  // Fetch data with specific account (for auto-fetch when bank is clicked)
  const fetchDataWithAccount = async account => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('account', account.value);
      formData.append('from_date', fromDate);
      formData.append('to_date', toDate);
      if (selectedCounterParty) {
        formData.append('person_id', selectedCounterParty.value);
      }

      const response = await fetch(`${BASEURL}gl_account_inquiry.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const json = await response.json();

      if (json.status === 'true') {
        const opening = json.opening !== null ? parseFloat(json.opening) : 0;
        setOpeningBalance(opening);

        if (Array.isArray(json.data)) {
          setFlatData(json.data);
          calculateRunningBalances(json.data, opening);
          calculateTotals(json.data, opening);
        } else {
          setFlatData([]);
          setClosingBalance(opening);
          setTransactionBalances({});
          setTotalDebit(0);
          setTotalCredit(0);
        }
      } else {
        setFlatData([]);
        setOpeningBalance(0);
        setClosingBalance(0);
        setTransactionBalances({});
        setTotalDebit(0);
        setTotalCredit(0);
      }
    } catch (error) {
      console.error('Error fetching ledger data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRunningBalances = (transactions, openingBal) => {
    let currentBalance = openingBal;
    const balances = {};

    transactions.forEach((transaction, index) => {
      currentBalance += parseFloat(transaction.amount);
      balances[index] = currentBalance;
    });

    setTransactionBalances(balances);
    setClosingBalance(currentBalance);
  };

  const calculateTotals = (transactions, openingBal) => {
    let debitSum = 0;
    let creditSum = 0;
    let currentBalance = openingBal;

    transactions.forEach(transaction => {
      const amount = parseFloat(transaction.amount) || 0;
      if (amount > 0) {
        debitSum += amount;
      } else {
        creditSum += Math.abs(amount);
      }
      currentBalance += amount;
    });

    setTotalDebit(debitSum);
    setTotalCredit(creditSum);
    setClosingBalance(currentBalance);
  };

  const handleDownload = async () => {
    if (flatData.length === 0) {
      if (Platform.OS === 'android') {
        ToastAndroid.show('No data to download!', ToastAndroid.SHORT);
      } else {
        Alert.alert('Error', 'No data to download!');
      }
      return;
    }

    try {
      setDownloadLoading(true);

      if (Platform.OS === 'android') {
        const sdk = parseInt(Platform.Version, 10);
        if (sdk < 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            ToastAndroid.show('Storage permission denied!', ToastAndroid.SHORT);
            setDownloadLoading(false);
            return;
          }
        }
      }

      const pdfDoc = await PDFDocument.create();
      let page = pdfDoc.addPage([841.89, 595.28]);
      const {width, height} = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      let y = height - 40;
      const margin = 30;

      const drawText = (
        text,
        x,
        yPos,
        size = 10,
        bold = false,
        color = rgb(0, 0, 0),
      ) => {
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

      drawText(
        'GL Account Transactions Report',
        margin,
        y,
        16,
        true,
        rgb(0.13, 0.13, 0.47),
      );
      y -= 20;

      drawText(
        `Account: ${selectedAccount?.label || 'N/A'}`,
        margin,
        y,
        11,
        true,
      );
      drawText(`Company: Ercon Industries Pvt. Ltd`, width - 250, y, 11, true);
      y -= 15;

      drawText(
        `${formatDateDisplay(fromDate)} To ${formatDateDisplay(toDate)}`,
        margin,
        y,
        10,
      );
      drawText(
        `Generated: ${moment().format('DD/MM/YYYY HH:mm')}`,
        width - 200,
        y,
        10,
      );
      y -= 20;

      drawText(
        `Opening Balance: ${formatNumber(openingBalance)}`,
        margin,
        y,
        10,
        true,
      );
      drawText(
        `Net Difference: ${formatNumber(totalDebit - totalCredit)}`,
        250,
        y,
        10,
        true,
      );
      drawText(
        `Closing Balance: ${formatNumber(closingBalance)}`,
        450,
        y,
        10,
        true,
      );
      y -= 25;

      const colWidths = [100, 80, 100, 150, 90, 90, 90];
      const colX = [margin];
      for (let i = 1; i < colWidths.length; i++) {
        colX.push(colX[i - 1] + colWidths[i - 1]);
      }
      const headers = [
        'Reference',
        'Date',
        'Counter',
        'Particular',
        'Debit',
        'Credit',
        'Balance',
      ];

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

      let runningBalance = openingBalance;
      flatData.forEach((item, index) => {
        if (y < 60) {
          addNewPage();
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

        if (index % 2 === 0) {
          page.drawRectangle({
            x: margin,
            y: y - 5,
            width: width - 2 * margin,
            height: 18,
            color: rgb(0.96, 0.96, 0.96),
          });
        }

        const amount = parseFloat(item.amount) || 0;
        runningBalance += amount;
        const debit = amount > 0 ? amount : 0;
        const credit = amount < 0 ? Math.abs(amount) : 0;

        drawText((item.reference || '').substring(0, 15), colX[0] + 5, y, 8);
        drawText(formatDateDisplay(item.doc_date), colX[1] + 5, y, 8);
        drawText((item.person_name || '').substring(0, 15), colX[2] + 5, y, 8);
        drawText((item.memo || '').substring(0, 25), colX[3] + 5, y, 8);
        drawText(debit ? formatNumber(debit) : '', colX[4] + 5, y, 8);
        drawText(credit ? formatNumber(credit) : '', colX[5] + 5, y, 8);
        drawText(formatNumber(Math.abs(runningBalance)), colX[6] + 5, y, 8);

        y -= 18;
      });

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
      drawText(
        formatNumber(totalDebit),
        colX[4] + 5,
        y,
        9,
        true,
        rgb(0.13, 0.13, 0.47),
      );
      drawText(
        formatNumber(totalCredit),
        colX[5] + 5,
        y,
        9,
        true,
        rgb(0.13, 0.13, 0.47),
      );
      drawText('', colX[6] + 5, y, 9, true, rgb(0.13, 0.13, 0.47));

      const safeAccountName = (selectedAccount?.account_name || 'GLAccount')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 30);
      const safeFromDate = moment(fromDate).format('DDMMYYYY');
      const safeToDate = moment(toDate).format('DDMMYYYY');
      const fileName = `${safeAccountName}_${safeFromDate}_${safeToDate}.pdf`;

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

        RNBlobUtil.android.addCompleteDownload({
          title: fileName,
          description: 'GL Ledger PDF downloaded successfully',
          mime: 'application/pdf',
          path: filePath,
          showNotification: true,
        });

        ToastAndroid.show(
          'PDF saved! Tap notification to open.',
          ToastAndroid.LONG,
        );

        setTimeout(() => {
          FileViewer.open(filePath, {showOpenWithDialog: true}).catch(err =>
            console.log('Error opening file:', err),
          );
        }, 500);
      } else {
        const dirs = RNBlobUtil.fs.dirs;
        filePath = `${dirs.DocumentDir}/${fileName}`;
        await RNBlobUtil.fs.writeFile(filePath, base64Data, 'base64');

        FileViewer.open(filePath, {showOpenWithDialog: true}).catch(() => {
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

  const handleApplyFilter = () => {
    fetchData();
  };

  const handleAccountChange = account => {
    setSelectedAccount(account);
    setSelectedCounterParty(null);
    setFlatData([]);
    setOpeningBalance(0);
    setClosingBalance(0);
    setTotalDebit(0);
    setTotalCredit(0);
    setCounterParties([]);
    if (account) {
      fetchCounterParties(account.value);
    }
  };

  const handleResetFilter = () => {
    setSelectedAccount(null);
    setSelectedCounterParty(null);
    setFromDate(moment().subtract(1, 'month').format('YYYY-MM-DD'));
    setToDate(moment().format('YYYY-MM-DD'));
    setFlatData([]);
    setOpeningBalance(0);
    setClosingBalance(0);
    setTotalDebit(0);
    setTotalCredit(0);
    setCounterParties([]);
  };

  const onFromDateChange = (event, selectedDate) => {
    setShowFromDatePicker(false);
    if (selectedDate) {
      setFromDate(moment(selectedDate).format('YYYY-MM-DD'));
    }
  };

  const onToDateChange = (event, selectedDate) => {
    setShowToDatePicker(false);
    if (selectedDate) {
      setToDate(moment(selectedDate).format('YYYY-MM-DD'));
    }
  };

  // Table Cell Component
  const TableCell = ({
    value,
    isAmount = false,
    isLast = false,
    isCredit = false,
    isBalance = false,
    isDate = false,
  }) => {
    let displayValue = '';

    if (isAmount) {
      const numValue = parseFloat(value) || 0;
      const absValue = isCredit || isBalance ? Math.abs(numValue) : numValue;
      displayValue = absValue !== 0 ? formatNumber(absValue) : '';
    } else if (isDate) {
      displayValue = formatDateDisplay(value);
    } else {
      displayValue =
        value && value !== '0' && value !== 0 ? value.toString() : '';
    }

    return (
      <View style={[styles.tableCell, isLast && styles.lastCell]}>
        <Text
          style={[styles.cellText, isAmount && styles.amountText]}
          numberOfLines={2}>
          {displayValue}
        </Text>
      </View>
    );
  };

  // Render Table Header
  const renderTableHeader = () => {
    const headers = [
      'Reference',
      'Date',
      'Counter',
      'Particular',
      'Debit',
      'Credit',
      'Balance',
    ];
    return (
      <View style={styles.tableHeader}>
        {headers.map((header, index) => (
          <View
            key={index}
            style={[
              styles.headerCell,
              index === headers.length - 1 && styles.lastHeaderCell,
            ]}>
            <Text style={styles.headerText}>{header}</Text>
          </View>
        ))}
      </View>
    );
  };

  // Render Item - Table Row
  const renderItem = ({item, index}) => {
    const isEven = index % 2 === 0;
    const amount = parseFloat(item.amount) || 0;
    const debit = amount > 0 ? amount : 0;
    const credit = amount < 0 ? Math.abs(amount) : 0;
    const balance = transactionBalances[index] || closingBalance;

    return (
      <Animated.View
        style={[
          styles.tableRow,
          isEven && styles.evenRow,
          {opacity: fadeAnim},
        ]}>
        <TableCell value={item.reference} />
        <TableCell value={item.doc_date} isDate />
        <TableCell value={item.person_name} />
        <TableCell value={item.memo} />
        <TableCell value={debit} isAmount />
        <TableCell value={credit} isAmount isCredit />
        <TableCell value={balance} isAmount isBalance isLast />
      </Animated.View>
    );
  };

  if (loading && flatData.length === 0) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={APPCOLORS.Primary} />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
        backgroundColor={APPCOLORS.Primary}
      />

      {/* Custom Header */}
      <PlatformGradient
        colors={[APPCOLORS.Primary, APPCOLORS.Secondary]}
        style={[
          styles.header,
          {
            paddingTop:
              Platform.OS === 'ios'
                ? insets.top + 10
                : Math.max(insets.top, 24) + 10,
            paddingBottom: Platform.OS === 'ios' ? 20 : 25,
          },
        ]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{width: 40}}>
          <Ionicons name="arrow-back" size={22} color={APPCOLORS.WHITE} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>View Transactions</Text>

        <TouchableOpacity
          style={{width: 40, alignItems: 'flex-end'}}
          onPress={handleDownload}
          disabled={downloadLoading || flatData.length === 0}>
          {downloadLoading ? (
            <ActivityIndicator size="small" color={APPCOLORS.WHITE} />
          ) : (
            <MaterialIcons
              name="file-download"
              size={26}
              color={
                flatData.length === 0
                  ? APPCOLORS.TEXTFIELDCOLOR
                  : APPCOLORS.WHITE
              }
            />
          )}
        </TouchableOpacity>
      </PlatformGradient>

      {/* Date Pickers */}
      {showFromDatePicker && (
        <DateTimePicker
          value={new Date(fromDate)}
          mode="date"
          display="default"
          onChange={onFromDateChange}
        />
      )}
      {showToDatePicker && (
        <DateTimePicker
          value={new Date(toDate)}
          mode="date"
          display="default"
          onChange={onToDateChange}
        />
      )}

      {/* Main Content with Scroll - Filter included */}
      <ScrollView
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
        contentContainerStyle={{flexGrow: 1, paddingBottom: 20}}>
        {/* Filter Section - Now inside ScrollView */}
        <View style={styles.filterContainer}>
          <View style={styles.filterRow}>
            {/* Account Dropdown */}
            <View style={styles.dropdownContainer}>
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                iconStyle={styles.iconStyle}
                data={accounts}
                search
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder={accountsLoading ? 'Loading...' : 'Select Account'}
                searchPlaceholder="Search accounts..."
                value={selectedAccount}
                onChange={handleAccountChange}
              />
            </View>

            {/* Counter Party Dropdown */}
            {selectedAccount && counterParties.length > 0 && (
              <View style={styles.dropdownContainer}>
                <Dropdown
                  style={styles.dropdown}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  inputSearchStyle={styles.inputSearchStyle}
                  iconStyle={styles.iconStyle}
                  data={counterParties}
                  search
                  maxHeight={300}
                  labelField="label"
                  valueField="value"
                  placeholder={
                    counterPartiesLoading ? 'Loading...' : 'Counter Party'
                  }
                  searchPlaceholder="Search..."
                  value={selectedCounterParty}
                  onChange={setSelectedCounterParty}
                />
              </View>
            )}

            {/* From Date */}
            <View style={styles.dateContainer}>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowFromDatePicker(true)}>
                <Text style={styles.dateText}>
                  {formatDateDisplay(fromDate)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* To Date */}
            <View style={styles.dateContainer}>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowToDatePicker(true)}>
                <Text style={styles.dateText}>{formatDateDisplay(toDate)}</Text>
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
                style={[
                  styles.applyButton,
                  !selectedAccount && styles.disabledButton,
                ]}
                onPress={handleApplyFilter}
                disabled={!selectedAccount || loading}>
                {loading ? (
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
          {(openingBalance !== 0 ||
            closingBalance !== 0 ||
            flatData.length > 0) &&
            selectedAccount && (
              <View style={styles.balanceContainer}>
                <View style={styles.balanceInfo}>
                  <Text style={styles.balanceLabel}>Opening Balance</Text>
                  <Text style={styles.balanceValue}>
                    {formatNumber(openingBalance)}
                  </Text>
                </View>
                {flatData.length > 0 && (
                  <View style={styles.balanceInfo}>
                    <Text style={styles.balanceLabel}>Net Difference</Text>
                    <Text
                      style={[
                        styles.balanceValue,
                        totalDebit - totalCredit < 0 && {color: '#DC2626'},
                      ]}>
                      {formatNumber(totalDebit - totalCredit)}
                    </Text>
                  </View>
                )}
                {flatData.length > 0 && (
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

        {/* Horizontal Scroll for Table */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          nestedScrollEnabled={true}
          contentContainerStyle={{flexGrow: 1, minWidth: '100%'}}>
          {/* Transactions Table */}
          <View style={styles.container}>
            {flatData.length > 0 ? (
              <View style={styles.tableContainer}>
                {/* Table Header */}
                {renderTableHeader()}

                {/* Table Body */}
                {flatData.map((item, index) => (
                  <View key={index.toString()}>
                    {renderItem({item, index})}
                  </View>
                ))}

                {/* Totals Row */}
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
                    <Text style={styles.totalsAmountText}>
                      {formatNumber(totalDebit)}
                    </Text>
                  </View>
                  <View style={styles.tableCell}>
                    <Text style={styles.totalsAmountText}>
                      {formatNumber(totalCredit)}
                    </Text>
                  </View>
                  <View style={[styles.tableCell, styles.lastCell]}>
                    <Text style={styles.totalsAmountText}></Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <MaterialIcons
                  name="receipt-long"
                  size={60}
                  color={APPCOLORS.TEXTFIELDCOLOR}
                />
                <Text style={styles.noDataText}>
                  {selectedAccount && loading
                    ? 'Loading transactions...'
                    : selectedAccount
                    ? 'No transactions found for selected filters'
                    : 'Please select an account to view transactions'}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
};

export default ViewLedger;

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
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTitle: {
    color: APPCOLORS.WHITE,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  dropdownContainer: {
    flex: 1,
    minWidth: 150,
  },
  dateContainer: {
    minWidth: 100,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dropdown: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  placeholderStyle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  selectedTextStyle: {
    fontSize: 12,
    color: APPCOLORS.BLACK,
    fontWeight: '500',
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 14,
    borderRadius: 10,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  dateInput: {
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 12,
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
  disabledButton: {
    backgroundColor: '#D1D5DB',
    shadowColor: '#9CA3AF',
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
    width: '100%',
  },
  // Table Styles
  tableContainer: {
    backgroundColor: APPCOLORS.WHITE,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    width: '100%',
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
