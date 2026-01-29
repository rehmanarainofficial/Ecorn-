import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Dropdown} from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import SimpleHeader from '../../../../components/SimpleHeader';
import * as Animatable from 'react-native-animatable';
import {formatDate, formatDateString} from '../../../../utils/DateUtils';
import {formatNumber} from '../../../../utils/NumberUtils';
import {BASEURL} from '../../../../utils/BaseUrl';

const GrnAgainst = ({navigation, route}) => {
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);

  // 🔹 Auto set default dates + initial fetch
  useEffect(() => {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);
    setFromDate(lastMonth);
    setToDate(today);

    fetchCustomers();
    fetchLocations();
    fetchTransactions(lastMonth, today);
  }, []);

  // 🔹 Refresh when coming back from GRN
  useEffect(() => {
    if (route?.params?.refresh) {
      fetchTransactions(fromDate, toDate);
    }
  }, [route?.params?.refresh]);

  // 🔹 Fetch Suppliers
  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${BASEURL}suppliers.php`);
      
      if (res.data?.status === 'true') {
        setCustomers(
          res.data.data.map(c => ({
            label: c.name,
            value: c.supplier_id,
          })),
        );
      }
    } catch (err) {
      console.log('Customer API Error:', err);
    }
  };

  // 🔹 Fetch Locations
  const fetchLocations = async () => {
    try {
      const res = await axios.get(`${BASEURL}locations.php`);
      if (res.data?.status === 'true') {
        setLocations(
          res.data.data.map(l => ({
            label: l.location_name,
            value: l.loc_code,
          })),
        );
        console.log(res.data.data);
      }
    } catch (err) {
      console.log('Location API Error:', err);
    }
  };

  // 🔹 Fetch Pending POs (POST version — React Native safe)
  const fetchTransactions = async (fDate = fromDate, tDate = toDate) => {
    try {
      setLoading(true);

      const format = d => {
        if (!d) return '';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      console.log(selectedLocation);
      
      // 🔸 Prepare POST data
      const formData = new FormData();
      formData.append('from_date', format(fDate));
      formData.append('to_date', format(tDate));
      formData.append('loc_code', selectedLocation || '');
      formData.append('person_id', selectedCustomer || '');

      // 🔸 POST request
      const res = await axios.post(`${BASEURL}pending_po.php`, formData, {
        headers: {'Content-Type': 'multipart/form-data'},
      });
      // 🧠 Handle extra junk text
      if (typeof res.data === 'string') {
        const match = res.data.match(/\{.*\}/s);
        if (match) res.data = JSON.parse(match[0]);
      }

      // ✅ Success condition
      if (res.data?.status === 'true' && Array.isArray(res.data.data)) {
        setTransactions(res.data.data);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Formatters
  const formatDateDisplay = dateStr => {
    return formatDateString(dateStr);
  };

  const formatAmountDisplay = amt => {
    return formatNumber(amt);
  };

  const renderItem = ({item, index}) => (
    <Animatable.View
      animation="fadeInUp"
      duration={600}
      delay={index * 100}
      style={styles.row}>
      <View style={styles.cellWrapper}>
        <Text style={styles.cell}>{item.reference || '-'}</Text>
      </View>

      <View style={styles.cellWrapper}>
        <Text style={styles.cell}>{formatDateDisplay(item.ord_date)}</Text>
      </View>

      <View style={styles.cellWrapper}>
        <Text style={styles.cell}>{formatAmountDisplay(item.total)}</Text>
      </View>

      <View style={[styles.cellWrapper, {borderRightWidth: 0}]}>
        <TouchableOpacity
          style={{alignItems: 'center'}}
          onPress={() =>
            navigation.navigate('GrnDeliveryNote', {
              orderId: item.order_no,
              personId: item.person_id,
              locCode: item.location,
              location: item.location_name,
              name: item.name,
            })
          }>
          <Icon name="truck-delivery" size={22} color="#1a1c22" />
        </TouchableOpacity>

        {/* View Transaction Icon - NEW */}
        <TouchableOpacity
          style={[styles.iconButton, {marginLeft: 10}]}
          onPress={() =>
            navigation.navigate('ViewTransactions', {
              trans_no: item.order_no,
              type: 30, // Sales Order type
            })
          }>
          <Icon name="eye-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </Animatable.View>
  );

  // 🔹 Main UI
  return (
    <View style={styles.container}>
      <SimpleHeader title="GRN Against PO" />

      <View style={styles.filterContainer}>
        {/* Supplier */}
        <Dropdown
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          itemTextStyle={{color: '#000'}}
          inputSearchStyle={{color: '#000'}}
          data={customers}
          search
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder="Select Supplier"
          searchPlaceholder="Search..."
          value={selectedCustomer}
          onChange={item => setSelectedCustomer(item.value)}
        />

        {/* Location */}
        <Dropdown
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          itemTextStyle={{color: '#000'}}
          inputSearchStyle={{color: '#000'}}
          data={locations}
          search
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder="Select Location"
          searchPlaceholder="Search..."
          value={selectedLocation}
          onChange={item => setSelectedLocation(item.value)}
        />

        {/* Dates + Apply */}
        <View style={styles.dateRow}>
          <TouchableOpacity
            style={styles.morphButton}
            onPress={() => setShowFromPicker(true)}>
            <Text style={styles.dateText}>{formatDate(fromDate)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.morphButton}
            onPress={() => setShowToPicker(true)}>
            <Text style={styles.dateText}>{formatDate(toDate)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => fetchTransactions()}>
            <Icon name="magnify" size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              const today = new Date();
              const lastMonth = new Date();
              lastMonth.setMonth(today.getMonth() - 1);
              setFromDate(lastMonth);
              setToDate(today);
              setSelectedCustomer(null);
              setSelectedLocation(null);
              fetchTransactions(lastMonth, today);
            }}>
            <Icon name="close-circle" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Pickers */}
        {showFromPicker && (
          <DateTimePicker
            value={fromDate || new Date()}
            mode="date"
            display="calendar"
            onChange={(event, selectedDate) => {
              setShowFromPicker(false);
              if (selectedDate) setFromDate(selectedDate);
            }}
          />
        )}
        {showToPicker && (
          <DateTimePicker
            value={toDate || new Date()}
            mode="date"
            display="calendar"
            onChange={(event, selectedDate) => {
              setShowToPicker(false);
              if (selectedDate) setToDate(selectedDate);
            }}
          />
        )}
      </View>

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, {flex: 1}]}>Ref</Text>
        <Text style={[styles.headerCell, {flex: 1}]}>Date</Text>
        <Text style={[styles.headerCell, {flex: 1}]}>Amount</Text>
        <Text style={[styles.headerCell, {flex: 1}]}>Action</Text>
      </View>

      {/* Data */}
      {loading ? (
        <ActivityIndicator size="large" color="#1a1c22" />
      ) : transactions.length === 0 ? (
        <View style={{alignItems: 'center', marginTop: 30}}>
          <Icon name="check-circle-outline" size={40} color="#4CAF50" />
          <Text style={{marginTop: 10, color: '#4CAF50', fontWeight: '600'}}>
            All Purchase Orders are completed
          </Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default GrnAgainst;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F3F4F6'},
  filterContainer: {
    padding: 15,
    margin: 12,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {width: 6, height: 6},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  morphButton: {
    flex: 1,
    marginHorizontal: 3,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 2, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  dateText: {
    color: '#000',
    fontWeight: '600',
    textAlign: 'center',
  },
  dropdown: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 8,
    marginBottom: 12,
    backgroundColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {width: 4, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  placeholderStyle: {fontSize: 14, color: '#5a5c6a'},
  selectedTextStyle: {fontSize: 14, color: '#000', fontWeight: '600'},
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1a1c22',
    padding: 10,
    marginHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
  },
  headerCell: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    padding: 12,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOffset: {width: 3, height: 3},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  cell: {fontSize: 12, color: '#000', textAlign: 'center'},
  cellWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#d1d1d1',
    paddingHorizontal: 4,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconButton: {
    width: 44,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1a1c22',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
  },
  clearButton: {
    width: 44,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#dc3545',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
  },
});
