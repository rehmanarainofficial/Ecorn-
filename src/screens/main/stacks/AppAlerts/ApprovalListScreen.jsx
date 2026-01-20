import React, {useEffect, useState} from 'react';
import {
  View,
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import axios from 'axios';
import SimpleHeader from '../../../../components/SimpleHeader';
import ApprovalCard from './ApprovalCard';
import {APPCOLORS} from '../../../../utils/APPCOLORS';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useSelector} from 'react-redux';
import Toast from 'react-native-toast-message';
import {BASEURL} from '../../../../utils/BaseUrl';
import {formatDate} from '../../../../utils/DateUtils';
import {formatNumber} from '../../../../utils/NumberUtils';

const ApprovalListScreen = ({route, navigation}) => {
  const {listKey, title} = route.params;
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Filter states
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [reference, setReference] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [showDatePicker, setShowDatePicker] = useState({
    visible: false,
    type: null,
  });

  const currentUser = useSelector(state => state.Data.currentData);

  const keyMap = {
    quotation_approval: 'data_unapprove_quote',
    so_approval: 'data_unapprove_order',
    po_approval: 'data_unapprove_po_order',
    grn_approval: 'data_unapprove_grn_order',
    voucher_approval: 'data_unapprove_voucher',
    delivery_approval: 'data_unapprove_deliveries',
    electrocal_job_cards: 'data_electrical_job_cards',
    mechnical_job_cards: 'data_Mechnical_job_cards',
    location_transfer_app: 'data_unapprove_loc_transfer',
  };

  useEffect(() => {
    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 2);

    setFromDate(threeMonthsAgo);
    setToDate(today);

    // Initial API call with default dates
    fetchInitialData(threeMonthsAgo, today, '');
  }, []);

  const formatPrice = price => {
    return formatNumber(price);
  };

  const formatDateForAPI = date => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  const formatDateForDisplay = date => {
    if (!date) return 'Select Date';
    return formatDate(date);
  };

  // ✅ Initial data fetch (on component mount)
  const fetchInitialData = async (from, to, ref) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('from_date', formatDateForAPI(from));
      formData.append('to_date', formatDateForAPI(to));
      formData.append('ref', ref);

      const res = await axios.post(`${BASEURL}dash_approval.php`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const mappedKey = keyMap[listKey];
      const newData = res.data?.[mappedKey] || [];

      setData(newData);
      setFilteredData(newData);
    } catch (err) {
      console.log('API Error:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load data',
      });
    }
    setLoading(false);
  };

  // ✅ Filter button click handler - Makes API call with selected dates
  const handleFilter = async () => {
    if (!fromDate || !toDate) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select both from and to dates',
      });
      return;
    }

    if (fromDate > toDate) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'From date cannot be after to date',
      });
      return;
    }

    setSearching(true);

    try {
      // Make API call with selected dates
      const formData = new FormData();
      formData.append('from_date', formatDateForAPI(fromDate));
      formData.append('to_date', formatDateForAPI(toDate));
      formData.append('ref', reference);

      const res = await axios.post(`${BASEURL}dash_approval.php`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const mappedKey = keyMap[listKey];
      const newData = res.data?.[mappedKey] || [];

      setData(newData);

      // Apply local filters (Reference & Name) if needed
      let filtered = [...newData];
      if (reference.trim() !== '') {
        filtered = filtered.filter(
          item =>
            item.reference &&
            item.reference.toLowerCase().includes(reference.toLowerCase()),
        );
      }

      if (searchName.trim() !== '') {
        filtered = filtered.filter(
          item =>
            item.name &&
            item.name.toLowerCase().includes(searchName.toLowerCase()),
        );
      }

      if (searchLocation.trim() !== '') {
        filtered = filtered.filter(
          item =>
            (item.location_name &&
              item.location_name
                .toLowerCase()
                .includes(searchLocation.toLowerCase())) ||
            (item.loc_name &&
              item.loc_name
                .toLowerCase()
                .includes(searchLocation.toLowerCase())),
        );
      }

      setFilteredData(filtered);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Found ${filtered.length} records`,
      });
    } catch (err) {
      console.log('Filter API Error:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch filtered data',
      });
    }

    setSearching(false);
  };

  // ✅ Clear filters handler
  const handleClearFilters = () => {
    setReference('');
    setSearchName('');
    setSearchLocation('');
    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);

    setFromDate(threeMonthsAgo);
    setToDate(today);

    // Reset to initial data fetch with default dates
    fetchInitialData(threeMonthsAgo, today, '');
  };

  const handleApprove = async item => {
    try {
      const formData = new FormData();
      formData.append('id', currentUser?.user_id);
      formData.append('trans_no', item.trans_no);
      formData.append('type', item.type);
      formData.append('approval', 0);

      const res = await axios.post(
        `${BASEURL}dash_approval_post.php`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      if (res.data?.status === true) {
        Toast.show({
          type: 'success',
          text1: 'Approved Successfully',
        });

        setData(prev => prev.filter(d => d.trans_no !== item.trans_no));
        setFilteredData(prev => prev.filter(d => d.trans_no !== item.trans_no));
      } else {
        Toast.show({
          type: 'error',
          text1: 'Approval Failed',
          text2: res.data?.message || 'Something went wrong',
        });
      }
    } catch (err) {
      console.log('Approve Error:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Network or Server error',
      });
    }
  };

  if (loading && data.length === 0) {
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <ActivityIndicator size="large" color={APPCOLORS.Primary} />
      </View>
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: APPCOLORS.Secondary}}>
      <SimpleHeader title={title || 'Approvals'} />

      {/* Filter Section - Black & White Theme */}
      <View style={styles.filterContainer}>
        {/* Row 1: From Date and To Date */}
        <View style={styles.dateRow}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker({visible: true, type: 'from'})}>
            <Icon name="calendar" size={16} color="#000" />
            <Text style={styles.dateButtonText}>
              From: {formatDateForDisplay(fromDate)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker({visible: true, type: 'to'})}>
            <Icon name="calendar" size={16} color="#000" />
            <Text style={styles.dateButtonText}>
              To: {formatDateForDisplay(toDate)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Row 2: Reference Search (Full Width) */}
        <View style={[styles.searchRow, {marginBottom: 8}]}>
          <View style={[styles.searchContainer, {marginRight: 0}]}>
            <Icon
              name="magnify"
              size={20}
              color="#666"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by reference..."
              placeholderTextColor="#888"
              value={reference}
              onChangeText={setReference}
            />
          </View>
        </View>

        {/* Row 3: Name Search and Buttons */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Icon
              name="account-search"
              size={20}
              color="#666"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name..."
              placeholderTextColor="#888"
              value={searchName}
              onChangeText={setSearchName}
            />
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.filterButton]}
              onPress={handleFilter}
              disabled={searching}>
              {searching ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Icon name="filter-check" size={18} color="#000" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.clearButton]}
              onPress={handleClearFilters}>
              <Icon name="close-circle" size={18} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Row 4: Cost Center Search (Full Width) */}
        {listKey !== 'quotation_approval' && (
          <View style={[styles.searchRow, {marginTop: 8}]}>
            <View style={[styles.searchContainer, {marginRight: 0}]}>
              <Icon
                name="map-marker-outline"
                size={20}
                color="#666"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by cost center..."
                placeholderTextColor="#888"
                value={searchLocation}
                onChangeText={setSearchLocation}
              />
            </View>
          </View>
        )}
      </View>

      {/* Date Picker */}
      {showDatePicker.visible && (
        <DateTimePicker
          value={
            showDatePicker.type === 'from'
              ? fromDate || new Date()
              : toDate || new Date()
          }
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker({visible: false, type: null});
            if (selectedDate) {
              if (showDatePicker.type === 'from') {
                setFromDate(selectedDate);
              } else {
                setToDate(selectedDate);
              }
            }
          }}
        />
      )}

      <ScrollView contentContainerStyle={{padding: 15, flexGrow: 1}}>
        {filteredData && filteredData.length > 0 ? (
          filteredData.map((item, index) => (
            <ApprovalCard
              key={index}
              reference={item.reference || 'N/A'}
              ord_date={item.ord_date || 'N/A'}
              name={item.name || 'N/A'}
              total={item.total || '0'}
              trans_no={item.trans_no || 'N/A'}
              type={item.type || 'N/A'}
              navigation={navigation}
              screenType={listKey}
              onApprove={() => handleApprove(item)}
            />
          ))
        ) : (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 50,
            }}>
            <Icon name="database-off" size={80} color={APPCOLORS.WHITE} />
            <Text
              style={{
                textAlign: 'center',
                marginTop: 20,
                fontSize: 18,
                fontWeight: 'bold',
                color: APPCOLORS.WHITE,
              }}>
              No Data Found
            </Text>
            <Text
              style={{
                textAlign: 'center',
                marginTop: 10,
                fontSize: 14,
                color: APPCOLORS.WHITE,
                paddingHorizontal: 20,
              }}>
              {reference || searchName || searchLocation || fromDate || toDate
                ? 'No records found matching your filters'
                : 'There are no records pending for approval in this module.'}
            </Text>
            {(reference ||
              searchName ||
              searchLocation ||
              fromDate ||
              toDate) && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleClearFilters}>
                <Text style={styles.retryButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  filterContainer: {
    backgroundColor: '#FFFFFF', // White background
    margin: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8', // Light gray background
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  dateButtonText: {
    color: '#000', // Black text
    fontSize: 13,
    marginLeft: 8,
    fontWeight: '500',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8', // Light gray background
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#000', // Black text
    fontSize: 14,
    paddingVertical: 8,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  filterButton: {
    backgroundColor: '#FFFFFF', // White background
  },
  clearButton: {
    backgroundColor: '#FFFFFF', // White background
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: APPCOLORS.Primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default ApprovalListScreen;
