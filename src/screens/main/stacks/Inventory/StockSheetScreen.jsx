import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Dropdown} from 'react-native-element-dropdown';
import PlatformGradient from '../../../../components/PlatformGradient';
import axios from 'axios';
import {BASEURL} from '../../../../utils/BaseUrl';

const COLORS = {
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  Primary: '#1a1c22',
  Secondary: '#5a5c6a',
};

export default function StockSheetScreen({navigation}) {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState(null);
  const [locations, setLocations] = useState([]);
  const [category, setCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔹 Fetch dropdowns
  useEffect(() => {
    fetchDropdownData(
      `${BASEURL}locations.php`,
      setLocations,
      'loc_code',
      'location_name',
    );
    fetchDropdownData(
      `${BASEURL}stock_category.php`,
      setCategories,
      'category_id',
      'description',
    );
  }, []);

  const fetchDropdownData = async (url, setState, valueField, labelField) => {
    try {
      const {data} = await axios.get(url);
      if (data?.status === 'true') {
        const mapped = data.data.map(i => ({
          label: i[labelField],
          value: i[valueField],
        }));
        setState(mapped);
      }
    } catch (e) {
      console.log('Dropdown Fetch Error:', e);
    }
  };

  const fetchStockData = async (filters = {}) => {
    try {
      setLoading(true);
      const payload = new FormData();
      payload.append('description', filters.search || '');
      payload.append('loc_code', filters.location || '');
      payload.append('category_id', filters.category || '');

      const res = await axios.post(
        `${BASEURL}stock_check_sheet.php`,
        payload,
        {headers: {'Content-Type': 'multipart/form-data'}},
      );

      if (res.data?.status === 'true' && Array.isArray(res.data.data)) {
        setData(res.data.data);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('❌ Fetch Stock Error:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData({});
  }, []);

  const applyFilters = () => {
    fetchStockData({search, location, category});
  };

  const clearFilters = () => {
    setSearch('');
    setLocation(null);
    setCategory(null);
    setData([]);
    fetchStockData({});
  };

  const renderCard = ({item}) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.description}</Text>
      <View style={styles.cardRow}>
        <Text style={styles.cardKey}>Stock ID:</Text>
        <Text style={styles.cardValue}>{item.stock_id}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardKey}>Part Code:</Text>
        <Text style={styles.cardValue}>{item.text1 || '-'}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardKey}>Qty:</Text>
        <Text style={styles.cardValue}>{item.qoh}</Text>
      </View>
    </View>
  );

  return (
    <PlatformGradient
      colors={[COLORS.Primary, COLORS.Secondary, COLORS.BLACK]}
      style={{flex: 1}}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" color={COLORS.WHITE} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stock Sheet</Text>
        <TouchableOpacity onPress={clearFilters}>
          <Text style={{color: COLORS.WHITE, fontSize: 14}}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={{padding: 16}}>
        <View style={{flexDirection: 'row', gap: 12}}>
          <View style={[styles.glassInput, {flex: 1}]}>
            <TextInput
              style={styles.textInput}
              placeholder="Search by Name"
              placeholderTextColor={'rgba(255,255,255,0.6)'}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <Dropdown
            style={[styles.dropdown, {flex: 1}]}
            data={locations}
            search
            labelField="label"
            valueField="value"
            placeholder="Select Location"
            placeholderStyle={{color: 'rgba(255,255,255,0.6)'}}
            selectedTextStyle={{color: COLORS.WHITE}}
            itemTextStyle={{color: COLORS.BLACK}}
            value={location}
            onChange={item => setLocation(item.value)}
          />
        </View>

        <View style={{flexDirection: 'row', gap: 12, marginTop: 12}}>
          <Dropdown
            style={[styles.dropdown, {flex: 1}]}
            data={categories}
            search
            labelField="label"
            valueField="value"
            placeholder="Select Category"
            placeholderStyle={{color: 'rgba(255,255,255,0.6)'}}
            selectedTextStyle={{color: COLORS.WHITE}}
            itemTextStyle={{color: COLORS.BLACK}}
            value={category}
            onChange={item => setCategory(item.value)}
          />
          <TouchableOpacity onPress={applyFilters} style={styles.applyButton}>
            <Text style={{color: COLORS.WHITE, fontWeight: '700'}}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Data List */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.WHITE}
          style={{marginTop: 30}}
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderCard}
          contentContainerStyle={{paddingHorizontal: 16, paddingBottom: 100}}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <Text
              style={{
                color: COLORS.WHITE,
                textAlign: 'center',
                marginTop: 30,
              }}>
              No records found
            </Text>
          )}
        />
      )}
    </PlatformGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {color: '#fff', fontSize: 20, fontWeight: '700'},
  glassInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textInput: {color: '#fff', fontSize: 16},
  dropdown: {
    height: 52,
    borderRadius: 10,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  applyButton: {
    backgroundColor: '#3b3f51',
    borderRadius: 10,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardTitle: {
    color: COLORS.WHITE,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardKey: {color: 'rgba(255,255,255,0.7)', fontWeight: '600'},
  cardValue: {color: COLORS.WHITE, textAlign: 'right', flexShrink: 1},
});
