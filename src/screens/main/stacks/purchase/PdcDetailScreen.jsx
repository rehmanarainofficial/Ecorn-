import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Dropdown} from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import SimpleHeader from '../../../../components/SimpleHeader';
import * as Animatable from 'react-native-animatable';
import {BASEURL} from '../../../../utils/BaseUrl';
import {formatDateString, formatDate} from '../../../../utils/DateUtils';

const PdcDetailScreen = () => {
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);
    setFromDate(lastMonth);
    setToDate(today);
    fetchSuppliers();
    fetchTransactions(lastMonth, today);
  }, []);

  const fetchSuppliers = async () => {
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
      console.log('Supplier API Error:', err);
    }
  };

  const fetchTransactions = async (fDate = fromDate, tDate = toDate) => {
    try {
      setLoading(true);
      const format = d => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      const formData = new FormData();
      formData.append('from_date', format(fDate));
      formData.append('to_date', format(tDate));
      formData.append('person', selectedCustomer || '');

      const res = await axios.post(
        `${BASEURL}dash_post_dated_cheque.php`,
        formData,
        {headers: {'Content-Type': 'multipart/form-data'}},
      );

      let data = res.data;
      if (typeof data === 'string') {
        const match = data.match(/\{.*\}/s);
        if (match) data = JSON.parse(match[0]);
      }

      if (data?.status === 'true' && Array.isArray(data.data)) {
        setTransactions(data.data);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.log('❌ Fetch Error:', err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const renderCard = ({item, index}) => {
    // Convert object into entries (key-value pairs)
    const entries = Object.entries(item).filter(
      ([key]) => key !== 'supp_reference',
    ); // remove supp_reference

    return (
      <Animatable.View
        animation="fadeInUp"
        duration={600}
        delay={index * 120}
        style={styles.card}>
        {entries.map(([key, value], idx) => {
          let displayKey =
            key === 'tran_date'
              ? 'Issue Date'
              : key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

          let displayValue = String(value || '-');
          if (
            key === 'tran_date' ||
            key === 'due_date' ||
            key.includes('_date')
          ) {
            displayValue = formatDateString(value);
          }

          return (
            <View key={idx} style={styles.cardRow}>
              <Text style={styles.cardKey}>{displayKey}</Text>
              <Text style={styles.cardValue}>{displayValue}</Text>
            </View>
          );
        })}
      </Animatable.View>
    );
  };

  return (
    <View style={styles.container}>
      <SimpleHeader title="Post Dated Cheque" />

      {/* Filters */}
      <View style={styles.filterContainer}>
        {/* Supplier Dropdown */}
        <Dropdown
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
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

        {/* Date Row */}
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
              fetchTransactions(lastMonth, today);
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
            onChange={(e, date) => {
              setShowFromPicker(false);
              if (date) setFromDate(date);
            }}
          />
        )}
        {showToPicker && (
          <DateTimePicker
            value={toDate || new Date()}
            mode="date"
            display="calendar"
            onChange={(e, date) => {
              setShowToPicker(false);
              if (date) setToDate(date);
            }}
          />
        )}
      </View>

      {/* Data Section */}
      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{marginTop: 30}} />
      ) : transactions.length === 0 ? (
        <View style={{alignItems: 'center', marginTop: 40}}>
          <Icon name="check-circle-outline" size={40} color="#555" />
          <Text style={{marginTop: 10, color: '#555', fontWeight: '600'}}>
            No Post Dated Cheques Found
          </Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: 100}}
        />
      )}
    </View>
  );
};

export default PdcDetailScreen;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F3F4F6'},
  filterContainer: {
    padding: 15,
    margin: 12,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: {width: 4, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  dropdown: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 8,
    marginBottom: 12,
    backgroundColor: '#f4f4f4',
  },
  placeholderStyle: {fontSize: 14, color: '#777'},
  selectedTextStyle: {fontSize: 14, color: '#000', fontWeight: '600'},
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
    backgroundColor: '#f4f4f4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 2, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  dateText: {
    color: '#000',
    fontWeight: '600',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#f4f4f4',
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {width: 2, height: 3},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  cardKey: {
    color: '#000',
    fontWeight: '600',
    flex: 1,
    textTransform: 'capitalize',
  },
  cardValue: {
    color: '#555',
    flex: 1,
    textAlign: 'right',
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
