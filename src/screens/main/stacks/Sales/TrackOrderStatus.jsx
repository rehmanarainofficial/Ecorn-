import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Animated,
  Platform,
  Alert,
  FlatList,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PlatformGradient from '../../../../components/PlatformGradient';
import axios from 'axios';
import {Dropdown} from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import {BASEURL} from '../../../../utils/BaseUrl';
import {formatDate, formatDateString} from '../../../../utils/DateUtils';

const COLORS = {
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  Primary: '#1a1c22',
  Secondary: '#5a5c6a',
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
      Alert.alert('Error', 'Unable to fetch orders');
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

  // Apply filter
  const applyFilter = () => {
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

    setFilteredOrders(data);
    Toast.show({
      type: 'success',
      text1: 'Filter Applied',
      position: 'bottom',
    });
  };

  const formatDateDisplay = dateStr => {
    return formatDateString(dateStr);
  };

  const renderCard = ({item, index}) => (
    <Animated.View
      key={item.order_no + index}
      style={[
        styles.card,
        {
          transform: [
            {translateY: animValues[index % animValues.length].translateY},
          ],
          opacity: animValues[index % animValues.length].opacity,
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
        <Text style={styles.kvValue}>{formatDateDisplay(item.ord_date)}</Text>
      </View>

      {/* Status Rows */}
      <View style={styles.statusRow}>
        <Text style={styles.statusText}>Order: {item.order_status}</Text>
        <Text style={styles.statusText}>Delivery: {item.del_status}</Text>
      </View>
      <View style={styles.statusRow}>
        <Text style={styles.statusText}>Invoice: {item.inv_status}</Text>
        <Text style={styles.statusText}>Mfg: {item.manufacturing_status}</Text>
      </View>
    </Animated.View>
  );

  {
    /* Data list */
  }
  {
    loading ? (
      <ActivityIndicator
        size="large"
        color={COLORS.WHITE}
        style={{marginTop: 50}}
      />
    ) : (
      <FlatList
        data={filteredOrders}
        keyExtractor={(item, idx) => item.order_no + idx}
        renderItem={renderCard}
        contentContainerStyle={{padding: 16}}
        initialNumToRender={15} // 👈 speed improve
        windowSize={10}
        removeClippedSubviews={true}
      />
    );
  }

  return (
    <PlatformGradient
      colors={[COLORS.Primary, COLORS.Secondary, COLORS.BLACK]}
      style={{flex: 1}}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" color={COLORS.WHITE} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Orders</Text>

        {/* Clear Filter Btn */}
        <TouchableOpacity
          onPress={() => {
            setSearch('');
            setSelectedLocation(null);
            setFromDate(null);
            setToDate(null);
            setFilteredOrders(orders);
            Toast.show({
              type: 'info',
              text1: 'Filters Cleared',
              position: 'bottom',
            });
          }}>
          <Text style={{color: COLORS.WHITE, fontSize: 15, fontWeight: '600'}}>
            Clear
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color={'#aaa'}
          style={{marginLeft: 8}}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search orders..."
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Location Dropdown */}
      <View style={{paddingHorizontal: 16, marginTop: 12}}>
        <Dropdown
          style={styles.dropdown}
          data={locations}
          search
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder="Select Location"
          placeholderStyle={{color: 'rgba(255,255,255,0.6)'}}
          searchPlaceholder="Search..."
          value={selectedLocation}
          onChange={item => setSelectedLocation(item.value)}
        />
      </View>

      {/* Date filter row */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setShowPicker({show: true, type: 'from'})}>
          <Text style={styles.filterBtnText}>
            {formatDate(fromDate) || 'From Date'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setShowPicker({show: true, type: 'to'})}>
          <Text style={styles.filterBtnText}>
            {formatDate(toDate) || 'To Date'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.applyBtn} onPress={applyFilter}>
          <Text style={{color: COLORS.WHITE, fontSize: 15, fontWeight: '600'}}>
            Apply
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date picker */}
      {showPicker.show && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={(e, selected) => {
            setShowPicker({show: false, type: null});
            if (selected) {
              if (showPicker.type === 'from') setFromDate(selected);
              else setToDate(selected);
            }
          }}
        />
      )}

      {/* Data list */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.WHITE}
          style={{marginTop: 50}}
        />
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
              <View style={styles.statusRow}>
                <Text style={styles.statusText}>
                  Order: {item.order_status}
                </Text>
                <Text style={styles.statusText}>
                  Delivery: {item.del_status}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusText}>
                  Invoice: {item.inv_status}
                </Text>
                <Text style={styles.statusText}>
                  Mfg: {item.manufacturing_status}
                </Text>
              </View>
            </Animated.View>
          )}
          contentContainerStyle={{padding: 16}}
          initialNumToRender={15}
          windowSize={10}
          removeClippedSubviews={true}
        />
      )}
    </PlatformGradient>
  );
};

export default TrackOrderStatus;

const styles = StyleSheet.create({
  header: {
    height: 80,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.WHITE,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    height: 50,
  },
  searchInput: {
    flex: 1,
    color: COLORS.WHITE,
    fontSize: 15,
    paddingHorizontal: 10,
  },
  dropdown: {
    height: 56,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginVertical: 14,
  },
  filterBtn: {
    flex: 1,
    marginRight: 8,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBtnText: {
    color: COLORS.WHITE,
    fontSize: 14,
  },
  applyBtn: {
    width: 80,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.Primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.WHITE,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 6,
  },
  cardDate: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.WHITE,
    fontWeight: '500',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.4)', // 👈 white overlay remove
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // 👈 align value to right
    marginBottom: 6,
  },
  kvKey: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  kvValue: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'right', // 👈 value right aligned
    flex: 1,
  },
});
