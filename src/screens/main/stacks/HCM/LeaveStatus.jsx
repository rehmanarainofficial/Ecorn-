import React, {useState, useEffect} from 'react';
import {useSelector} from 'react-redux';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Animatable from 'react-native-animatable';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import {formatDateString} from '../../../../utils/DateUtils';
import {BASEURL} from '../../../../utils/BaseUrl';
import SimpleHeader from '../../../../components/SimpleHeader';
import {APPCOLORS} from '../../../../utils/APPCOLORS';

const LeaveStatus = () => {
  const userData = useSelector(state => state.Data.currentData);
  const employeeId = userData?.employee_id;

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (employeeId) {
      fetchSelfLeaves(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const fetchSelfLeaves = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const formData = new FormData();
      formData.append('emp_id', employeeId || '');

      const response = await axios.post(
        `${BASEURL}get_emp_self_leaves.php`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      if (response.data && response.data.status === true) {
        setLeaves(response.data.data || []);
      } else {
        setLeaves([]);
      }
    } catch (error) {
      console.log('Error fetching self leaves:', error);
      Toast.show({
        type: 'error',
        text1: 'Query Error',
        text2: 'Failed to fetch your leave applications.',
      });
      setLeaves([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const isApproved = val => val === '1' || val === 1;
  const isPending = val => val === '0' || val === 0 || !val;

  const renderStatusBadge = (statusVal, label) => {
    const isBadgeApproved = isApproved(statusVal);
    const isBadgePending = isPending(statusVal);

    let bg = '#FEF3C7';
    let text = '#D97706';
    let icon = 'clock-outline';
    let statusText = 'Pending';

    if (isBadgeApproved) {
      bg = '#D1FAE5';
      text = '#059669';
      icon = 'check-circle-outline';
      statusText = 'Approved';
    } else if (!isBadgePending) {
      bg = '#FEE2E2';
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

  const renderLeaveCard = ({item, index}) => {
    const fromStr = formatDateString(item.from_date);
    const toStr = formatDateString(item.to_date);

    return (
      <Animatable.View
        animation="fadeInUp"
        duration={450}
        delay={index * 100}
        useNativeDriver
        style={styles.card}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Icon
              name="calendar-clock"
              size={22}
              color={APPCOLORS.Primary || '#1a1c22'}
            />
            <Text style={styles.leaveTitle}>
              Leave Request #{item.id}
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
              name="calendar-range"
              size={16}
              color={APPCOLORS.Secondary || '#475569'}
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

        {/* Status Badges Footer */}
        <View style={styles.cardFooter}>
          {renderStatusBadge(item.approve, 'Manager')}
          {renderStatusBadge(item.hr_approve, 'HR')}
        </View>
      </Animatable.View>
    );
  };

  return (
    <View style={styles.container}>
      <SimpleHeader title="Leave Status" />

      {loading && !refreshing ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={APPCOLORS.Primary || '#1a1c22'} />
          <Text style={styles.loadingText}>
            Retrieving your leave applications...
          </Text>
        </View>
      ) : (
        <FlatList
          data={leaves}
          renderItem={renderLeaveCard}
          keyExtractor={(item, index) =>
            item.id ? item.id.toString() : index.toString()
          }
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchSelfLeaves(true)}
              colors={[APPCOLORS.Primary || '#1a1c22']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="calendar-blank-outline" size={60} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Leave Applications</Text>
              <Text style={styles.emptySubtitle}>
                You have not submitted any leave applications yet.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default LeaveStatus;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APPCOLORS.BG_SCREEN || '#F3F4F6',
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6b7280',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 40,
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
  leaveTitle: {
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
});
