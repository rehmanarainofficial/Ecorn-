import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  ActivityIndicator,
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

const Leave = ({navigation}) => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');

  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // DatePicker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateField, setDateField] = useState(null); // 'from' or 'to'

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const response = await axios.get(`${BASEURL}get_all_employees.php`);
      if (response.data && response.data.status === true) {
        const formatted = (response.data.data || []).map(emp => ({
          label: emp.emp_name,
          value: emp.employee_id,
        }));
        setEmployees(formatted);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Fetch Failed',
          text2: response.data?.message || 'Failed to fetch employee list',
        });
      }
    } catch (error) {
      console.log('Error fetching employees:', error);
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: 'Could not retrieve employee list.',
      });
    } finally {
      setLoadingEmployees(false);
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
    if (!dateStr) return new Date();
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date();
  };

  const handleSubmit = async () => {
    if (!selectedEmp) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select an employee.',
      });
      return;
    }
    if (!fromDate) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select From Date.',
      });
      return;
    }
    if (!toDate) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select To Date.',
      });
      return;
    }
    if (!reason.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a reason for the leave.',
      });
      return;
    }

    // Date comparison logic
    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (start > end) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'From Date cannot be after To Date.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('from_date', fromDate);
      formData.append('to_date', toDate);
      formData.append('emp_id', selectedEmp);
      formData.append('reason', reason.trim());

      const response = await axios.post(
        `${BASEURL}post_employee_leave.php`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      if (
        response.data &&
        (response.data.status === true || response.data.status === 'true')
      ) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: response.data.message || 'Leave requested successfully!',
        });

        // Reset form
        setSelectedEmp(null);
        setFromDate('');
        setToDate('');
        setReason('');

        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Submission Failed',
          text2: response.data?.message || 'Failed to submit leave request.',
        });
      }
    } catch (error) {
      console.log('Error submitting leave:', error);
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: 'Could not connect to the server. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <SimpleHeader title="Leave" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animatable.View
          animation="fadeInUp"
          duration={500}
          style={styles.card}>
          {/* Employee Selection */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>
              Employee <Text style={styles.required}>*</Text>
            </Text>
            {loadingEmployees ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={APPCOLORS.Primary} />
                <Text style={styles.loadingText}>Fetching Employees...</Text>
              </View>
            ) : (
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                itemTextStyle={styles.itemTextStyle}
                data={employees}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Select Employee"
                search
                searchPlaceholder="Search Employee..."
                value={selectedEmp}
                onChange={item => setSelectedEmp(item.value)}
                renderLeftIcon={() => (
                  <Icon
                    name="account"
                    size={20}
                    color={APPCOLORS.Secondary}
                    style={styles.leftIcon}
                  />
                )}
              />
            )}
          </View>

          {/* Dates Selection */}
          <View style={styles.row}>
            <View style={[styles.inputWrapper, {flex: 1, marginRight: 8}]}>
              <Text style={styles.label}>
                From Date <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                onPress={() => openDatePicker('from')}
                style={styles.dateSelector}>
                <Text
                  style={[styles.dateText, !fromDate && {color: '#9ca3af'}]}>
                  {fromDate ? formatDateString(fromDate) : 'DD-MM-YYYY'}
                </Text>
                <Icon name="calendar" size={20} color={APPCOLORS.Primary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputWrapper, {flex: 1, marginLeft: 8}]}>
              <Text style={styles.label}>
                To Date <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                onPress={() => openDatePicker('to')}
                style={styles.dateSelector}>
                <Text style={[styles.dateText, !toDate && {color: '#9ca3af'}]}>
                  {toDate ? formatDateString(toDate) : 'DD-MM-YYYY'}
                </Text>
                <Icon name="calendar" size={20} color={APPCOLORS.Primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Reason Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>
              Reason <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.textArea}
              placeholder="Provide a detailed description of why you need leave..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              value={reason}
              onChangeText={setReason}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            style={[styles.submitButton, submitting && styles.buttonDisabled]}>
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Leave Request</Text>
            )}
          </TouchableOpacity>
        </Animatable.View>
      </ScrollView>

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

export default Leave;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APPCOLORS.BG_SCREEN || '#F3F4F6',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  dropdown: {
    height: 50,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
  },
  placeholderStyle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  selectedTextStyle: {
    fontSize: 14,
    color: '#1f2937',
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 14,
    borderRadius: 6,
    color: '#1f2937',
  },
  itemTextStyle: {
    color: '#1f2937',
    fontSize: 14,
  },
  leftIcon: {
    marginRight: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  row: {
    flexDirection: 'row',
  },
  dateSelector: {
    height: 50,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 14,
    color: '#1f2937',
  },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#fafafa',
  },
  submitButton: {
    backgroundColor: APPCOLORS.Primary || '#1a1c22',
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: APPCOLORS.Primary || '#1a1c22',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
