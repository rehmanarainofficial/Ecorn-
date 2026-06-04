import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Animatable from 'react-native-animatable';
import {Dropdown} from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import {formatDateString, formatToYYYYMMDD} from '../../../../utils/DateUtils';
import {BASEURL} from '../../../../utils/BaseUrl';
import SimpleHeader from '../../../../components/SimpleHeader';
import {APPCOLORS} from '../../../../utils/APPCOLORS';

const LeaveInquiry = () => {
  // Dropdown options states
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  // Loading states for options
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Selected filter states
  const [selectedEmp, setSelectedEmp] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDesig, setSelectedDesig] = useState('');

  // Default dates are set to the current date (today)
  const todayStr = formatToYYYYMMDD(new Date());
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);

  // DatePicker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateField, setDateField] = useState(null); // 'from' or 'to'

  // Inquiry list data & loading states
  const [inquiryData, setInquiryData] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Collapsible Filters Panel State
  const [showFilters, setShowFilters] = useState(true);

  // Card approval loading state
  const [actionLoading, setActionLoading] = useState({});

  // Fetch dropdown lists & initial inquiry on mount
  useEffect(() => {
    fetchFilterOptions();
    fetchLeaveInquiry(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFilterOptions = async () => {
    setLoadingOptions(true);
    try {
      // 1. Fetch Employees
      const empRes = await axios.get(`${BASEURL}get_all_employees.php`);
      let empData = [];
      if (empRes.data && empRes.data.status === true) {
        empData = (empRes.data.data || []).map(emp => ({
          label: emp.emp_name,
          value: emp.employee_id,
        }));
      }

      // 2. Fetch Departments
      const deptRes = await axios.get(`${BASEURL}get_all_department.php`);
      let deptData = [];
      if (deptRes.data && deptRes.data.status === true) {
        deptData = (deptRes.data.data || []).map(dept => ({
          label: dept.description,
          value: dept.id,
        }));
      }

      // 3. Fetch Designations
      const desigRes = await axios.get(`${BASEURL}get_all_designation.php`);
      let desigData = [];
      if (desigRes.data && desigRes.data.status === true) {
        desigData = (desigRes.data.data || []).map(desig => ({
          label: desig.description,
          value: desig.id,
        }));
      }

      // Add "All" option to each filter list
      setEmployees([{label: 'All Employees', value: ''}, ...empData]);
      setDepartments([{label: 'All Departments', value: ''}, ...deptData]);
      setDesignations([{label: 'All Designations', value: ''}, ...desigData]);
    } catch (error) {
      console.log('Error fetching filters:', error);
      Toast.show({
        type: 'error',
        text1: 'Load Failed',
        text2: 'Failed to load filter dropdown parameters.',
      });
    } finally {
      setLoadingOptions(false);
    }
  };

  const fetchLeaveInquiry = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoadingList(true);
    }

    try {
      const formData = new FormData();
      formData.append('emp_id', selectedEmp || '');
      formData.append('dept_id', selectedDept || '');
      formData.append('designation', selectedDesig || '');
      formData.append('from_date', fromDate);
      formData.append('to_date', toDate);

      console.log('Fetching inquiry with fields:', {
        emp_id: selectedEmp,
        dept_id: selectedDept,
        designation: selectedDesig,
        from_date: fromDate,
        to_date: toDate,
      });

      const response = await axios.post(
        `${BASEURL}leave_inquiry_dash.php`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      if (response.data && response.data.status === true) {
        console.log('Inquiry Data:', response.data.data);

        setInquiryData(response.data.data || []);
      } else {
        setInquiryData([]);
        // Some APIs return status false when no records found
        if (response.data?.message) {
          console.log('Inquiry response:', response.data.message);
        }
      }
    } catch (error) {
      console.log('Error fetching leave inquiry:', error);
      Toast.show({
        type: 'error',
        text1: 'Query Error',
        text2: 'Failed to fetch leave inquiry data.',
      });
    } finally {
      setLoadingList(false);
      setRefreshing(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate && dateField) {
      const formattedDate = formatToYYYYMMDD(selectedDate);
      if (dateField === 'from') {
        setFromDate(formattedDate);
      } else if (dateField === 'to') {
        setToDate(formattedDate);
      }
      setDateField(null);
    }
  };

  const openDatePicker = field => {
    setDateField(field);
    setShowDatePicker(true);
  };

  const parseDateString = dateStr => {
    if (!dateStr) {
      return new Date();
    }
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date();
  };

  const clearFilters = () => {
    setSelectedEmp('');
    setSelectedDept('');
    setSelectedDesig('');
    setFromDate(todayStr);
    setToDate(todayStr);
    Toast.show({
      type: 'info',
      text1: 'Filters Reset',
      text2: 'Filters have been reset to default values.',
    });
  };

  const handleApproval = async (id, type, value) => {
    setActionLoading(prev => ({...prev, [id]: true}));
    try {
      const formData = new FormData();
      formData.append('emp_id', id);
      if (type === 'manager') {
        formData.append('approve', value);
      } else {
        formData.append('hr_approve', value);
      }

      const url =
        type === 'manager'
          ? `${BASEURL}post_leave_approval_manager.php`
          : `${BASEURL}post_leave_approval_hr.php`;

      const response = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (
        response.data &&
        (response.data.status === true || response.data.status === 'true')
      ) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: response.data.message || 'Status updated successfully.',
        });
        fetchLeaveInquiry(false);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed',
          text2: response.data?.message || 'Failed to update approval status.',
        });
      }
    } catch (error) {
      console.log('Approval error:', error);
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: 'Could not connect to the server.',
      });
    } finally {
      setActionLoading(prev => ({...prev, [id]: false}));
    }
  };

  // Helper to render approval status badges
  const renderStatusBadge = (statusVal, label) => {
    // approve: "1" means approved, "0" means pending, "2" or other means rejected
    const isApproved = statusVal === '1' || statusVal === 1;
    const isPending = statusVal === '0' || statusVal === 0 || !statusVal;

    let bg = '#FEF3C7'; // Pending yellow
    let text = '#D97706';
    let icon = 'clock-outline';
    let statusText = 'Pending';

    if (isApproved) {
      bg = '#D1FAE5'; // Approved green
      text = '#059669';
      icon = 'check-circle-outline';
      statusText = 'Approved';
    } else if (!isPending) {
      bg = '#FEE2E2'; // Rejected red
      text = '#DC2626';
      icon = 'close-circle-outline';
      statusText = 'Rejected';
    }

    return (
      <View style={[styles.statusBadge, {backgroundColor: bg}]}>
        <Icon name={icon} size={14} color={text} style={{marginRight: 4}} />
        <Text style={[styles.statusText, {color: text}]}>
          {label}: {statusText}
        </Text>
      </View>
    );
  };

  const renderLeaveCard = ({item}) => {
    const fromStr = formatDateString(item.from_date);
    const toStr = formatDateString(item.to_date);

    return (
      <Animatable.View animation="fadeInUp" duration={450} style={styles.card}>
        {/* Header Area */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Icon
              name="calendar-clock"
              size={22}
              color={APPCOLORS.Primary || '#1a1c22'}
            />
            <Text style={styles.leaveType}>
              {item.leave_type || 'Leave Request'}
            </Text>
          </View>
          <View style={styles.daysBadge}>
            <Text style={styles.daysText}>
              {item.no_of_leave || '1'} Day
              {parseInt(item.no_of_leave, 10) > 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Card Body */}
        <View style={styles.cardBody}>
          <View style={styles.rowItem}>
            <Icon
              name="account"
              size={16}
              color={APPCOLORS.Secondary}
              style={styles.cardIcon}
            />
            <Text style={styles.empName}>{item.emp_name}</Text>
          </View>

          {(item.desig || item.grade) && (
            <View style={[styles.rowItem, {marginLeft: 22, marginTop: 2}]}>
              <Text style={styles.subDetailText}>
                {item.desig || 'Staff'} {item.grade ? `(${item.grade})` : ''}
              </Text>
            </View>
          )}

          {item.department && (
            <View style={[styles.rowItem, {marginLeft: 22, marginTop: 2}]}>
              <Text style={styles.subDetailText}>Dept: {item.department}</Text>
            </View>
          )}

          <View style={[styles.rowItem, {marginTop: 10}]}>
            <Icon
              name="calendar-range"
              size={16}
              color={APPCOLORS.Secondary}
              style={styles.cardIcon}
            />
            <Text style={styles.datesText}>
              {fromStr} to {toStr}
            </Text>
          </View>

          {/* Reason section */}
          <View style={styles.reasonContainer}>
            <Text style={styles.reasonLabel}>Reason:</Text>
            <Text style={styles.reasonText}>
              {item.reason && item.reason.trim() !== ''
                ? item.reason
                : 'No description provided.'}
            </Text>
          </View>
        </View>

        {/* Badges Footer */}
        <View style={styles.cardFooter}>
          {renderStatusBadge(item.approve, 'Mgr')}
          {renderStatusBadge(item.hr_approve, 'HR')}
        </View>

        {/* Actions Area */}
        <View style={styles.cardActionsContainer}>
          {actionLoading[item.id] ? (
            <View style={styles.cardLoadingWrapper}>
              <ActivityIndicator size="small" color={APPCOLORS.Primary} />
              <Text style={styles.cardLoadingText}>Updating status...</Text>
            </View>
          ) : (
            <View style={styles.actionsRowSingle}>
              {/* Manager Approval Toggle */}
              <TouchableOpacity
                onPress={() =>
                  handleApproval(
                    item.id,
                    'manager',
                    item.approve === '1' ? '0' : '1',
                  )
                }
                style={[
                  styles.toggleBtn,
                  item.approve === '1'
                    ? styles.toggleActiveBtn
                    : styles.toggleInactiveBtn,
                ]}>
                <Icon
                  name={
                    item.approve === '1' ? 'check-decagram' : 'decagram-outline'
                  }
                  size={16}
                  color={item.approve === '1' ? '#fff' : '#4b5563'}
                />
                <Text
                  style={[
                    styles.toggleBtnText,
                    {color: item.approve === '1' ? '#fff' : '#4b5563'},
                  ]}>
                  {item.approve === '1' ? 'Mgr Unapprove' : 'Mgr Approve'}
                </Text>
              </TouchableOpacity>

              {/* HR Approval Toggle */}
              <TouchableOpacity
                onPress={() =>
                  handleApproval(
                    item.id,
                    'hr',
                    item.hr_approve === '1' ? '0' : '1',
                  )
                }
                style={[
                  styles.toggleBtn,
                  item.hr_approve === '1'
                    ? styles.toggleActiveBtn
                    : styles.toggleInactiveBtn,
                ]}>
                <Icon
                  name={
                    item.hr_approve === '1'
                      ? 'check-decagram'
                      : 'decagram-outline'
                  }
                  size={16}
                  color={item.hr_approve === '1' ? '#fff' : '#4b5563'}
                />
                <Text
                  style={[
                    styles.toggleBtnText,
                    {color: item.hr_approve === '1' ? '#fff' : '#4b5563'},
                  ]}>
                  {item.hr_approve === '1' ? 'HR Unapprove' : 'HR Approve'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animatable.View>
    );
  };

  return (
    <View style={styles.container}>
      <SimpleHeader title="Leave Inquiry" />

      {/* Collapsible Filter Bar */}
      <View style={styles.filterHeaderContainer}>
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={styles.filterToggleHeader}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Icon name="filter-variant" size={20} color={APPCOLORS.Primary} />
            <Text style={styles.filterHeaderTitle}>Search Filters</Text>
          </View>
          <Icon
            name={showFilters ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={APPCOLORS.Primary}
          />
        </TouchableOpacity>

        {showFilters && (
          <Animatable.View
            animation="slideInDown"
            duration={300}
            style={styles.filterContent}>
            {loadingOptions ? (
              <View style={styles.loadingWrapper}>
                <ActivityIndicator size="small" color={APPCOLORS.Primary} />
                <Text style={styles.loadingText}>Loading parameters...</Text>
              </View>
            ) : (
              <View>
                {/* Employee Filter */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Employee</Text>
                  <Dropdown
                    style={styles.dropdown}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    itemTextStyle={styles.itemTextStyle}
                    data={employees}
                    maxHeight={250}
                    labelField="label"
                    valueField="value"
                    placeholder="All Employees"
                    search
                    searchPlaceholder="Search Employee..."
                    value={selectedEmp}
                    onChange={item => setSelectedEmp(item.value)}
                  />
                </View>

                {/* Department Filter */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Department</Text>
                  <Dropdown
                    style={styles.dropdown}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    itemTextStyle={styles.itemTextStyle}
                    data={departments}
                    maxHeight={250}
                    labelField="label"
                    valueField="value"
                    placeholder="All Departments"
                    search
                    searchPlaceholder="Search Department..."
                    value={selectedDept}
                    onChange={item => setSelectedDept(item.value)}
                  />
                </View>

                {/* Designation Filter */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Designation</Text>
                  <Dropdown
                    style={styles.dropdown}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    itemTextStyle={styles.itemTextStyle}
                    data={designations}
                    maxHeight={250}
                    labelField="label"
                    valueField="value"
                    placeholder="All Designations"
                    search
                    searchPlaceholder="Search Designation..."
                    value={selectedDesig}
                    onChange={item => setSelectedDesig(item.value)}
                  />
                </View>

                {/* Date Ranges */}
                <View style={styles.dateRow}>
                  <View style={{flex: 1, marginRight: 6}}>
                    <Text style={styles.filterLabel}>From Date</Text>
                    <TouchableOpacity
                      onPress={() => openDatePicker('from')}
                      style={styles.dateSelector}>
                      <Text style={styles.dateSelectText}>
                        {fromDate ? formatDateString(fromDate) : 'Select'}
                      </Text>
                      <Icon
                        name="calendar"
                        size={16}
                        color={APPCOLORS.Primary}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={{flex: 1, marginLeft: 6}}>
                    <Text style={styles.filterLabel}>To Date</Text>
                    <TouchableOpacity
                      onPress={() => openDatePicker('to')}
                      style={styles.dateSelector}>
                      <Text style={styles.dateSelectText}>
                        {toDate ? formatDateString(toDate) : 'Select'}
                      </Text>
                      <Icon
                        name="calendar"
                        size={16}
                        color={APPCOLORS.Primary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Filter Buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={clearFilters}
                    style={styles.resetButton}>
                    <Icon
                      name="refresh"
                      size={16}
                      color={APPCOLORS.Secondary}
                    />
                    <Text style={styles.resetButtonText}>Reset</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      fetchLeaveInquiry(false);
                      setShowFilters(false); // Auto collapse on search
                    }}
                    style={styles.searchButton}>
                    <Icon name="magnify" size={18} color="#fff" />
                    <Text style={styles.searchButtonText}>Search</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Animatable.View>
        )}
      </View>

      {/* Inquiry List */}
      {loadingList && !refreshing ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={APPCOLORS.Primary} />
          <Text style={styles.loadingListText}>
            Retrieving leave inquiry records...
          </Text>
        </View>
      ) : (
        <FlatList
          data={inquiryData}
          renderItem={renderLeaveCard}
          keyExtractor={(item, index) =>
            item.id ? item.id.toString() : index.toString()
          }
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchLeaveInquiry(true)}
              colors={[APPCOLORS.Primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="calendar-remove-outline" size={60} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Leave Records Found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search filters or pull to refresh.
              </Text>
            </View>
          }
        />
      )}

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={parseDateString(dateField === 'from' ? fromDate : toDate)}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );
};

export default LeaveInquiry;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APPCOLORS.BG_SCREEN || '#F3F4F6',
  },
  filterHeaderContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  filterToggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
  },
  filterHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 8,
  },
  filterContent: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#f3f4f6',
  },
  filterGroup: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 4,
  },
  dropdown: {
    height: 40,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    paddingHorizontal: 10,
    backgroundColor: '#fafafa',
  },
  placeholderStyle: {
    fontSize: 13,
    color: '#9ca3af',
  },
  selectedTextStyle: {
    fontSize: 13,
    color: '#1f2937',
  },
  inputSearchStyle: {
    height: 38,
    fontSize: 13,
    color: '#1f2937',
  },
  itemTextStyle: {
    color: '#1f2937',
    fontSize: 13,
  },
  dateRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dateSelector: {
    height: 40,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    paddingHorizontal: 10,
    backgroundColor: '#fafafa',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateSelectText: {
    fontSize: 13,
    color: '#1f2937',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
    marginLeft: 6,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    height: 40,
    borderRadius: 6,
    backgroundColor: APPCOLORS.Primary || '#1a1c22',
  },
  searchButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 6,
  },
  loadingWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6b7280',
  },
  listContainer: {
    padding: 12,
    paddingBottom: 40,
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingListText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 10,
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leaveType: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
  },
  daysBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  daysText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  cardBody: {
    marginBottom: 12,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    marginRight: 6,
  },
  empName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  subDetailText: {
    fontSize: 12,
    color: '#6b7280',
  },
  datesText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  reasonContainer: {
    marginTop: 10,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#cbd5e1',
  },
  reasonLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 2,
  },
  reasonText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  cardActionsContainer: {
    borderTopWidth: 1,
    borderColor: '#f3f4f6',
    paddingTop: 12,
    marginTop: 12,
  },
  cardLoadingWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  cardLoadingText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },
  actionsRowSingle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleActiveBtn: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  toggleInactiveBtn: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
});
