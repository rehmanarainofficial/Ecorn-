import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Dropdown} from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import {BASEURL} from '../../../../utils/BaseUrl';
import SimpleHeader from '../../../../components/SimpleHeader';

const ElectricalJobCardsScreen = ({navigation}) => {
  const [allData, setAllData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationMap, setLocationMap] = useState({});
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Default dates: fromDate = 30 days ago, toDate = today
  const getDefaultFromDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  };

  const [fromDate, setFromDate] = useState(getDefaultFromDate());
  const [toDate, setToDate] = useState(new Date());

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  // 📌 Format date dd/mm/yy for display
  const formatDate = d => {
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, '0')}/${String(
      date.getMonth() + 1,
    ).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`;
  };

  // 📌 Format date yyyy-mm-dd for API
  const formatDateForAPI = d => {
    const date = new Date(d);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // 📌 Fetch data with POST
  const fetchData = async (
    fDate = fromDate,
    tDate = toDate,
    costCenter = selectedLocation,
  ) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('from_date', formatDateForAPI(fDate));
      formData.append('to_date', formatDateForAPI(tDate));
      if (costCenter) {
        formData.append('cost_center', costCenter);
      }

      const res = await axios.post(
        `${BASEURL}electrical_job_cards.php`,
        formData,
        {
          headers: {'Content-Type': 'multipart/form-data'},
        },
      );
      console.log(res.data);

      if (res.data?.status === 'true') {
        const rows = res.data.data || [];
        setAllData(rows);
        setFiltered(rows);
      } else {
        setAllData([]);
        setFiltered([]);
      }
    } catch (err) {
      console.log('Fetch Error:', err);
      setAllData([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await axios.get(`${BASEURL}locations.php`);
      if (res.data?.status === 'true') {
        const formatted = res.data.data.map(loc => ({
          label: loc.location_name,
          value: loc.loc_code,
        }));
        setLocations(formatted);

        // map bana lo (quick lookup ke liye)
        const map = {};
        res.data.data.forEach(loc => {
          map[loc.loc_code] = loc.location_name;
        });
        setLocationMap(map);
      }
    } catch (err) {
      console.log('Location fetch error:', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchLocations();
  }, []);

  // 📌 Apply filter button - calls API with filters
  const applyFilter = () => {
    fetchData(fromDate, toDate, selectedLocation);
  };

  // 📌 Clear filter - reset to defaults
  const clearFilter = () => {
    const defaultFrom = getDefaultFromDate();
    const defaultTo = new Date();
    setFromDate(defaultFrom);
    setToDate(defaultTo);
    setSelectedLocation(null);
    fetchData(defaultFrom, defaultTo, null);
  };

  // 📌 Render table row
  const renderRow = ({item}) => (
    <View style={styles.row}>
      <Text style={[styles.cell, {flex: 0.9}]}>{item.reference}</Text>
      <Text style={[styles.cell, {flex: 0.8}]}>
        {formatDate(item.bulk_entry_date)}
      </Text>

      {/* 🔹 Order No column = Location name */}
      <Text style={[styles.cell, {flex: 1}]}>
        {locationMap[item.location] || item.location}
      </Text>

      <Text style={[styles.cell, {flex: 0.8}]}>{item.entry_by}</Text>
      <View style={[styles.cell, {flex: 1.3}]}>
        <View style={styles.actionContainer}>
          {/* 🔹 Estimate Icon */}
          <TouchableOpacity
            style={styles.actionIcon}
            onPress={() =>
              navigation.navigate('MechanicalEstimate', {
                job_id: item.job_id,
                project_id: item.sale_order,
                requisitionid: item.requisitionid,
              })
            }>
            <Ionicons name="document-text-outline" size={20} color="#4cafef" />
            <Text style={styles.iconLabel}>Estimate</Text>
          </TouchableOpacity>

          {/* 🔹 Produce Icon */}
          <TouchableOpacity
            style={styles.actionIcon}
            onPress={() =>
              navigation.navigate('MechanicalProduce', {
                sales_order: item.sale_order,
              })
            }>
            <Ionicons name="hammer-outline" size={20} color="#ff9800" />
            <Text style={styles.iconLabel}>Produce</Text>
          </TouchableOpacity>

          {/* 🔹 NEW: Manufacturing View Icon */}
          <TouchableOpacity
            style={styles.actionIcon}
            onPress={() =>
              navigation.navigate('ManufacturingView', {
                trans_no: item.trans_no,
              })
            }>
            <Ionicons name="eye-outline" size={20} color="#4CAF50" />
            <Text style={styles.iconLabel}>View</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SimpleHeader title="Electrical Job Cards" />

      {/* 📍 Location Dropdown */}
      <View style={{paddingHorizontal: 16, marginBottom: 12, marginTop: 12}}>
        <Dropdown
          style={styles.dropdown}
          data={locations}
          search
          searchPlaceholder="Search location..."
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder="Select Location"
          placeholderStyle={{color: '#999'}}
          selectedTextStyle={{color: '#333'}}
          itemTextStyle={{color: '#000'}}
          value={selectedLocation}
          onChange={item => setSelectedLocation(item.value)}
        />
      </View>

      {/* 📅 From Date - To Date - Filter Icons */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.dateBtn}
          onPress={() => setShowFromPicker(true)}>
          <Text style={styles.dateText}>
            {fromDate ? formatDate(fromDate) : 'From Date'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dateBtn}
          onPress={() => setShowToPicker(true)}>
          <Text style={styles.dateText}>
            {toDate ? formatDate(toDate) : 'To Date'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={applyFilter}>
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearBtn} onPress={clearFilter}>
          <Ionicons name="close-circle" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* 📅 Date Pickers */}
      {showFromPicker && (
        <DateTimePicker
          value={fromDate || new Date()}
          mode="date"
          display="calendar"
          onChange={(event, date) => {
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
          onChange={(event, date) => {
            setShowToPicker(false);
            if (date) setToDate(date);
          }}
        />
      )}

      {/* Table Header */}
      <View style={[styles.row, styles.tableHeaderRow]}>
        <Text style={[styles.headerCell, {flex: 0.9}]}>Ref</Text>
        <Text style={[styles.headerCell, {flex: 0.8}]}>Date</Text>
        <Text style={[styles.headerCell, {flex: 1}]}>Cost Center</Text>
        <Text style={[styles.headerCell, {flex: 0.8}]}>User</Text>
        <Text style={[styles.headerCell, {flex: 1.3}]}>Action</Text>
      </View>

      {/* Table Data */}
      {loading ? (
        <ActivityIndicator color="#1a1c22" style={{marginTop: 20}} />
      ) : filtered.length === 0 ? (
        <View style={styles.noDataBox}>
          <Ionicons name="alert-circle" size={40} color="#666" />
          <Text style={styles.noDataText}>No Data Found</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderRow}
          keyExtractor={(item, idx) => item.id + idx}
          contentContainerStyle={{paddingBottom: 80}}
        />
      )}
    </View>
  );
};

export default ElectricalJobCardsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  dropdown: {
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 50,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  dateBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateText: {color: '#333', textAlign: 'center', fontWeight: '500'},
  iconBtn: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#1a1c22',
  },
  clearBtn: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#e74c3c',
  },
  tableHeaderRow: {
    backgroundColor: '#1a1c22',
    marginHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    padding: 12,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cell: {
    color: '#333',
    fontSize: 12,
    textAlign: 'center',
  },
  headerCell: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  actionIcon: {
    alignItems: 'center',
    paddingHorizontal: 3,
    paddingVertical: 2,
    minWidth: 35,
  },
  iconLabel: {
    color: '#333',
    fontSize: 8,
    marginTop: 2,
    textAlign: 'center',
  },
  noDataBox: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    marginTop: 8,
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});
