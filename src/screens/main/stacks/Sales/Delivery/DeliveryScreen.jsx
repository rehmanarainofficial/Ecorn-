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
import SimpleHeader from '../../../../../components/SimpleHeader';
import {BASEURL} from '../../../../../utils/BaseUrl';
import * as Animatable from 'react-native-animatable';
import {formatDate, formatDateString} from '../../../../../utils/DateUtils';
import {formatNumber} from '../../../../../utils/NumberUtils';

const DeliveryScreen = ({navigation}) => {
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
  console.log('transactions', transactions);

  useEffect(() => {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);

    setFromDate(lastMonth);
    setToDate(today);

    fetchCustomers();
    fetchLocations();
    fetchTransactions(lastMonth, today, '', '');
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${BASEURL}debtors_master.php`);
      if (res.data?.status === 'true') {
        setCustomers(
          res.data.data.map(c => ({
            label: c.name,
            value: c.debtor_no,
          })),
        );
      }
    } catch (err) {
      console.log('Customer API Error:', err);
    }
  };

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
      }
    } catch (err) {
      console.log('Location API Error:', err);
    }
  };

  // 🔹 POST request for pending_so
  const fetchTransactions = async (
    from = fromDate,
    to = toDate,
    loc = selectedLocation,
    person = selectedCustomer,
  ) => {
    try {
      setLoading(true);

      // ✅ format yyyy/mm/dd
      const formatDate = date => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}/${mm}/${dd}`;
      };

      const postData = {
        from_date: formatDate(from),
        to_date: formatDate(to),
        loc_code: loc || '',
        person_id: person || '',
      };

      const res = await axios.post(`${BASEURL}pending_so.php`, postData, {
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      });

      // 🧠 Extract JSON if extra text exists
      if (typeof res.data === 'string') {
        const match = res.data.match(/\{.*\}/s);
        if (match) res.data = JSON.parse(match[0]);
      }

      if (res.data?.status === 'true' && Array.isArray(res.data.data)) {
        const cleanData = [...res.data.data];
        setTransactions(cleanData);
        console.log(cleanData);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.log('Transactions API Error:', err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDisplayDateForHeader = date => formatDate(date);

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
        <Text style={styles.cell}>{formatDateString(item.ord_date)}</Text>
      </View>

      <View style={styles.cellWrapper}>
        <Text style={styles.cell}>{formatAmountDisplay(item.total)}</Text>
      </View>

      <View style={[styles.cellWrapper, {borderRightWidth: 0}]}>
        <View style={styles.actionContainer}>
          {/* Delivery Icon */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() =>
              navigation.navigate('DeliveryNote', {
                orderId: item.order_no,
                personId: item.person_id,
                locCode: item.location,
                price_list: item.price_list,
                ship_via: item.ship_via,
                name: item.name,
                location: item.location_name,
                reference: item.reference,
                date: item.ord_date,
              })
            }>
            <Icon name="truck-delivery" size={22} color="#fff" />
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
      </View>
    </Animatable.View>
  );
  return (
    <View style={styles.container}>
      <SimpleHeader title="Delivery" />

      <View style={styles.filterContainer}>
        {/* 🔹 Customer Dropdown */}
        <Dropdown
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          data={customers}
          search
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder="Select Customer"
          searchPlaceholder="Search..."
          value={selectedCustomer}
          onChange={item => setSelectedCustomer(item.value)}
          // selectedTextStyle={{color: '#000'}}
          itemTextStyle={{color: '#000'}}
        />

        {/* 🔹 Location Dropdown */}
        <Dropdown
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          data={locations}
          search
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder="Select cost center"
          searchPlaceholder="Search..."
          value={selectedLocation}
          onChange={item => setSelectedLocation(item.value)}
          // selectedTextStyle={{color: '#000'}}
          itemTextStyle={{color: '#000'}}
        />

        {/* 🔹 Date Pickers + Apply */}
        <View style={styles.dateRow}>
          <TouchableOpacity
            style={styles.morphButton}
            onPress={() => setShowFromPicker(true)}>
            <Text style={styles.dateText}>
              {formatDisplayDateForHeader(fromDate)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.morphButton}
            onPress={() => setShowToPicker(true)}>
            <Text style={styles.dateText}>
              {formatDisplayDateForHeader(toDate)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() =>
              fetchTransactions(
                fromDate,
                toDate,
                selectedLocation,
                selectedCustomer,
              )
            }>
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
              fetchTransactions(lastMonth, today, '', '');
            }}>
            <Icon name="close-circle" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Date Pickers */}
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

      {/* Transactions */}
      {loading ? (
        <ActivityIndicator size="large" color="#1a1c22" />
      ) : transactions.length === 0 ? (
        <View style={{alignItems: 'center', marginTop: 30}}>
          <Icon name="file-alert" size={40} color="#666" />
          <Text style={{marginTop: 10, color: '#666'}}>No Data Found</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={item =>
            item.order_no?.toString() || Math.random().toString()
          }
          renderItem={renderItem}
          contentContainerStyle={{paddingBottom: 80}}
        />
      )}
    </View>
  );
};

export default DeliveryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  filterContainer: {
    padding: 15,
    margin: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  morphButton: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  dropdown: {
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  placeholderStyle: {fontSize: 14, color: '#999'},
  selectedTextStyle: {fontSize: 14, color: '#333', fontWeight: '600'},
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1a1c22',
    padding: 12,
    marginHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
  },
  headerCell: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    padding: 12,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cell: {fontSize: 12, color: '#333', textAlign: 'center'},
  cellWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
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
  },
  clearButton: {
    width: 44,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#dc3545',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  actionIcon: {
    padding: 5,
    backgroundColor: '#1a1c22',
    borderRadius: 6,
  },
});
