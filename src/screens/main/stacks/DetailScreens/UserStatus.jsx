import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SimpleHeader from '../../../../components/SimpleHeader';
import {BASEURL} from '../../../../utils/BaseUrl';
import {APPCOLORS} from '../../../../utils/APPCOLORS';
import {responsiveFontSize} from '../../../../utils/Responsive';

const UserStatus = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [updatingIds, setUpdatingIds] = useState({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${BASEURL}users.php`);
      if (response.data && (response.data.status === 'true' || response.data.status === true)) {
        setUsers(response.data.data || []);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.log('Error fetching users:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch users list.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleToggleLoginStatus = async user => {
    const userId = user.id;
    if (updatingIds[userId]) return;

    const currentStatus = String(user.login_status || '0');
    const newStatus = currentStatus === '0' ? '1' : '0';

    setUpdatingIds(prev => ({...prev, [userId]: true}));

    setUsers(prevUsers =>
      prevUsers.map(u =>
        u.id === userId ? {...u, login_status: newStatus} : u,
      ),
    );

    try {
      const formData = new FormData();
      formData.append('id', String(userId));
      formData.append('inactive', String(user.inactive || '0'));
      formData.append('login_status', newStatus);
      formData.append('login_active_status', '0');

      const response = await axios.post(`${BASEURL}logout_post.php`, formData, {
        headers: {'Content-Type': 'multipart/form-data'},
      });

      if (
        response.data &&
        (response.data.status === 'true' || response.data.status === true)
      ) {
        Toast.show({
          type: 'success',
          text1: 'Status Updated',
          text2: `${user.real_name || user.user_id} login status set to ${
            newStatus === '0' ? 'Login' : 'Logout'
          }.`,
        });
      } else {
        setUsers(prevUsers =>
          prevUsers.map(u =>
            u.id === userId ? {...u, login_status: currentStatus} : u,
          ),
        );
        Toast.show({
          type: 'error',
          text1: 'Update Failed',
          text2: response.data?.message || 'Could not update login status.',
        });
      }
    } catch (error) {
      console.log('Error updating login status:', error);
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === userId ? {...u, login_status: currentStatus} : u,
        ),
      );
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: 'Failed to update login status.',
      });
    } finally {
      setUpdatingIds(prev => {
        const next = {...prev};
        delete next[userId];
        return next;
      });
    }
  };

  const handleToggleActiveStatus = async user => {
    const userId = user.id;
    if (updatingIds[userId]) return;

    const currentInactive = String(user.inactive || '0');
    const newInactive = currentInactive === '0' ? '1' : '0';

    setUpdatingIds(prev => ({...prev, [userId]: true}));

    setUsers(prevUsers =>
      prevUsers.map(u =>
        u.id === userId ? {...u, inactive: newInactive} : u,
      ),
    );

    try {
      const formData = new FormData();
      formData.append('id', String(userId));
      formData.append('inactive', newInactive);
      formData.append('login_status', String(user.login_status || '0'));
      formData.append('login_active_status', '1');

      const response = await axios.post(`${BASEURL}logout_post.php`, formData, {
        headers: {'Content-Type': 'multipart/form-data'},
      });

      if (
        response.data &&
        (response.data.status === 'true' || response.data.status === true)
      ) {
        Toast.show({
          type: 'success',
          text1: 'Status Updated',
          text2: `${user.real_name || user.user_id} is now ${
            newInactive === '0' ? 'Active' : 'Inactive'
          }.`,
        });
      } else {
        // Rollback
        setUsers(prevUsers =>
          prevUsers.map(u =>
            u.id === userId ? {...u, inactive: currentInactive} : u,
          ),
        );
        Toast.show({
          type: 'error',
          text1: 'Update Failed',
          text2: response.data?.message || 'Could not update active status.',
        });
      }
    } catch (error) {
      console.log('Error updating active status:', error);
      // Rollback
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === userId ? {...u, inactive: currentInactive} : u,
        ),
      );
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: 'Failed to update active status.',
      });
    } finally {
      setUpdatingIds(prev => {
        const next = {...prev};
        delete next[userId];
        return next;
      });
    }
  };

  const counts = useMemo(() => {
    let loggedIn = 0;
    let loggedOut = 0;
    let active = 0;
    let inactive = 0;

    users.forEach(u => {
      if (String(u.login_status) === '0') loggedIn++;
      else loggedOut++;

      if (String(u.inactive) === '0') active++;
      else inactive++;
    });

    return {
      total: users.length,
      loggedIn,
      loggedOut,
      active,
      inactive,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (user.real_name && user.real_name.toLowerCase().includes(q)) ||
        (user.user_id && user.user_id.toLowerCase().includes(q)) ||
        (user.emp_code && user.emp_code.toLowerCase().includes(q)) ||
        (user.phone && user.phone.includes(q));

      if (!matchesSearch) return false;

      if (filterType === 'login') return String(user.login_status) === '0';
      if (filterType === 'logout') return String(user.login_status) === '1';
      if (filterType === 'active') return String(user.inactive) === '0';
      if (filterType === 'inactive') return String(user.inactive) === '1';

      return true;
    });
  }, [users, searchQuery, filterType]);

  const renderFilterChip = (type, label, count) => {
    const isSelected = filterType === type;
    return (
      <TouchableOpacity
        key={type}
        style={[styles.filterChip, isSelected && styles.activeFilterChip]}
        onPress={() => setFilterType(type)}>
        <Text style={[styles.filterChipText, isSelected && styles.activeFilterChipText]}>
          {label} ({count})
        </Text>
      </TouchableOpacity>
    );
  };

  const renderUserItem = ({item}) => {
    const isLogin = String(item.login_status) === '0';
    const isActive = String(item.inactive) === '0';
    const isUpdating = !!updatingIds[item.id];

    return (
      <View style={styles.userCard}>
        <View style={styles.cardTopRow}>
          <View style={styles.avatarContainer}>
            <View
              style={[
                styles.avatarCircle,
                {backgroundColor: isActive ? '#1a1c22' : '#94A3B8'},
              ]}>
              <Text style={styles.avatarText}>
                {(item.real_name || item.user_id || 'U')
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </View>
            <View
              style={[
                styles.statusDot,
                {backgroundColor: isActive ? (isLogin ? '#10B981' : '#F59E0B') : '#EF4444'},
              ]}
            />
          </View>

          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.realName} numberOfLines={1}>
                {item.real_name || 'No Name'}
              </Text>
              {item.emp_code ? (
                <View style={styles.empBadge}>
                  <Text style={styles.empBadgeText}>#{item.emp_code}</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.usernameText}>@{item.user_id}</Text>

            <View style={styles.metaRow}>
              {item.phone ? (
                <View style={styles.metaItem}>
                  <Ionicons name="call-outline" size={12} color="#64748B" />
                  <Text style={styles.metaText}>{item.phone}</Text>
                </View>
              ) : null}
              {item.email ? (
                <View style={styles.metaItem}>
                  <Ionicons name="mail-outline" size={12} color="#64748B" />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {item.email}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {isUpdating && (
            <ActivityIndicator
              size="small"
              color={APPCOLORS.Primary}
              style={{marginLeft: 8}}
            />
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.controlsRow}>
          {/* Login Status Checkbox */}
          <TouchableOpacity
            style={[
              styles.checkboxContainer,
              isLogin ? styles.checkboxActiveBg : styles.checkboxInactiveBg,
            ]}
            disabled={isUpdating}
            onPress={() => handleToggleLoginStatus(item)}>
            <MaterialCommunityIcons
              name={isLogin ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={22}
              color={isLogin ? '#10B981' : '#94A3B8'}
            />
            <View style={styles.checkboxLabelContainer}>
              <Text style={styles.controlLabel}>Login Status</Text>
              <Text
                style={[
                  styles.controlValue,
                  {color: isLogin ? '#059669' : '#64748B'},
                ]}>
                {isLogin ? 'Logged In' : 'Logged Out'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Active Status Checkbox */}
          <TouchableOpacity
            style={[
              styles.checkboxContainer,
              isActive ? styles.checkboxActiveBg : styles.checkboxDangerBg,
            ]}
            disabled={isUpdating}
            onPress={() => handleToggleActiveStatus(item)}>
            <MaterialCommunityIcons
              name={isActive ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={22}
              color={isActive ? '#3B82F6' : '#EF4444'}
            />
            <View style={styles.checkboxLabelContainer}>
              <Text style={styles.controlLabel}>User Status</Text>
              <Text
                style={[
                  styles.controlValue,
                  {color: isActive ? '#2563EB' : '#DC2626'},
                ]}>
                {isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={APPCOLORS.Primary} />
      <SimpleHeader title="User Status" />

      {/* Summary Stat Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{counts.total}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, {color: '#10B981'}]}>
            {counts.loggedIn}
          </Text>
          <Text style={styles.statLabel}>Logged In</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, {color: '#3B82F6'}]}>
            {counts.active}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, emp code, user id..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterScrollContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            {type: 'all', label: 'All', count: counts.total},
            {type: 'login', label: 'Logged In', count: counts.loggedIn},
            {type: 'logout', label: 'Logged Out', count: counts.loggedOut},
            {type: 'active', label: 'Active', count: counts.active},
            {type: 'inactive', label: 'Inactive', count: counts.inactive},
          ]}
          keyExtractor={item => item.type}
          renderItem={({item}) =>
            renderFilterChip(item.type, item.label, item.count)
          }
          contentContainerStyle={styles.filterChipsContent}
        />
      </View>

      {/* User List */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={APPCOLORS.Primary} />
          <Text style={styles.loaderText}>Loading users...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={item => String(item.id)}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[APPCOLORS.Primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default UserStatus;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingTop: 12,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  searchWrapper: {
    paddingHorizontal: 15,
    marginTop: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#1E293B',
    paddingVertical: 0,
  },
  filterScrollContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  filterChipsContent: {
    paddingHorizontal: 15,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeFilterChip: {
    backgroundColor: '#1a1c22',
    borderColor: '#1a1c22',
  },
  filterChipText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  activeFilterChipText: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 15,
    paddingTop: 8,
    paddingBottom: 30,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  realName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  empBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  empBadgeText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  usernameText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  checkboxContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  checkboxActiveBg: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  checkboxInactiveBg: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  checkboxDangerBg: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  checkboxLabelContainer: {
    marginLeft: 8,
  },
  controlLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  controlValue: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loaderText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  emptyText: {
    marginTop: 10,
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
});
