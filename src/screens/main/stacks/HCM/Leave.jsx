import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Animatable from 'react-native-animatable';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import {formatDateString, formatToYYYYMMDD} from '../../../../utils/DateUtils';
import {BASEURL} from '../../../../utils/BaseUrl';
import SimpleHeader from '../../../../components/SimpleHeader';
import {APPCOLORS} from '../../../../utils/APPCOLORS';
import {useSelector} from 'react-redux';

const Leave = ({navigation}) => {
  const userData = useSelector(state => state.Data.currentData);
  const employeeId = userData?.employee_id;

  const [selectedEmp, setSelectedEmp] = useState(employeeId || null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const [leaveHistory, setLeaveHistory] = useState(null);
  const [loadingLeaveHistory, setLoadingLeaveHistory] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateField, setDateField] = useState(null);

  useEffect(() => {
    if (employeeId) {
      setSelectedEmp(employeeId);
    }
  }, [employeeId]);

  useEffect(() => {
    if (selectedEmp) {
      fetchLeaveHistory(selectedEmp);
    } else {
      setLeaveHistory(null);
    }
  }, [selectedEmp]);

  const fetchLeaveHistory = async empId => {
    if (!empId) {
      setLeaveHistory(null);
      return;
    }
    setLoadingLeaveHistory(true);
    try {
      const formData = new FormData();
      formData.append('emp_id', empId);

      const response = await axios.post(
        `${BASEURL}get_employee_leave_history.php`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      if (
        response.data === null ||
        !response.data ||
        response.data === 'null'
      ) {
        setLeaveHistory(null);
      } else {
        setLeaveHistory(response.data);
      }
    } catch (error) {
      console.log('Error fetching leave history:', error);
      setLeaveHistory(null);
    } finally {
      setLoadingLeaveHistory(false);
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

    if (selectedEmp && leaveHistory === null) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'No leave record found. Cannot submit request.',
      });
      return;
    }

    if (leaveHistory && Number(leaveHistory.balance) <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Leave limit is completed. Cannot submit request.',
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
      formData.append('leave_type', leaveHistory?.id || '');

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

  const isHistoryNull =
    selectedEmp && !loadingLeaveHistory && leaveHistory === null;
  const isLimitCompleted = leaveHistory && Number(leaveHistory.balance) <= 0;

  return (
    <View style={styles.container}>
      <SimpleHeader title="Leave" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animatable.View
          animation="fadeInUp"
          duration={500}
          style={styles.card}>
          {/* Employee Info (Read-only since dropdown is removed) */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Employee</Text>
            <View
              style={[
                styles.loadingContainer,
                {backgroundColor: '#e5e7eb', borderColor: '#d1d5db'},
              ]}>
              <Icon
                name="account"
                size={20}
                color={APPCOLORS.Secondary}
                style={styles.leftIcon}
              />
              <Text style={[styles.selectedTextStyle, {color: '#6b7280'}]}>
                {userData?.real_name || 'Loading...'}
              </Text>
            </View>
          </View>

          {/* Leave Balance History */}
          {selectedEmp && (
            <View style={{marginBottom: 20}}>
              {loadingLeaveHistory ? (
                <View style={styles.loadingHistory}>
                  <ActivityIndicator size="small" color={APPCOLORS.Primary} />
                  <Text style={styles.loadingHistoryText}>
                    Loading leave balance...
                  </Text>
                </View>
              ) : leaveHistory ? (
                <Animatable.View
                  animation="fadeIn"
                  duration={300}
                  style={styles.historyCard}>
                  <View style={styles.historyItem}>
                    <Text style={styles.historyLabel}>Total Leaves</Text>
                    <Text style={styles.historyValue}>
                      {leaveHistory.leave_days || '0'}
                    </Text>
                  </View>
                  <View style={[styles.historyItem, styles.historyDivider]}>
                    <Text style={styles.historyLabel}>Availed</Text>
                    <Text style={styles.historyValue}>
                      {leaveHistory.availed || '0'}
                    </Text>
                  </View>
                  <View style={styles.historyItem}>
                    <Text style={styles.historyLabel}>Balance</Text>
                    <Text
                      style={[
                        styles.historyValue,
                        {
                          color:
                            Number(leaveHistory.balance) <= 0
                              ? '#ef4444'
                              : '#10b981',
                        },
                      ]}>
                      {leaveHistory.balance !== undefined
                        ? leaveHistory.balance
                        : '0'}
                    </Text>
                  </View>
                </Animatable.View>
              ) : null}
            </View>
          )}

          {selectedEmp && leaveHistory && Number(leaveHistory.balance) <= 0 && (
            <View style={styles.warningContainer}>
              <Icon
                name="alert-circle"
                size={18}
                color="#ef4444"
                style={{marginRight: 6}}
              />
              <Text style={styles.warningText}>
                Leave limit is completed. You cannot submit a leave request.
              </Text>
            </View>
          )}

          {isHistoryNull && (
            <View style={styles.warningContainer}>
              <Icon
                name="alert-circle"
                size={18}
                color="#ef4444"
                style={{marginRight: 6}}
              />
              <Text style={styles.warningText}>
                No leave record found. Form inputs are disabled.
              </Text>
            </View>
          )}

          {/* Dates Selection */}
          <View style={styles.row}>
            <View style={[styles.inputWrapper, {flex: 1, marginRight: 8}]}>
              <Text style={styles.label}>
                From Date <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                onPress={() => openDatePicker('from')}
                disabled={isHistoryNull}
                style={[
                  styles.dateSelector,
                  isHistoryNull && {
                    backgroundColor: '#e5e7eb',
                    borderColor: '#d1d5db',
                  },
                ]}>
                <Text
                  style={[
                    styles.dateText,
                    !fromDate && {color: '#9ca3af'},
                    isHistoryNull && {color: '#9ca3af'},
                  ]}>
                  {fromDate ? formatDateString(fromDate) : 'DD-MM-YYYY'}
                </Text>
                <Icon
                  name="calendar"
                  size={20}
                  color={isHistoryNull ? '#9ca3af' : APPCOLORS.Primary}
                />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputWrapper, {flex: 1, marginLeft: 8}]}>
              <Text style={styles.label}>
                To Date <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                onPress={() => openDatePicker('to')}
                disabled={isHistoryNull}
                style={[
                  styles.dateSelector,
                  isHistoryNull && {
                    backgroundColor: '#e5e7eb',
                    borderColor: '#d1d5db',
                  },
                ]}>
                <Text
                  style={[
                    styles.dateText,
                    !toDate && {color: '#9ca3af'},
                    isHistoryNull && {color: '#9ca3af'},
                  ]}>
                  {toDate ? formatDateString(toDate) : 'DD-MM-YYYY'}
                </Text>
                <Icon
                  name="calendar"
                  size={20}
                  color={isHistoryNull ? '#9ca3af' : APPCOLORS.Primary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Reason Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>
              Reason <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.textArea,
                isHistoryNull && {
                  backgroundColor: '#e5e7eb',
                  borderColor: '#d1d5db',
                  color: '#9ca3af',
                },
              ]}
              placeholder="Provide a detailed description of why you need leave..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              value={reason}
              onChangeText={setReason}
              textAlignVertical="top"
              editable={!isHistoryNull}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting || isLimitCompleted || isHistoryNull}
            style={[
              styles.submitButton,
              (submitting || isLimitCompleted || isHistoryNull) &&
                styles.buttonDisabled,
              (isLimitCompleted || isHistoryNull) && {
                backgroundColor: '#cbd5e1',
                shadowOpacity: 0,
              },
            ]}>
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
  loadingHistory: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  loadingHistoryText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#6b7280',
  },
  historyCard: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  historyItem: {
    flex: 1,
    alignItems: 'center',
  },
  historyDivider: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#e5e7eb',
  },
  historyLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  historyValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  warningText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});
