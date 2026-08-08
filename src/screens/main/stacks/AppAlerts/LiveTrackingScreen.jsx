import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import SimpleHeader from '../../../../components/SimpleHeader';
import {APPCOLORS} from '../../../../utils/APPCOLORS';
import {BASEURL} from '../../../../utils/BaseUrl';

const LIVE_TRACKING_URL = `${BASEURL}get_live_tracking.php`;

const LiveTrackingScreen = ({navigation}) => {
  const userData = useSelector(state => state.Data.currentData);
  console.log("userData ",userData);
  
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrackingData = useCallback(async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const formData = new FormData();
      formData.append('emp_code', '');
      formData.append('date', todayStr);

      const response = await axios.post(LIVE_TRACKING_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const res = response.data;

      let list = [];
      if (Array.isArray(res)) {
        list = res;
      } else if (res && Array.isArray(res.data)) {
        list = res.data;
      } else if (res && Array.isArray(res.tracking_data)) {
        list = res.tracking_data;
      } else if (res && typeof res === 'object') {
        const possibleArray = Object.values(res).find(val => Array.isArray(val));
        if (possibleArray) list = possibleArray;
      }

      setEmployees(list);
    } catch (error) {
      console.log('Error fetching live tracking data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTrackingData();
      const interval = setInterval(fetchTrackingData, 10000);
      return () => clearInterval(interval);
    }, [fetchTrackingData]),
  );

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEmployees(employees);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = employees.filter(
        emp =>
          (emp.name && emp.name.toLowerCase().includes(query)) ||
          (emp.EmployeeCode && emp.EmployeeCode.toLowerCase().includes(query)) ||
          (emp.current_location && emp.current_location.toLowerCase().includes(query)),
      );
      setFilteredEmployees(filtered);
    }
  }, [searchQuery, employees]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTrackingData();
    setRefreshing(false);
  };

  const handleTrackEmployee = employee => {
    if (!employee.latitude || !employee.longitude) {
      Toast.show({
        type: 'error',
        text1: 'Location Unavailable',
        text2: 'No GPS coordinates found for this employee.',
      });
      return;
    }

    navigation.navigate('LiveTrackingMapScreen', {
      employee,
      employees: employees.length > 0 ? employees : [employee],
    });
  };

  const handleViewAllOnMap = () => {
    const validEmployees = (employees.length > 0 ? employees : filteredEmployees).filter(
      emp => emp.latitude && emp.longitude && !isNaN(parseFloat(emp.latitude)),
    );

    if (validEmployees.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'No GPS Data',
        text2: 'No active employees with valid GPS coordinates found.',
      });
      return;
    }

    navigation.navigate('LiveTrackingMapScreen', {
      employees: validEmployees,
    });
  };

  const getInitials = name => {
    if (!name) return 'EMP';
    return name
      .split(' ')
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const getStatusBadge = activityTime => {
    if (!activityTime) {
      return {label: 'Offline', color: '#EF4444'};
    }
    return {label: 'Active', color: '#10B981'};
  };

  const renderItem = ({item}) => {
    const initials = getInitials(item.name);
    const status = getStatusBadge(item.ActivityTime);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          {/* Avatar */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.empName} numberOfLines={1}>
              {item.name || 'Unknown Employee'}
            </Text>
            {item.father_name ? (
              <Text style={styles.fatherName}>S/O: {item.father_name}</Text>
            ) : null}
            <Text style={styles.empCode}>Code: {item.EmployeeCode || 'N/A'}</Text>
          </View>

          {/* Status & Time Badge */}
          <View style={[styles.timeBadge, {backgroundColor: status.color + '20'}]}>
            <View style={[styles.statusDot, {backgroundColor: status.color}]} />
            <Text style={[styles.timeText, {color: status.color}]}>
              {item.ActivityTime || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Location Info */}
        <View style={styles.locationContainer}>
          <Icon
            name="location-outline"
            size={16}
            color={APPCOLORS.Primary}
            style={styles.locIcon}
          />
          <Text style={styles.locationText} numberOfLines={2}>
            {item.current_location || 'No location updated'}
          </Text>
        </View>

        {/* Coordinates Info */}
        <View style={styles.coordsContainer}>
          <View style={styles.coordBadge}>
            <Text style={styles.coordLabel}>Lat: </Text>
            <Text style={styles.coordValue}>{item.latitude || 'N/A'}</Text>
          </View>
          <View style={[styles.coordBadge, {marginLeft: 8}]}>
            <Text style={styles.coordLabel}>Lon: </Text>
            <Text style={styles.coordValue}>{item.longitude || 'N/A'}</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.trackButton}
          onPress={() => handleTrackEmployee(item)}
          activeOpacity={0.8}>
          <Icon name="map-outline" size={16} color="#FFFFFF" style={{marginRight: 6}} />
          <Text style={styles.trackBtnText}>Show on Map</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SimpleHeader title="Live Tracking" />

      {/* Search Header & View All Map Button */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Icon name="search-outline" size={20} color="#6B7280" style={{marginRight: 8}} />
          <TextInput
            placeholder="Search employee or location..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={18} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.viewAllMapBtn}
          onPress={handleViewAllOnMap}
          activeOpacity={0.8}>
          <Icon name="map" size={18} color="#FFFFFF" style={{marginRight: 8}} />
          <Text style={styles.viewAllMapBtnText}>View All Employees on Map</Text>
        </TouchableOpacity>
      </View>

      {/* Employee List */}
      {loading && employees.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={APPCOLORS.Primary} />
          <Text style={styles.loadingText}>Loading live tracking data...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEmployees}
          renderItem={renderItem}
          keyExtractor={item => String(item.id || item.EmployeeCode || Math.random())}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[APPCOLORS.Primary]}
              tintColor={APPCOLORS.Primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="people-outline" size={60} color="#D1D5DB" />
              <Text style={styles.emptyText}>No active tracking data</Text>
              <Text style={styles.emptySubText}>
                Employees who have updated location will appear here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APPCOLORS.BG_SCREEN || '#F3F4F6',
  },
  searchContainer: {
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    height: '100%',
    padding: 0,
  },
  viewAllMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    marginTop: 10,
    backgroundColor: APPCOLORS.Primary,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  viewAllMapBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: APPCOLORS.Primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: APPCOLORS.Primary,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  empName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  fatherName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  empCode: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  timeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    marginBottom: 12,
  },
  locIcon: {
    marginTop: 2,
  },
  locationText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  coordsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  coordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  coordLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  coordValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 20,
    backgroundColor: APPCOLORS.Primary,
    elevation: 2,
  },
  trackBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
});

export default LiveTrackingScreen;
