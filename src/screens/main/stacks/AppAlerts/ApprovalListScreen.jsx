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
import {Dropdown} from 'react-native-element-dropdown';
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

const ApprovalListScreen = ({route, navigation}) => {
  const {listKey, title, isApproved = false} = route.params;

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
  const [selectedType, setSelectedType] = useState(null);
  const [softwareTypes, setSoftwareTypes] = useState([]);
  const [debtorsList, setDebtorsList] = useState([]);
  const [suppliersList, setSuppliersList] = useState([]);
  const [selectedDebtor, setSelectedDebtor] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const currentUser = useSelector(state => state.Data.currentData);

  // Check if this is a sales screen (quotation, order, delivery)
  const isSalesScreen =
    listKey === 'quotation_approval' ||
    listKey === 'so_approval' ||
    listKey === 'delivery_approval' ||
    listKey === 'invoice_approval';

  // Check if this is a purchase screen (po, grn)
  const isPurchaseScreen =
    listKey === 'po_approval' ||
    listKey === 'grn_approval' ||
    listKey === 'po_invoice_approval';

  // Determine API endpoint based on isApproved flag
  const apiEndpoint = isApproved
    ? `${BASEURL}dash_approved.php`
    : `${BASEURL}dash_approval.php`;

  const keyMap = {
    quotation_approval: 'data_unapprove_quote',
    so_approval: 'data_unapprove_order',
    po_approval: 'data_unapprove_po_order',
    grn_approval: 'data_unapprove_grn_order',
    voucher_approval: 'data_unapprove_voucher',
    delivery_approval: 'data_unapprove_deliveries',
    invoice_approval: 'data_unapprove_invoice',
    po_invoice_approval: 'data_unapprove_po_invoice',
    electrocal_job_cards: 'data_electrical_job_cards',
    mechnical_job_cards: 'data_Mechnical_job_cards',
    location_transfer_app: 'data_unapprove_loc_transfer',
    adjustment_app: 'data_unapprove_adjustment',
  };

  useEffect(() => {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);

    setFromDate(lastWeek);
    setToDate(today);

    // Initial API call with default dates
    fetchInitialData(lastWeek, today, '');

    // Fetch software types for voucher approval dropdown only
    if (listKey === 'voucher_approval') {
      fetchSoftwareTypes();
    }

    // Fetch debtors for sales screens
    if (isSalesScreen) {
      fetchDebtors();
    }

    // Fetch suppliers for purchase screens
    if (isPurchaseScreen) {
      fetchSuppliers();
    }
  }, []);

  // Fetch software types for dropdown
  const fetchSoftwareTypes = async () => {
    try {
      const res = await axios.get(`${BASEURL}software_type.php`);
      if (res.data?.status === 'true' && Array.isArray(res.data?.data)) {
        const formattedData = res.data.data.map(item => ({
          label: item.type_name,
          value: item.id,
        }));
        setSoftwareTypes(formattedData);
      }
    } catch (err) {
      console.log('Software Types API Error:', err);
    }
  };

  // Fetch debtors for sales screens dropdown
  const fetchDebtors = async () => {
    try {
      const res = await axios.get(`${BASEURL}debtors_master.php`);
      if (res.data?.status === 'true' && Array.isArray(res.data?.data)) {
        const formattedData = res.data.data.map(item => ({
          label: item.name,
          value: item.debtor_no,
        }));
        setDebtorsList(formattedData);
      }
    } catch (err) {
      console.log('Debtors API Error:', err);
    }
  };

  // Fetch suppliers for purchase screens dropdown
  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(`${BASEURL}suppliers.php`);
      if (res.data?.status === 'true' && Array.isArray(res.data?.data)) {
        const formattedData = res.data.data.map(item => ({
          label: item.name,
          value: item.supplier_id,
        }));
        setSuppliersList(formattedData);
      }
    } catch (err) {
      console.log('Suppliers API Error:', err);
    }
  };

  const formatDateForAPI = date => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
      formData.append('cost_center', searchLocation);

      const res = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      const responseData = await res.json();
      const mappedKey = keyMap[listKey];
      const newData = responseData?.[mappedKey] || [];

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

      // Add type for voucher approval only
      if (listKey === 'voucher_approval' && selectedType) {
        formData.append('type', selectedType);
      }

      // Add cost_center if searchLocation has value
      if (searchLocation.trim() !== '') {
        formData.append('cost_center', searchLocation);
      }

      // Add name based on screen type
      if (isSalesScreen && selectedDebtor) {
        formData.append('name', selectedDebtor);
      } else if (isPurchaseScreen && selectedSupplier) {
        formData.append('name', selectedSupplier);
      } else if (searchName.trim() !== '') {
        formData.append('name', searchName);
      }

      const res = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      const responseData = await res.json();
      const mappedKey = keyMap[listKey];
      const newData = responseData?.[mappedKey] || [];

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
    setSelectedType(null);
    setSelectedDebtor(null);
    setSelectedSupplier(null);
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);

    setFromDate(lastWeek);
    setToDate(today);

    // Reset to initial data fetch with default dates
    fetchInitialData(lastWeek, today, '');
  };

  const handleApprove = async item => {
    console.log('=== NEW V2 handleApprove CALLED ===');
    console.log('Item:', JSON.stringify(item));

    try {
      const formData = new FormData();

      // For Electrical & Mechanical, use fixed type 29
      const isJobCard =
        listKey === 'electrocal_job_cards' || listKey === 'mechnical_job_cards';

      const typeValue = isJobCard ? '29' : item.type;
      console.log('typeValue', typeValue);

      // Match Postman order exactly: trans_no, type, user_id, approval
      formData.append('trans_no', item.trans_no);
      formData.append('type', typeValue);
      formData.append('user_id', currentUser?.id);
      formData.append('approval', '0');

      console.log('Approve Request:', {
        trans_no: item.trans_no,
        type: typeValue,
        user_id: currentUser?.id,
        approval: '0',
        listKey: listKey,
      });

      const res = await fetch(`${BASEURL}dash_approval_post.php`, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      const responseData = await res.json();
      console.log('Approve Response:', responseData);

      if (responseData?.status === true || responseData?.status === 'true') {
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
          text2: responseData?.message || 'Something went wrong',
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

  // Handle Unapprove for approved records
  const handleUnapprove = async item => {
    try {
      const formData = new FormData();

      // For Electrical & Mechanical, use fixed type 29
      const isJobCard =
        listKey === 'electrocal_job_cards' || listKey === 'mechnical_job_cards';
      const typeValue = isJobCard ? '29' : item.type;

      // Match Postman order exactly: trans_no, type, user_id, approval
      formData.append('trans_no', item.trans_no);
      formData.append('type', typeValue);
      formData.append('user_id', currentUser?.id);
      formData.append('approval', '1'); // 1 for unapprove

      console.log('Unapprove Request:', {
        trans_no: item.trans_no,
        type: typeValue,
        user_id: currentUser?.id,
        approval: '1',
        listKey: listKey,
      });

      const res = await fetch(`${BASEURL}dash_approval_post.php`, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      const responseData = await res.json();
      console.log('Unapprove Response:', responseData);

      if (responseData?.status === true || responseData?.status === 'true') {
        Toast.show({
          type: 'success',
          text1: 'Unapproved Successfully',
        });

        setData(prev => prev.filter(d => d.trans_no !== item.trans_no));
        setFilteredData(prev => prev.filter(d => d.trans_no !== item.trans_no));
      } else {
        Toast.show({
          type: 'error',
          text1: 'Unapproval Failed',
          text2: res.data?.message || 'Something went wrong',
        });
      }
    } catch (err) {
      console.log('Unapprove Error:', err);
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
    <View style={{flex: 1, backgroundColor: '#F3F4F6'}}>
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
              {formatDateForDisplay(fromDate)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker({visible: true, type: 'to'})}>
            <Icon name="calendar" size={16} color="#000" />
            <Text style={styles.dateButtonText}>
              {formatDateForDisplay(toDate)}
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
              onChangeText={text => {
                console.log('Reference Input Changed:', text);
                setReference(text);
              }}
            />
          </View>
        </View>

        {/* Row 3: Name Search / Type Dropdown / Cost Center and Buttons */}
        <View style={styles.searchRow}>
          {listKey === 'voucher_approval' ? (
            <View style={{flex: 1, marginRight: 8}}>
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                itemTextStyle={{color: '#000'}}
                data={softwareTypes}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Select Type"
                value={selectedType}
                onChange={item => setSelectedType(item.value)}
              />
            </View>
          ) : listKey === 'electrocal_job_cards' ||
            listKey === 'mechnical_job_cards' ? (
            <View style={styles.searchContainer}>
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
                onChangeText={text => {
                  setSearchLocation(text);
                }}
              />
            </View>
          ) : isSalesScreen ? (
            <View style={{flex: 1, marginRight: 8}}>
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                itemTextStyle={{color: '#000'}}
                data={debtorsList}
                search
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Select Customer"
                searchPlaceholder="Search customer..."
                value={selectedDebtor}
                onChange={item => setSelectedDebtor(item.value)}
              />
            </View>
          ) : isPurchaseScreen ? (
            <View style={{flex: 1, marginRight: 8}}>
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                itemTextStyle={{color: '#000'}}
                data={suppliersList}
                search
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Select Supplier"
                searchPlaceholder="Search supplier..."
                value={selectedSupplier}
                onChange={item => setSelectedSupplier(item.value)}
              />
            </View>
          ) : (
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
                onChangeText={text => {
                  setSearchName(text);
                }}
              />
            </View>
          )}

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
              <Icon name="close-circle" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Row 4: Cost Center Search (Full Width) - Not for Quotation and Voucher Approval */}
        {listKey !== 'voucher_approval' &&
          listKey !== 'quotation_approval' &&
          listKey !== 'electrocal_job_cards' &&
          listKey !== 'mechnical_job_cards' && (
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
                  onChangeText={text => {
                    console.log('Cost Center (Row4) Input Changed:', text);
                    setSearchLocation(text);
                  }}
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

      <ScrollView
        contentContainerStyle={{padding: 15, paddingBottom: 80, flexGrow: 1}}>
        {filteredData && filteredData.length > 0 ? (
          filteredData.map((item, index) => (
            <ApprovalCard
              key={index}
              index={index}
              serialNo={index + 1}
              reference={item.reference || 'N/A'}
              ord_date={item.ord_date || 'N/A'}
              name={item.name || 'N/A'}
              total={item.total || '0'}
              trans_no={item.trans_no || 'N/A'}
              type={item.type || 'N/A'}
              location_name={item.location_name || item.loc_name || ''}
              navigation={navigation}
              screenType={listKey}
              onApprove={() => handleApprove(item)}
              onUnapprove={() => handleUnapprove(item)}
              isApproved={isApproved}
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
            <Icon name="database-off" size={80} color="#666" />
            <Text
              style={{
                textAlign: 'center',
                marginTop: 20,
                fontSize: 18,
                fontWeight: 'bold',
                color: '#333',
              }}>
              No Data Found
            </Text>
            <Text
              style={{
                textAlign: 'center',
                marginTop: 10,
                fontSize: 14,
                color: '#666',
                paddingHorizontal: 20,
              }}>
              {reference ||
              searchName ||
              searchLocation ||
              selectedType ||
              selectedDebtor ||
              selectedSupplier ||
              fromDate ||
              toDate
                ? 'No records found matching your filters'
                : 'There are no records pending for approval in this module.'}
            </Text>
            {(reference ||
              searchName ||
              searchLocation ||
              selectedType ||
              selectedDebtor ||
              selectedSupplier ||
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
    backgroundColor: '#FF0000', // Red background
    borderColor: '#FF0000',
  },
  dropdown: {
    height: 40,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  placeholderStyle: {
    fontSize: 14,
    color: '#888',
  },
  selectedTextStyle: {
    fontSize: 14,
    color: '#000',
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 14,
    color: '#000',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#000', // Red background
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
