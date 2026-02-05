import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import SimpleHeader from '../../../../components/SimpleHeader';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {fetchApprovedData} from '../../../../redux/ApprovedSlice';
import * as Animatable from 'react-native-animatable';

const ApprovedRecordsScreen = ({navigation, route}) => {
  const {screenType = 'sales'} = route.params || {};
    
  const dispatch = useDispatch();
  const {approvalCounts, loading} = useSelector(state => state.Approved);
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

  // Format date for API
  const formatDateForAPI = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const fetchData = useCallback(() => {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30); // 30 days ago
    const toDate = new Date();

    dispatch(
      fetchApprovedData({
        fromDate: formatDateForAPI(fromDate),
        toDate: formatDateForAPI(toDate),
        reference: '',
        name: '',
      }),
    );
  }, [dispatch]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, []);

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
        <View
          style={[styles.iconContainer, {backgroundColor: item.color + '20'}]}>
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
              <Text style={styles.emptyText}>
                No transaction data available
              </Text>
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
  listContent: {
    padding: 12,
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
