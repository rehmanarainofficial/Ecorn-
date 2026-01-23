import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  ToastAndroid,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SimpleHeader from '../components/SimpleHeader';
import axios from 'axios';
import { BASEURL } from '../utils/BaseUrl';
import { formatDateString } from '../utils/DateUtils';
import { formatNumber } from '../utils/NumberUtils';

const ManufacturingView = ({ navigation, route }) => {
  const { trans_no } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [headerData, setHeaderData] = useState([]);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    fetchManufacturingData();
  }, []);

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchManufacturingData = async () => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('trans_no', trans_no);
      console.log('formData: ', formData);


      const res = await axios.post(
        `${BASEURL}view_manufacturing.php`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      console.log('Manufacturing API Response:', res.data);

      if (res.data?.status_header?.toString().toLowerCase() === 'true') {
        setHeaderData(res.data.data_header || []);
      } else {
        ToastAndroid.show('No manufacturing data found!', ToastAndroid.SHORT);
      }
    } catch (error) {
      console.log('Error fetching manufacturing data:', error);
      ToastAndroid.show(
        'Failed to load manufacturing details!',
        ToastAndroid.LONG,
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDateDisplay = dateString => {
    return formatDateString(dateString);
  };

  const formatAmount = amount => {
    return formatNumber(amount);
  };

  // Function to format key names in proper readable format
  const formatKeyName = key => {
    // Special case for units -> UOM
    if (key.toLowerCase() === 'units' || key.toLowerCase() === 'unit') {
      return 'UOM';
    }
    
    // If key contains underscore, replace with space and capitalize each word
    if (key.includes('_')) {
      return key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    // If it's camelCase, add spaces before capital letters
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };

  // Function to get display value based on key type
  const getDisplayValue = (key, value) => {
    if (!value && value !== 0 && value !== false) return 'N/A';

    // Convert to string
    const stringValue = String(value);

    // Check for date-like strings
    if (
      key.toLowerCase().includes('date') ||
      key.toLowerCase().includes('time')
    ) {
      return formatDateDisplay(stringValue);
    }

    // Check for amount/price/total keys
    if (
      key.toLowerCase().includes('amount') ||
      key.toLowerCase().includes('price') ||
      key.toLowerCase().includes('total') ||
      key.toLowerCase().includes('discount')
    ) {
      return `Rs. ${formatAmount(stringValue)}`;
    }

    return stringValue;
  };

  const renderCard = (item, index) => {
    // Fields to exclude
    const excludeFields = ['trans_no', 'trans_date', 'reference', 'stock_item_name', 'stockItemName', 'StockItemName', 'location_name', 'qty', 'pro_qty'];

    // Calculate balance qty
    const orderedQty = parseFloat(item.qty) || 0;
    const proQty = parseFloat(item.pro_qty) || 0;
    const balanceQty = orderedQty - proQty;

    // Get item name (stock_item_name)
    const itemName = item.stock_item_name || 'N/A';

    // Get cost center (location_name)
    const costCenter = item.location_name || 'N/A';

    // Get all fields for display (excluding specific ones)
    const allFields = Object.entries(item).filter(
      ([key, value]) =>
        (value || value === 0 || value === false) &&
        !excludeFields.includes(key),
    );

    return (
      <Animated.View
        key={index}
        style={[
          styles.card,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}>
        {/* Card Header - Item Name at top */}
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle}>{item.reference || 'N/A'}</Text>
            <Text style={styles.cardSubtitle}>Cost Center: {costCenter}</Text>
          </View>
          <View style={styles.serialBadge}>
            <Text style={styles.serialText}>{index + 1}</Text>
          </View>
        </View>

        {/* Key-Value Pairs */}
        <View style={styles.keyValueContainer}>
          {/* Item Name */}
          <View style={styles.keyValueRow}>
            <View style={styles.keyContainer}>
              <Text style={styles.keyText}>Item Name</Text>
            </View>
            <View style={styles.valueContainer}>
              <Text style={styles.valueText}>{item.StockItemName || item.stock_item_name || 'N/A'}</Text>
            </View>
          </View>

            {/* Other fields */}
            {allFields.map(([key, value], idx) => (
            <View key={idx} style={styles.keyValueRow}>
              <View style={styles.keyContainer}>
                <Text style={styles.keyText}>{formatKeyName(key)}</Text>
              </View>
              <View style={styles.valueContainer}>
                <Text style={styles.valueText} numberOfLines={3}>
                  {getDisplayValue(key, value)}
                </Text>
              </View>
            </View>
          ))}

          {/* Ordered Qty */}
          <View style={styles.keyValueRow}>
            <View style={styles.keyContainer}>
              <Text style={styles.keyText}>Ordered Qty</Text>
            </View>
            <View style={styles.valueContainer}>
              <Text style={styles.valueText}>{formatAmount(orderedQty)}</Text>
            </View>
          </View>

          {/* Pro Qty */}
          <View style={styles.keyValueRow}>
            <View style={styles.keyContainer}>
              <Text style={styles.keyText}>Pro Qty</Text>
            </View>
            <View style={styles.valueContainer}>
              <Text style={styles.valueText}>{formatAmount(proQty)}</Text>
            </View>
          </View>

          {/* Balance Qty */}
          <View style={styles.keyValueRow}>
            <View style={styles.keyContainer}>
              <Text style={styles.keyText}>Balance Qty</Text>
            </View>
            <View style={styles.valueContainer}>
              <Text style={[styles.valueText, { color: balanceQty > 0 ? '#e74c3c' : '#27ae60', fontWeight: 'bold' }]}>
                {formatAmount(balanceQty)}
              </Text>
            </View>
          </View>

        
        </View>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <>
        <SimpleHeader title="Manufacturing Details" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a1c22" />
          <Text style={styles.loadingText}>Loading manufacturing data...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <SimpleHeader title="Manufacturing Details" />

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
        {headerData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="factory" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No manufacturing data found</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchManufacturingData}>
              <Icon name="refresh" size={20} color="#FFF" />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* <View style={styles.summaryContainer}>
              <View style={styles.summaryItem}>
                <Icon name="file-document-multiple" size={24} color="#1a1c22" />
                <Text style={styles.summaryLabel}>Total Items</Text>
                <Text style={styles.summaryValue}>{headerData.length}</Text>
              </View>
            </View> */}

            {headerData.map((item, index) => renderCard(item, index))}
          </>
        )}
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 20,
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1c22',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFF',
    margin: 12,
    borderRadius: 15,
    elevation: 3,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    color: '#1a1c22',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#FFF',
    marginHorizontal: 12,
    marginVertical: 10,
    borderRadius: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1a1c22',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  totalBadge: {
    backgroundColor: '#1a1c22',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  totalText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  serialBadge: {
    backgroundColor: '#1a1c22',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serialText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  keyValueContainer: {
    padding: 5,
  },
  keyValueRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  keyContainer: {
    flex: 1,
    paddingRight: 10,
  },
  keyText: {
    fontSize: 14,
    color: '#444',
    fontWeight: '600',
  },
  valueContainer: {
    flex: 2,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#eee',
  },
  valueText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
    lineHeight: 20,
  },
  cardFooter: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});

export default ManufacturingView;
