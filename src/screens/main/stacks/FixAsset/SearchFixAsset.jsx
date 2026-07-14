import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import {Dropdown} from 'react-native-element-dropdown';
import {BASEURL} from '../../../../utils/BaseUrl';
import SimpleHeader from '../../../../components/SimpleHeader';

const COLORS = {
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  Primary: '#1a1c22',
  Secondary: '#5a5c6a',
  BG: '#f3f4f6',
  TEXT_PRIMARY: '#1f2937',
  TEXT_SECONDARY: '#6b7280',
  BORDER: '#e5e7eb',
};

const ITEMS_PER_PAGE = 30;

export default function SearchFixAsset({navigation}) {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchDescription, setSearchDescription] = useState('');

  // Pagination
  const [visibleAssets, setVisibleAssets] = useState([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Fetch options on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const catRes = await axios.get(`${BASEURL}fix_asset_stock_category.php`);
        if ((catRes.data?.status === 'true' || catRes.data?.status === true) && Array.isArray(catRes.data.data)) {
          setCategories(catRes.data.data.map(c => ({ label: c.description, value: c.category_id })));
        }

        const locRes = await axios.get(`${BASEURL}fix_asset_locations.php`);
        if ((locRes.data?.status === 'true' || locRes.data?.status === true) && Array.isArray(locRes.data.data)) {
          setLocations(locRes.data.data.map(l => ({ label: l.location_name, value: l.loc_code })));
        }

        const empRes = await axios.get(`${BASEURL}get_all_employees.php`);
        if ((empRes.data?.status === 'true' || empRes.data?.status === true) && Array.isArray(empRes.data.data)) {
          setEmployees(empRes.data.data.map(e => ({
            label: e.emp_code ? `${e.emp_name} - ${e.emp_code}` : e.emp_name,
            value: e.employee_id
          })));
        }
      } catch (err) {
        console.log('Options Fetch Error:', err);
      }
    };

    fetchOptions();
    fetchAssets();
  }, []);

  // Fetch Assets
  const fetchAssets = async (filters = {}) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('category_id', filters.category_id || '');
      formData.append('location', filters.location || '');
      formData.append('employee_id', filters.employee_id || '');
      formData.append('description', filters.description || '');

      // Using common get/search endpoint naming convention for fixed assets
      // (This will act as the query target and can be adjusted as needed)
      const res = await axios.post(`${BASEURL}fix_asset_items.php`, formData, {
        headers: {'Content-Type': 'multipart/form-data'},
      });

      console.log('Search response:', res.data);

      let parsedData = {};
      if (typeof res.data === 'string') {
        const jsonMatch = res.data.match(/\{.*\}$/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        }
      } else {
        parsedData = res.data;
      }

      if ((parsedData?.status === 'true' || parsedData?.status === true) && Array.isArray(parsedData.data)) {
        setAssets(parsedData.data);
        setVisibleAssets(parsedData.data.slice(0, ITEMS_PER_PAGE));
      } else {
        setAssets([]);
        setVisibleAssets([]);
      }
    } catch (err) {
      console.log('❌ Fetch Assets Error:', err);
      // Fallback: if the API doesn't exist yet, we show an empty state or allow demo testing.
      setAssets([]);
      setVisibleAssets([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply Filter
  const handleApplyFilter = () => {
    const filters = {
      category_id: selectedCategory || '',
      location: selectedLocation || '',
      employee_id: selectedEmployee || '',
      description: searchDescription.trim(),
    };
    setPage(1);
    fetchAssets(filters);
  };

  // Load more (pagination)
  const loadMore = () => {
    if (loadingMore) return;
    const total = assets.length;
    const nextPage = page + 1;
    const start = (nextPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;

    if (start < total) {
      setLoadingMore(true);
      setTimeout(() => {
        setVisibleAssets(prev => [...prev, ...assets.slice(start, end)]);
        setPage(nextPage);
        setLoadingMore(false);
      }, 300);
    }
  };

  // Render each card
  const renderCard = ({item}) => {
    const catName = categories.find(c => c.value === item.category_id)?.label || item.category_id || '-';
    const locName = locations.find(l => l.value === item.location)?.label || item.location || '-';
    const empName = employees.find(e => e.value === item.employee_id)?.label || item.employee_id || '-';

    return (
      <View style={styles.card}>
        <View style={styles.kvRow}>
          <Text style={styles.kvKey}>Description:</Text>
          <Text style={styles.kvValue}>{item.description || '-'}</Text>
        </View>
        <View style={styles.kvRow}>
          <Text style={styles.kvKey}>Category:</Text>
          <Text style={styles.kvValue}>{catName}</Text>
        </View>
        <View style={styles.kvRow}>
          <Text style={styles.kvKey}>Location:</Text>
          <Text style={styles.kvValue}>{locName}</Text>
        </View>
        <View style={styles.kvRow}>
          <Text style={styles.kvKey}>Assigned To:</Text>
          <Text style={styles.kvValue}>{empName}</Text>
        </View>
        <View style={styles.kvRow}>
          <Text style={styles.kvKey}>Units:</Text>
          <Text style={styles.kvValue}>{item.units || '-'}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SimpleHeader title="Search Assets" />

      {/* Filters */}
      <View style={styles.filterContainer}>
        {/* Category Dropdown */}
        <Dropdown
          style={styles.dropdown}
          data={categories}
          labelField="label"
          valueField="value"
          placeholder="Select Category"
          placeholderStyle={{color: COLORS.TEXT_SECONDARY}}
          selectedTextStyle={{color: COLORS.TEXT_PRIMARY}}
          itemTextStyle={{color: COLORS.TEXT_PRIMARY}}
          value={selectedCategory}
          onChange={item => setSelectedCategory(item.value)}
          search
          searchPlaceholder="Search category..."
        />

        <View style={styles.rowFilters}>
          {/* Location Dropdown */}
          <Dropdown
            style={[styles.dropdown, {flex: 1}]}
            data={locations}
            labelField="label"
            valueField="value"
            placeholder="Location"
            placeholderStyle={{color: COLORS.TEXT_SECONDARY}}
            selectedTextStyle={{color: COLORS.TEXT_PRIMARY}}
            itemTextStyle={{color: COLORS.TEXT_PRIMARY}}
            value={selectedLocation}
            onChange={item => setSelectedLocation(item.value)}
            search
            searchPlaceholder="Search location..."
          />

          {/* Employee Dropdown */}
          <Dropdown
            style={[styles.dropdown, {flex: 1, marginLeft: 8}]}
            data={employees}
            labelField="label"
            valueField="value"
            placeholder="Employee"
            placeholderStyle={{color: COLORS.TEXT_SECONDARY}}
            selectedTextStyle={{color: COLORS.TEXT_PRIMARY}}
            itemTextStyle={{color: COLORS.TEXT_PRIMARY}}
            value={selectedEmployee}
            onChange={item => setSelectedEmployee(item.value)}
            search
            searchPlaceholder="Search employee..."
          />
        </View>

        {/* Description Search Row */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Description..."
            placeholderTextColor={COLORS.TEXT_SECONDARY}
            value={searchDescription}
            onChangeText={setSearchDescription}
          />
          <TouchableOpacity onPress={handleApplyFilter} style={styles.applyButton}>
            <Ionicons name="search" size={20} color={COLORS.WHITE} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setSelectedCategory(null);
              setSelectedLocation(null);
              setSelectedEmployee(null);
              setSearchDescription('');
              setPage(1);
              fetchAssets({});
            }}
            style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={COLORS.WHITE} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main List */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.Primary} style={{marginTop: 30}} />
      ) : (
        <FlatList
          data={visibleAssets}
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={renderCard}
          contentContainerStyle={{padding: 16, flexGrow: 1}}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="small" color={COLORS.Primary} />
            ) : null
          }
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyContainer}>
                <Ionicons name="alert-circle-outline" size={48} color={COLORS.TEXT_SECONDARY} />
                <Text style={styles.emptyText}>No assets found</Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  filterContainer: {
    padding: 16,
  },
  dropdown: {
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    marginBottom: 8,
  },
  rowFilters: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    color: COLORS.TEXT_PRIMARY,
  },
  applyButton: {
    height: 48,
    width: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.Primary,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  clearButton: {
    height: 48,
    width: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc3545',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  kvKey: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
  },
  kvValue: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
});
