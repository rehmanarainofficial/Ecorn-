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

const Ledger = ({navigation, route}) => {
  const {name, item} = route.params;
  const insets = useSafeAreaInsets();

  const [aging, setAgingData] = useState([]);
  const [opening, setOpening] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);

  const [fromDate, setFromDate] = useState(new Date());
  const [openFrom, setOpenFrom] = useState(false);

  const [EndDate, setEndDate] = useState(new Date());
  const [openEnd, setOpenEnd] = useState(false);

  const [Loader, setLoader] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const nav = navigation.addListener('focus', () => {
      if (name === 'Customer') getLeger();
      else if (name === 'Suppliers') getSupplierLeger();
      else if (name === 'Items') getItemsLedger();
      else if (name === 'Banks') getBanksLeger();
      else if (name === 'Audit') getAuditLedger();
    });

    return nav;
  }, [navigation]);

  useEffect(() => {
    if (name === 'Customer') getLeger();
    else if (name === 'Suppliers') getSupplierLeger();
    else if (name === 'Items') getItemsLedger();
    else if (name === 'Banks') getBanksLeger();
    else if (name === 'Audit') getAuditLedger();
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

  const calculateClosingBalance = (transactions, openingBalance) => {
    if (!transactions || !Array.isArray(transactions)) {
      setClosingBalance(openingBalance);
      return;
    }

    let currentBalance = parseFloat(openingBalance) || 0;

    transactions.forEach(transaction => {
      const debit = parseFloat(transaction.debit) || 0;
      const credit = parseFloat(transaction.credit) || 0;
      currentBalance = currentBalance + debit - credit;
    });

    setClosingBalance(currentBalance);
  };

  const handleDownload = async () => {
    // PDF download logic here
    setDownloadLoading(true);
    setTimeout(() => {
      setDownloadLoading(false);
    }, 2000);
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
      default:
        return 'Ledger';
    }
  };

  const getAccountName = () => {
    return item?.name || item?.bank_name || item?.supp_name || 'Account';
  };

  // Common Row Component
  const Row = ({label, value, isAmount = false}) => (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, isAmount && styles.amountText]}>
        {isAmount && value > 0 ? '+' : ''}
        {isAmount ? formatNumber(value) : value?.toString() || '-'}
      </Text>
    </View>
  );

  // Render Item based on type
  const renderItem = ({item, index}) => {
    if (name === 'Items') {
      return (
        <Animated.View style={[styles.card, {opacity: fadeAnim}]}>
          <Row label="Location Name" value={item.location_name} />
          <Row label="QOH" value={item.QOH} />
        </Animated.View>
      );
    } else if (name === 'Banks') {
      return (
        <Animated.View style={[styles.card, {opacity: fadeAnim}]}>
          <Row label="Reference" value={item.reference} />
          <Row label="Transaction Date" value={item.trans_date} />
          <Row label="Debit" value={parseFloat(item.debit)} isAmount />
          <Row label="Credit" value={parseFloat(item.credit)} isAmount />
          <Row label="Balance" value={parseFloat(item.balance)} isAmount />
        </Animated.View>
      );
    } else if (name === 'Audit') {
      return (
        <Animated.View style={[styles.card, {opacity: fadeAnim}]}>
          <Row label="Date" value={item.date} />
          <Row label="Time" value={item.time} />
          <Row label="Name" value={item.user_id} />
          <Row label="Transaction Date" value={item.trans_date} />
          <Row label="Type" value={item.type} />
          <Row label="Reference" value={item.reference} />
          <Row label="Action" value={item.description} />
          <Row label="Amount" value={parseFloat(item.amount)} isAmount />
        </Animated.View>
      );
    } else {
      return (
        <Animated.View style={[styles.card, {opacity: fadeAnim}]}>
          <Row label="Reference" value={item.reference} />
          <Row label="Transaction Date" value={item.tran_date} />
          <Row label="Debit" value={parseFloat(item.debit)} isAmount />
          <Row label="Credit" value={parseFloat(item.credit)} isAmount />
          <Row label="Balance" value={parseFloat(item.balance)} isAmount />
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

      {/* Filter Section */}
      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          {/* From Date */}
          <View style={styles.dateContainer}>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setOpenFrom(true)}>
              <Text style={styles.dateText}>
                {moment(fromDate).subtract(1, 'months').format('YYYY-MM-DD')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* To Date */}
          <View style={styles.dateContainer}>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setOpenEnd(true)}>
              <Text style={styles.dateText}>
                {moment(EndDate).format('YYYY-MM-DD')}
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
        {(opening !== 0 || closingBalance !== 0) && (
          <View style={styles.balanceContainer}>
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>Opening Balance</Text>
              <Text style={styles.balanceValue}>{formatNumber(opening)}</Text>
            </View>
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

      {/* Transactions List */}
      <View style={styles.container}>
        {aging.length > 0 ? (
          <FlatList
            data={aging}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
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
    paddingBottom: Platform.OS === 'android' ? 20 : 15, // Android ke liye extra padding
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
  card: {
    backgroundColor: APPCOLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 3},
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: APPCOLORS.Primary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: APPCOLORS.BLACK,
  },
  rowValue: {
    fontSize: 14,
    color: '#4B5563',
  },
  amountText: {
    fontWeight: 'bold',
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
