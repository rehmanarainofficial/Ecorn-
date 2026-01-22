import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import SimpleHeader from '../../../../components/SimpleHeader';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import {fetchApprovedData} from '../../../../redux/ApprovedSlice';
import * as Animatable from 'react-native-animatable';

const ApprovedRecordsScreen = ({navigation, route}) => {
  const {screenType = 'sales'} = route.params || {};
  const dispatch = useDispatch();
  const {approvalCounts, loading} = useSelector(state => state.Approved);

  // Date states
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 2);
    return date;
  });
  const [toDate, setToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  // Search states
  const [searchCode, setSearchCode] = useState('');
  const [searchName, setSearchName] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Get screen title based on type
  const getScreenTitle = () => {
    switch (screenType) {
      case 'sales':
        return 'Sales Transactions';
      case 'purchase':
        return 'Purchase Transactions';
      case 'inventory':
        return 'Inventory Transactions';
      case 'finance':
        return 'Financial Transactions';
      case 'manufacturing':
        return 'Manufacturing Transactions';
      default:
        return 'Transactions';
    }
  };

  // Get data items based on screen type
  const getDataItems = () => {
    if (!approvalCounts) return [];

    switch (screenType) {
      case 'sales':
        return [
          {
            key: 'quotation_approval',
            label: 'Sale Quotations',
            count: approvalCounts.quotation_approval || '0',
            icon: 'file-document-outline',
            color: '#3498db',
            listKey: 'quotation_approval',
          },
          {
            key: 'so_approval',
            label: 'Sale Orders',
            count: approvalCounts.so_approval || '0',
            icon: 'cart-check',
            color: '#27ae60',
            listKey: 'so_approval',
          },
          {
            key: 'delivery_approval',
            label: 'Delivery Notes',
            count: approvalCounts.delivery_approval || '0',
            icon: 'truck-delivery',
            color: '#e67e22',
            listKey: 'delivery_approval',
          },
          {
            key: 'invoice_approval',
            label: 'Sales Invoices',
            count: approvalCounts.invoice_approval || '0',
            icon: 'receipt',
            color: '#9b59b6',
            listKey: 'invoice_approval',
          },
        ];
      case 'purchase':
        return [
          {
            key: 'po_approval',
            label: 'Purchase Orders',
            count: approvalCounts.po_approval || '0',
            icon: 'cart-arrow-down',
            color: '#3498db',
            listKey: 'po_approval',
          },
          {
            key: 'grn_approval',
            label: 'GRN',
            count: approvalCounts.grn_approval || '0',
            icon: 'package-variant-closed',
            color: '#27ae60',
            listKey: 'grn_approval',
          },
          {
            key: 'po_invoice_approval',
            label: 'Purchase Invoices',
            count: approvalCounts.po_invoice_approval || '0',
            icon: 'file-document',
            color: '#e67e22',
            listKey: 'po_invoice_approval',
          },
        ];
      case 'inventory':
        return [
          {
            key: 'location_transfer_app',
            label: 'Location Transfers',
            count: approvalCounts.location_transfer_app || '0',
            icon: 'swap-horizontal',
            color: '#3498db',
            listKey: 'location_transfer_app',
          },
          {
            key: 'adjustment_app',
            label: 'Adjustments',
            count: approvalCounts.adjustment_app || '0',
            icon: 'tune-vertical',
            color: '#e74c3c',
            listKey: 'adjustment_app',
          },
        ];
      case 'finance':
        return [
          {
            key: 'voucher_approval',
            label: 'Vouchers',
            count: approvalCounts.voucher_approval || '0',
            icon: 'credit-card-outline',
            color: '#3498db',
            listKey: 'voucher_approval',
          },
        ];
      case 'manufacturing':
        return [
          {
            key: 'electrocal_job_cards',
            label: 'Electrical Job Cards',
            count: approvalCounts.electrocal_job_cards || '0',
            icon: 'flash',
            color: '#f1c40f',
            listKey: 'electrocal_job_cards',
          },
          {
            key: 'mechnical_job_cards',
            label: 'Mechanical Job Cards',
            count: approvalCounts.mechnical_job_cards || '0',
            icon: 'cog',
            color: '#95a5a6',
            listKey: 'mechnical_job_cards',
          },
        ];
      default:
        return [];
    }
  };

  // Format date for display
  const formatDateDisplay = date => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Format date for API
  const formatDateForAPI = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch data
  const fetchData = useCallback(() => {
    dispatch(
      fetchApprovedData({
        fromDate: formatDateForAPI(fromDate),
        toDate: formatDateForAPI(toDate),
        reference: searchCode,
        name: searchName,
      }),
    );
  }, [dispatch, fromDate, toDate, searchCode, searchName]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Handle filter
  const handleFilter = () => {
    if (fromDate > toDate) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Date Range',
        text2: 'From date cannot be after To date',
      });
      return;
    }
    fetchData();
    Toast.show({
      type: 'success',
      text1: 'Filtering...',
      text2: 'Fetching filtered data',
    });
  };

  // Handle clear
  const handleClear = () => {
    const newFromDate = new Date();
    newFromDate.setMonth(newFromDate.getMonth() - 2);
    setFromDate(newFromDate);
    setToDate(new Date());
    setSearchCode('');
    setSearchName('');

    dispatch(
      fetchApprovedData({
        fromDate: formatDateForAPI(newFromDate),
        toDate: formatDateForAPI(new Date()),
        reference: '',
        name: '',
      }),
    );

    Toast.show({
      type: 'info',
      text1: 'Filters Cleared',
      text2: 'Showing all records',
    });
  };

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
    setTimeout(() => setRefreshing(false), 1000);
  }, [fetchData]);

  // Handle card press - navigate to approval list
  const handleCardPress = item => {
    navigation.navigate('ApprovalListScreen', {
      listKey: item.listKey,
      title: item.label,
      isApproved: true,
    });
  };

  // Render transaction card
  const renderCard = ({item, index}) => (
    <Animatable.View animation="fadeInUp" delay={index * 100} useNativeDriver>
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleCardPress(item)}
        activeOpacity={0.8}>
        <View style={[styles.iconContainer, {backgroundColor: item.color + '20'}]}>
          <Icon name={item.icon} size={28} color={item.color} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardLabel}>{item.label}</Text>
          <Text style={styles.cardCount}>{item.count} Records</Text>
        </View>
        <View style={styles.arrowContainer}>
          <Icon name="chevron-right" size={24} color="#666" />
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );

  const dataItems = getDataItems();

  return (
    <View style={styles.container}>
      <SimpleHeader title={getScreenTitle()} />

      {/* Filter Section */}
      <View style={styles.filterContainer}>
        {/* Date Pickers Row */}
        <View style={styles.dateRow}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowFromPicker(true)}>
            <Icon name="calendar" size={18} color="#666" />
            <Text style={styles.dateText}>{formatDateDisplay(fromDate)}</Text>
          </TouchableOpacity>

          <Text style={styles.toText}>to</Text>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowToPicker(true)}>
            <Icon name="calendar" size={18} color="#666" />
            <Text style={styles.dateText}>{formatDateDisplay(toDate)}</Text>
          </TouchableOpacity>
        </View>

        {/* Search Inputs Row */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Icon name="barcode" size={18} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by code..."
              placeholderTextColor="#999"
              value={searchCode}
              onChangeText={setSearchCode}
            />
          </View>
          <View style={styles.searchInputContainer}>
            <Icon name="account-search" size={18} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name..."
              placeholderTextColor="#999"
              value={searchName}
              onChangeText={setSearchName}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.filterButton} onPress={handleFilter}>
            <Icon name="filter" size={18} color="#FFF" />
            <Text style={styles.filterButtonText}>Filter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Icon name="close-circle" size={18} color="#666" />
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Pickers */}
      {showFromPicker && (
        <DateTimePicker
          value={fromDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowFromPicker(false);
            if (date) setFromDate(date);
          }}
        />
      )}
      {showToPicker && (
        <DateTimePicker
          value={toDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowToPicker(false);
            if (date) setToDate(date);
          }}
        />
      )}

      {/* Loading or Content */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a1c22" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      ) : (
        <FlatList
          data={dataItems}
          renderItem={renderCard}
          keyExtractor={item => item.key}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="file-document-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No transaction data available</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  filterContainer: {
    backgroundColor: '#FFF',
    margin: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  toText: {
    marginHorizontal: 10,
    color: '#666',
    fontWeight: '500',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1c22',
    borderRadius: 10,
    paddingVertical: 12,
  },
  filterButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingVertical: 12,
  },
  clearButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  listContent: {
    padding: 12,
    paddingTop: 0,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 14,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1c22',
    marginBottom: 4,
  },
  cardCount: {
    fontSize: 14,
    color: '#666',
  },
  arrowContainer: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
  },
});

export default ApprovedRecordsScreen;
