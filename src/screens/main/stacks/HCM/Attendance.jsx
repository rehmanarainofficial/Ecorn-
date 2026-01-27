import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  PermissionsAndroid,
  TextInput,
  RefreshControl,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {useSelector} from 'react-redux';
import axios from 'axios';
import AppText from '../../../../components/AppText';
import AppButton from '../../../../components/AppButton';
import {APPCOLORS} from '../../../../utils/APPCOLORS';
import {
  responsiveHeight,
  responsiveFontSize,
} from '../../../../utils/Responsive';
import {BASEURL} from '../../../../utils/BaseUrl';
import Modal from 'react-native-modal';
import Geolocation from 'react-native-geolocation-service';
import * as geolib from 'geolib';
import SimpleHeader from '../../../../components/SimpleHeader';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const {width} = Dimensions.get('window');

const Attendance = () => {
  const userData = useSelector(state => state.Data.currentData);
  // Modals Visibility
  const [isDVRModalVisible, setDVRModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentLocationCoords, setCurrentLocationCoords] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Unified Feedback State
  const [feedback, setFeedback] = useState({
    visible: false,
    type: 'success', 
    title: '',
    message: '',
  });

  const [dvrData, setDvrData] = useState({
    site_name: '',
    site_address: '',
    contact_person: '',
    mobile_no: '',
    nature_of_visit: '',
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const totalDays = getDaysInMonth(currentYear, currentMonth);
  const daysArray = Array.from({length: totalDays}, (_, i) => i + 1);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setRefreshing(true);
    const currentDateStr = new Date().toISOString().split('T')[0];
    const formData = new FormData();
    formData.append('emp_code', userData?.emp_code || '10001');
    formData.append('date', currentDateStr);
    try {
      const response = await axios.post(
        `${BASEURL}get_attendence_detail.php`,
        formData,
        {
          headers: {'Content-Type': 'multipart/form-data'},
        },
      );
      if (response.data.status === 'true' || response.data.status === true) {
        setAttendanceHistory(response.data.data || []);
      }
    } catch (error) {
      console.log('Fetch History Error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const showFeedback = (type, title, message) => {
    setFeedback({
      visible: true,
      type,
      title,
      message,
    });
  };

  const formatTime12h = timeStr => {
    if (!timeStr) return 'N/A';
    try {
      const [hours, minutes, seconds] = timeStr.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${minutes} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization('whenInUse');
      return auth === 'granted';
    }

    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return false;
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          resolve(position.coords);
        },
        error => {
          reject(error);
        },
        {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
      );
    });
  };

  const getAddressFromCoords = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
        {
          headers: {
            'User-Agent': 'Ecorn-App',
          },
        },
      );
      const data = await response.json();
      return data.display_name || 'Unknown Location';
    } catch (error) {
      return 'Unknown Location';
    }
  };

  const handleDayPress = async day => {
    if (day !== currentDate) return;

    setLoading(true);
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        showFeedback(
          'error',
          'Permission Denied',
          'Please enable location permissions to mark attendance.',
        );
        setLoading(false);
        return;
      }

      const coords = await getCurrentLocation();
      setCurrentLocationCoords(coords);

      const targetLat = parseFloat(userData?.latitude);
      const targetLong = parseFloat(userData?.longitude);

      if (!isNaN(targetLat) && !isNaN(targetLong)) {
        const distance = geolib.getDistance(
          {latitude: coords.latitude, longitude: coords.longitude},
          {latitude: targetLat, longitude: targetLong},
        );

        if (distance <= 100) {
          // In range - Post Attendance
          postAttendance(coords, false);
        } else {
          // Out of range - Show DVR
          setDVRModalVisible(true);
        }
      } else {
        // Fallback if no office location set
        setDVRModalVisible(true);
      }
    } catch (error) {
      showFeedback(
        'error',
        'Location Error',
        'Could not get current location. Please ensure GPS is ON.',
      );
    } finally {
      setLoading(false);
    }
  };

  const postAttendance = async (
    coords,
    isDVR = false,
    isOut = false,
    checkOutId = null,
  ) => {
    const formData = new FormData();
    const currentDateStr = new Date().toISOString().split('T')[0];
    const currentTimeStr = new Date().toLocaleTimeString('en-GB', {
      hour12: false,
    });

    // Note: Both In and Out now hit user_attendance_post.php
    if (isOut) {
      // Out Payload as requested
      formData.append('code', userData?.emp_code || '10001');
      formData.append('ActivityDate', currentDateStr);
      formData.append('ActivityTime', currentTimeStr);
      formData.append('status', '1');
      formData.append('in_out', '1');
      formData.append('id', String(checkOutId || '0'));
    } else {
      // In/DVR Payload as requested
      const lat = coords?.latitude || 0;
      const lon = coords?.longitude || 0;
      const addressName = await getAddressFromCoords(lat, lon);

      formData.append('code', userData?.emp_code);
      formData.append('ActivityDate', currentDateStr);
      formData.append('ActivityTime', currentTimeStr);
      formData.append('site_name', dvrData.site_name || '');
      formData.append('site_address', dvrData.site_address || '');
      formData.append('contact_person', dvrData.contact_person || '');
      formData.append('mobile_no', dvrData.mobile_no || '');
      formData.append('current_location', addressName);
      formData.append('nature_of_visit', dvrData.nature_of_visit || '');
      formData.append('latitude', lat.toString());
      formData.append('longitude', lon.toString());
      formData.append('in_out', '0');
      formData.append('status', '0');
      formData.append('id', '0');
    }

    setLoading(true);
    try {
      const fullUrl = `${BASEURL}user_attendance_post.php`;
      console.log(`Submitting to ${fullUrl} using fetch...`);

      const res = await fetch(fullUrl, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      const responseText = await res.text();
      console.log('Raw Response:', responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.log('JSON Parse Error:', e);
        throw new Error('Invalid server response format.');
      }

      if (responseData.status === 'true' || responseData.status === true) {
        showFeedback(
          'success',
          'Success!',
          isOut
            ? 'Checked out successfully!'
            : isDVR
            ? 'DVR and Attendance marked successfully!'
            : 'Attendance marked successfully!',
        );
        if (isDVR) setDVRModalVisible(false);
        fetchHistory();
      } else {
        showFeedback(
          'error',
          'API Error',
          responseData.message || 'Failed to process request.',
        );
      }
    } catch (error) {
      console.log('Attendance Request Error details:', error);
      showFeedback(
        'error',
        'Network Error',
        error.message || 'An error occurred while connecting to the server.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async id => {
    setLoading(true);
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        showFeedback(
          'error',
          'Permission Denied',
          'Location access is required for checkout.',
        );
        setLoading(false);
        return;
      }
      const coords = await getCurrentLocation();
      await postAttendance(coords, false, true, id);
    } catch (error) {
      showFeedback(
        'error',
        'Checkout Error',
        'Failed to get location for checkout.',
      );
    } finally {
      setLoading(false);
    }
  };

  const submitDVR = () => {
    if (
      !dvrData.site_name ||
      !dvrData.site_address ||
      !dvrData.contact_person ||
      !dvrData.mobile_no
    ) {
      showFeedback(
        'error',
        'Fields Required',
        'Please fill all fields to proceed.',
      );
      return;
    }
    postAttendance(currentLocationCoords, true);
  };

  const renderInput = (label, key, placeholder, isMulti = false) => (
    <View style={styles.inputGroup}>
      <AppText
        title={label}
        titleSize={1.4}
        titleWeight
        titleColor={APPCOLORS.BLACK}
      />
      <TextInput
        style={[
          styles.input,
          isMulti && {height: 80, textAlignVertical: 'top'},
        ]}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={dvrData[key]}
        onChangeText={text => setDvrData({...dvrData, [key]: text})}
        multiline={isMulti}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <SimpleHeader title="Attendance" />

      <ScrollView
        contentContainerStyle={{paddingBottom: 40}}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchHistory}
            colors={[APPCOLORS.Primary]}
          />
        }>
        {/* Employee Info Card */}
        <View style={styles.infoCard}>
          <AppText
            title={userData?.real_name || 'User'}
            titleSize={2.4}
            titleWeight={true}
            titleColor={APPCOLORS.Primary}
          />
          <AppText
            title={`Employee Code: ${userData?.emp_code || 'N/A'}`}
            titleSize={1.6}
            titleColor={APPCOLORS.GRAY}
          />
          <View style={styles.monthBadge}>
            <AppText
              title={`${now.toLocaleString('default', {
                month: 'long',
              })} ${currentYear}`}
              titleSize={1.8}
              titleColor={APPCOLORS.WHITE}
              titleWeight
            />
          </View>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarContainer}>
          <View style={styles.calendarHeader}>
            <AppText
              title="Daily Attendance"
              titleWeight
              titleSize={2}
              titleColor={APPCOLORS.Primary}
            />
            <View style={styles.todayIndicator}>
              <View style={styles.todayDot} />
              <AppText
                title="Today"
                titleSize={1.4}
                titleColor={APPCOLORS.GRAY}
              />
            </View>
          </View>

          <View style={styles.grid}>
            {daysArray.map(day => {
              const isToday = day === currentDate;
              const isPast = day < currentDate;
              const isDisabled = !isToday;

              return (
                <TouchableOpacity
                  key={day}
                  disabled={isDisabled}
                  onPress={() => handleDayPress(day)}
                  style={[
                    styles.dayButton,
                    isToday && styles.todayButton,
                    isPast && styles.pastButton,
                    !isToday && !isPast && styles.futureButton,
                  ]}>
                  <AppText
                    title={day.toString()}
                    titleColor={
                      isToday
                        ? APPCOLORS.WHITE
                        : isPast
                        ? APPCOLORS.Secondary
                        : '#CCC'
                    }
                    titleSize={1.8}
                    titleWeight={isToday}
                  />
                  {isToday && <View style={styles.activeIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Attendance History */}
        <View style={styles.historySection}>
          <AppText
            title="Today's Logs"
            titleSize={2}
            titleWeight
            titleColor={APPCOLORS.BLACK}
            style={{marginBottom: 15}}
          />
          {attendanceHistory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <AppText
                title="No records found for today."
                titleSize={1.4}
                titleColor={APPCOLORS.GRAY}
              />
            </View>
          ) : (
            attendanceHistory.map((item, index) => {
              const isOutValue = item.status === '1' || item.status === 1;
              return (
                <View key={index} style={styles.historyCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.timeBadge}>
                      <FontAwesome
                        name="clock-o"
                        size={14}
                        color={APPCOLORS.Primary}
                      />
                      <AppText
                        title={formatTime12h(item.ActivityTime)}
                        titleSize={1.4}
                        titleWeight
                        titleColor={APPCOLORS.Primary}
                        style={{marginLeft: 5}}
                      />
                    </View>
                    {!isOutValue && (
                      <TouchableOpacity
                        style={styles.outButton}
                        onPress={() => handleCheckOut(item.id)}>
                        <AppText
                          title="Checkout"
                          titleColor={APPCOLORS.WHITE}
                          titleSize={1.2}
                          titleWeight
                        />
                      </TouchableOpacity>
                    )}
                    {isOutValue && (
                      <View style={styles.completedBadge}>
                        <AppText
                          title="Completed"
                          titleColor="#28A745"
                          titleSize={1.2}
                          titleWeight
                        />
                      </View>
                    )}
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.detailItem}>
                      <FontAwesome
                        name="map-marker"
                        size={16}
                        color={APPCOLORS.Secondary}
                        style={{width: 20}}
                      />
                      <View style={{flex: 1}}>
                        <AppText
                          title={item.site_name || 'Office Entry'}
                          titleSize={1.4}
                          titleWeight
                          titleColor={APPCOLORS.BLACK}
                        />
                        <AppText
                          title={item.current_location || 'N/A'}
                          titleSize={1.2}
                          titleColor={APPCOLORS.GRAY}
                        />
                      </View>
                    </View>
                    {item.nature_of_visit && (
                      <View style={[styles.detailItem, {marginTop: 8}]}>
                        <FontAwesome
                          name="info-circle"
                          size={16}
                          color={APPCOLORS.GRAY}
                          style={{width: 20}}
                        />
                        <AppText
                          title={item.nature_of_visit}
                          titleSize={1.3}
                          titleColor={APPCOLORS.BLACK}
                          style={{flex: 1}}
                        />
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* DVR Form Modal */}
      <Modal
        isVisible={isDVRModalVisible}
        onBackdropPress={() => !loading && setDVRModalVisible(false)}
        style={styles.modal}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <AppText
              title="Daily Visit Report (DVR)"
              titleSize={2.2}
              titleWeight
              titleColor={APPCOLORS.Primary}
            />
            <TouchableOpacity
              onPress={() => !loading && setDVRModalVisible(false)}>
              <AppText
                title="Close"
                titleColor={APPCOLORS.Secondary}
                titleWeight
              />
            </TouchableOpacity>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{paddingBottom: 40}}>
            <AppText
              title="You are out of range. Please submit DVR to mark attendance."
              titleSize={1.4}
              titleColor={APPCOLORS.GRAY}
              style={{marginBottom: 15}}
            />
            {renderInput('Company Name', 'site_name', 'Enter company name')}
            {renderInput('Site Address', 'site_address', 'Enter site address')}
            {renderInput('Contact Person', 'contact_person', 'Enter name')}
            {renderInput('Mobile No', 'mobile_no', 'Enter mobile number')}
            {renderInput(
              'Nature of Visit',
              'nature_of_visit',
              'Describe visit',
              true,
            )}
            <AppButton
              title={loading ? 'Submitting...' : 'Submit & Mark Attendance'}
              onPress={submitDVR}
              style={{marginTop: 20}}
              disabled={loading}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Unified Feedback Modal (Success/Error) */}
      <Modal
        isVisible={feedback.visible}
        onBackdropPress={() => setFeedback({...feedback, visible: false})}
        animationIn="zoomIn"
        animationOut="zoomOut">
        <View style={styles.successModalContent}>
          <View style={styles.successIconContainer}>
            <FontAwesome
              name={
                feedback.type === 'success' ? 'check-circle' : 'times-circle'
              }
              size={responsiveHeight(8)}
              color={feedback.type === 'success' ? '#28A745' : '#DC3545'}
            />
          </View>
          <AppText
            title={feedback.title}
            titleSize={2.6}
            titleWeight
            titleColor={APPCOLORS.BLACK}
            style={{marginTop: 15}}
          />
          <AppText
            title={feedback.message}
            titleSize={1.8}
            titleColor={APPCOLORS.GRAY}
            titleAlignment="center"
            style={{marginTop: 10, paddingHorizontal: 20}}
          />
          <TouchableOpacity
            style={[
              styles.successButton,
              {
                backgroundColor:
                  feedback.type === 'success' ? APPCOLORS.Primary : '#DC3545',
              },
            ]}
            onPress={() => setFeedback({...feedback, visible: false})}>
            <AppText
              title="Close"
              titleColor={APPCOLORS.WHITE}
              titleWeight
              titleSize={2}
            />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <AppText
            title="Processing..."
            titleColor={APPCOLORS.WHITE}
            titleWeight
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F8F9FA'},
  infoCard: {
    backgroundColor: APPCOLORS.WHITE,
    margin: 20,
    padding: 20,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 10,
    alignItems: 'center',
  },
  monthBadge: {
    backgroundColor: APPCOLORS.Primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 15,
  },
  calendarContainer: {
    backgroundColor: APPCOLORS.WHITE,
    marginHorizontal: 15,
    borderRadius: 20,
    padding: 15,
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 10,
  },
  todayIndicator: {flexDirection: 'row', alignItems: 'center'},
  todayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: APPCOLORS.Primary,
    marginRight: 6,
  },
  grid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start'},
  dayButton: {
    width: (width - 70) / 7,
    height: (width - 70) / 7,
    margin: 4,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  todayButton: {
    backgroundColor: APPCOLORS.Primary,
    borderColor: APPCOLORS.Primary,
    elevation: 4,
    transform: [{scale: 1.1}],
  },
  pastButton: {backgroundColor: '#F0F4F8', borderColor: '#E1E8ED'},
  futureButton: {backgroundColor: '#FAFAFA', opacity: 0.5},
  activeIndicator: {
    position: 'absolute',
    bottom: 5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: APPCOLORS.WHITE,
  },
  historySection: {paddingHorizontal: 20, marginTop: 25},
  historyCard: {
    backgroundColor: APPCOLORS.WHITE,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 10,
    marginBottom: 10,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  outButton: {
    backgroundColor: APPCOLORS.Secondary,
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 8,
  },
  completedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E9F7EF',
    borderRadius: 8,
  },
  cardBody: {paddingHorizontal: 5},
  detailItem: {flexDirection: 'row', alignItems: 'flex-start'},
  emptyContainer: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#FFF',
    borderRadius: 15,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  modal: {margin: 0, justifyContent: 'flex-end'},
  modalContent: {
    backgroundColor: APPCOLORS.WHITE,
    padding: 25,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  inputGroup: {marginBottom: 15},
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 12,
    marginTop: 5,
    backgroundColor: '#F9F9F9',
    color: APPCOLORS.BLACK,
    fontSize: responsiveFontSize(1.8),
  },
  successModalContent: {
    backgroundColor: APPCOLORS.WHITE,
    padding: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  successIconContainer: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  successButton: {
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 15,
    marginTop: 25,
    width: '100%',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});

export default Attendance;
