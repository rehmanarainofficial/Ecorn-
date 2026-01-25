import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Animated,
  FlatList,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SimpleHeader from '../../../../components/SimpleHeader';
import axios from 'axios';
import {Dropdown} from 'react-native-element-dropdown';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Toast from 'react-native-toast-message';
import {BASEURL} from '../../../../utils/BaseUrl';
import {formatDate, formatDateString} from '../../../../utils/DateUtils';

const COLORS = {
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  Primary: '#1a1c22',
  Secondary: '#5a5c6a',
  Background: '#F3F4F6',
  Border: '#E2E8F0',
  TextDark: '#1E293B',
  TextMuted: '#64748B',
  CardBg: '#FFFFFF',
};

const TrackOrderStatus = ({navigation}) => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);

  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [search, setSearch] = useState('');

  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showPicker, setShowPicker] = useState({show: false, type: null});

  const [loading, setLoading] = useState(false);

  // Animation values
  const animValues = useRef([]).current;
  const cardCount = 10;
  if (animValues.length === 0) {
    for (let i = 0; i < cardCount; i++) {
      animValues.push({
        translateY: new Animated.Value(20),
        opacity: new Animated.Value(0),
      });
    }
  }

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASEURL}track_orders_data.php`);
      if (Array.isArray(res.data)) {
        setOrders(res.data);
        setFilteredOrders(res.data);
      } else {
        setOrders([]);
        setFilteredOrders([]);
      }
    } catch (err) {
      console.log('Orders fetch error:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Unable to fetch orders',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch locations
  const fetchLocations = async () => {
    try {
      const res = await axios.get(`${BASEURL}locations.php`);
      if (res.data?.status === 'true') {
        const formatted = res.data.data.map(loc => ({
          label: loc.location_name,
          value: loc.loc_code,
        }));
        setLocations(formatted);
      }
    } catch (err) {
      console.log('Location fetch error:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchLocations();
  }, []);

  // Animation on mount
  useEffect(() => {
    const anims = animValues.map((av, idx) =>
      Animated.parallel([
        Animated.timing(av.translateY, {
          toValue: 0,
          duration: 450,
          delay: idx * 60,
          useNativeDriver: true,
        }),
        Animated.timing(av.opacity, {
          toValue: 1,
          duration: 450,
          delay: idx * 60,
          useNativeDriver: true,
        }),
      ]),
    );
    Animated.stagger(80, anims).start();
  }, [filteredOrders]);

  const [checks, setChecks] = useState({
    mfg: false,
    delivery: false,
    invoice: false,
  });

  // Apply filter
  const applyFilter = (showToast = true) => {
    let data = [...orders];

    // Search filter
    if (search.trim() !== '') {
      data = data.filter(
        o =>
          o.br_name.toLowerCase().includes(search.toLowerCase()) ||
          o.branch_ref.toLowerCase().includes(search.toLowerCase()) ||
          o.order_no.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // Location filter
    if (selectedLocation) {
      data = data.filter(o => o.location === selectedLocation);
    }

    // Date range filter
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      data = data.filter(o => {
        const orderDate = new Date(o.ord_date);
        return orderDate >= from && orderDate <= to;
      });
    }

    // State-based mutually exclusive filters
    if (checks.mfg) {
      data = data.filter(o => o.manufacturing_status === 'No');
    } else if (checks.delivery) {
      data = data.filter(
        o => o.manufacturing_status === 'Yes' && o.del_status === 'No',
      );
    } else if (checks.invoice) {
      data = data.filter(
        o =>
          o.manufacturing_status === 'Yes' &&
          o.del_status === 'Yes' &&
          o.inv_status === 'No',
      );
    }

    setFilteredOrders(data);
    if (showToast) {
      Toast.show({
        type: 'success',
        text1: 'Filter Applied',
        position: 'bottom',
      });
    }
  };

  useEffect(() => {
    applyFilter(false);
  }, [checks]);

  const toggleCheck = key => {
    setChecks(prev => {
      const newState = {mfg: false, delivery: false, invoice: false};
      // Toggle the target key, others remain false
      newState[key] = !prev[key];
      return newState;
    });
  };

  const formatDateDisplay = dateStr => {
    return formatDateString(dateStr);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedLocation(null);
    setFromDate(null);
    setToDate(null);
    setChecks({mfg: false, delivery: false, invoice: false});
    setFilteredOrders(orders);
    Toast.show({
      type: 'info',
      text1: 'Filters Cleared',
      position: 'bottom',
    });
  };

  return (
    <View style={styles.container}>
      <SimpleHeader title="Track Orders" />

      {/* Filter Section */}
      <View style={styles.filterContainer}>
        {/* Search bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={COLORS.TextMuted}
            style={{marginLeft: 12}}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
            placeholderTextColor={COLORS.TextMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch('')}
              style={{paddingRight: 12}}>
              <Ionicons
                name="close-circle"
                size={20}
                color={COLORS.TextMuted}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Location Dropdown */}
        <Dropdown
          style={styles.dropdown}
          placeholderStyle={styles.dropdownPlaceholder}
          selectedTextStyle={styles.dropdownSelectedText}
          inputSearchStyle={styles.dropdownInputSearch}
          data={locations}
          search
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder="Select Cost Center"
          searchPlaceholder="Search..."
          value={selectedLocation}
          onChange={item => setSelectedLocation(item.value)}
        />

        {/* Date filter row */}
        <View style={styles.dateRow}>
          <TouchableOpacity
            style={styles.dateBtn}
            onPress={() => setShowPicker({show: true, type: 'from'})}>
            <Ionicons
              name="calendar-outline"
              size={18}
              color={COLORS.TextMuted}
            />
            <Text style={styles.dateBtnText}>
              {formatDate(fromDate) || 'From Date'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateBtn}
            onPress={() => setShowPicker({show: true, type: 'to'})}>
            <Ionicons
              name="calendar-outline"
              size={18}
              color={COLORS.TextMuted}
            />
            <Text style={styles.dateBtnText}>
              {formatDate(toDate) || 'To Date'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => applyFilter()}>
            <Ionicons name="search" size={18} color={COLORS.WHITE} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
            <Ionicons name="close-circle" size={18} color={COLORS.WHITE} />
          </TouchableOpacity>
        </View>

        {/* Checkbox Row */}
        <View style={styles.checkboxRow}>
          <TouchableOpacity
            style={[styles.checkItem, checks.mfg && styles.checkItemActive]}
            onPress={() => toggleCheck('mfg')}>
            <Ionicons
              name={checks.mfg ? 'checkbox' : 'checkbox-outline'}
              size={20}
              color={checks.mfg ? COLORS.WHITE : COLORS.TextDark}
            />
            <Text
              style={[
                styles.checkLabel,
                checks.mfg && styles.checkLabelActive,
              ]}>
              Mfg
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.checkItem,
              checks.delivery && styles.checkItemActive,
            ]}
            onPress={() => toggleCheck('delivery')}>
            <Ionicons
              name={checks.delivery ? 'checkbox' : 'checkbox-outline'}
              size={20}
              color={checks.delivery ? COLORS.WHITE : COLORS.TextDark}
            />
            <Text
              style={[
                styles.checkLabel,
                checks.delivery && styles.checkLabelActive,
              ]}>
              Delivery
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.checkItem, checks.invoice && styles.checkItemActive]}
            onPress={() => toggleCheck('invoice')}>
            <Ionicons
              name={checks.invoice ? 'checkbox' : 'checkbox-outline'}
              size={20}
              color={checks.invoice ? COLORS.WHITE : COLORS.TextDark}
            />
            <Text
              style={[
                styles.checkLabel,
                checks.invoice && styles.checkLabelActive,
              ]}>
              Invoice
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date picker */}
      <DateTimePickerModal
        isVisible={showPicker.show}
        mode="date"
        onConfirm={selected => {
          setShowPicker({show: false, type: null});
          if (selected) {
            if (showPicker.type === 'from') setFromDate(selected);
            else setToDate(selected);
          }
        }}
        onCancel={() => setShowPicker({show: false, type: null})}
      />

      {/* Data list */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.Primary} />
          <Text style={styles.loaderText}>Loading orders...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item, idx) => item.order_no + idx}
          renderItem={({item, index}) => (
            <Animated.View
              key={item.order_no + index}
              style={[
                styles.card,
                {
                  transform: [
                    {
                      translateY:
                        animValues[index % animValues.length]?.translateY || 0,
                    },
                  ],
                  opacity: animValues[index % animValues.length]?.opacity || 1,
                },
              ]}>
              {/* Key-Value Pairs */}
              <View style={styles.kvRow}>
                <Text style={styles.kvKey}>Name:</Text>
                <Text style={styles.kvValue}>{item.br_name}</Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={styles.kvKey}>Location:</Text>
                <Text style={styles.kvValue}>{item.branch_ref}</Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={styles.kvKey}>Date:</Text>
                <Text style={styles.kvValue}>
                  {formatDateDisplay(item.ord_date)}
                </Text>
              </View>

              {/* Status Rows */}
              <View style={styles.statusContainer}>
                <View style={styles.statusRow}>
                  <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>Order</Text>
                    <Text
                      style={[
                        styles.statusValue,
                        {
                          color:
                            item.order_status === 'Yes' ? '#10B981' : '#EF4444',
                        },
                      ]}>
                      {item.order_status}
                    </Text>
                  </View>
                  <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>Manufacturing</Text>
                    <Text
                      style={[
                        styles.statusValue,
                        {
                          color:
                            item.manufacturing_status === 'Yes'
                              ? '#10B981'
                              : '#EF4444',
                        },
                      ]}>
                      {item.manufacturing_status}
                    </Text>
                  </View>
                </View>
                <View style={styles.statusRow}>
                  <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>Delivery</Text>
                    <Text
                      style={[
                        styles.statusValue,
                        {
                          color:
                            item.del_status === 'Yes' ? '#10B981' : '#EF4444',
                        },
                      ]}>
                      {item.del_status}
                    </Text>
                  </View>
                  <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>Invoice</Text>
                    <Text
                      style={[
                        styles.statusValue,
                        {
                          color:
                            item.inv_status === 'Yes' ? '#10B981' : '#EF4444',
                        },
                      ]}>
                      {item.inv_status}
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}
          contentContainerStyle={styles.listContent}
          initialNumToRender={15}
          windowSize={10}
          removeClippedSubviews={true}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="document-text-outline"
                size={48}
                color={COLORS.TextMuted}
              />
              <Text style={styles.emptyText}>No orders found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default TrackOrderStatus;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  filterContainer: {
    backgroundColor: COLORS.WHITE,
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.Border,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.Border,
    height: 46,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: COLORS.TextDark,
    fontSize: 15,
    paddingHorizontal: 10,
  },
  dropdown: {
    height: 46,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.Border,
    marginBottom: 12,
  },
  dropdownPlaceholder: {
    color: COLORS.TextMuted,
    fontSize: 15,
  },
  dropdownSelectedText: {
    color: COLORS.TextDark,
    fontSize: 15,
  },
  dropdownInputSearch: {
    height: 40,
    fontSize: 15,
    borderColor: COLORS.Border,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.Border,
    gap: 6,
  },
  dateBtnText: {
    color: COLORS.TextDark,
    fontSize: 13,
  },
  applyBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: COLORS.Primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  checkItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.Border,
  },
  checkItemActive: {
    backgroundColor: COLORS.Primary,
    borderColor: COLORS.Primary,
  },
  checkLabel: {
    color: COLORS.TextDark,
    fontSize: 14,
    fontWeight: '500',
  },
  checkLabelActive: {
    color: COLORS.WHITE,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.Border,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  kvKey: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TextMuted,
  },
  kvValue: {
    fontSize: 14,
    color: COLORS.TextDark,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  statusContainer: {
    marginTop: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: COLORS.TextMuted,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loaderText: {
    color: COLORS.TextDark,
    fontSize: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.Border,
  },
  emptyText: {
    color: COLORS.TextMuted,
    fontSize: 16,
    marginTop: 12,
  },
});
