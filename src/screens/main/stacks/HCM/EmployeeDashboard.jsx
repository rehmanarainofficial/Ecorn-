import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import SimpleHeader from '../../../../components/SimpleHeader';
import PlatformGradient from '../../../../components/PlatformGradient';
import {APPCOLORS} from '../../../../utils/APPCOLORS';
import {BASEURL} from '../../../../utils/BaseUrl';

const EmployeeDashboard = ({navigation}) => {
  const userData = useSelector(state => state.Data.currentData);
  const [leaveHistory, setLeaveHistory] = useState(null);
  const [loadingLeave, setLoadingLeave] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const employeeName = userData?.real_name || userData?.emp_name || 'Employee';
  const employeeCode = userData?.emp_code || userData?.employee_id || 'N/A';
  const designation =
    userData?.designation || userData?.desig || userData?.role_name || 'Employee';
  const department =
    userData?.department ||
    userData?.dept_name ||
    userData?.department_name ||
    'Department';
  const joiningDate =
    userData?.joining_date ||
    userData?.date_of_joining ||
    userData?.doj ||
    'N/A';

  const initials = useMemo(() => {
    return employeeName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(name => name[0])
      .join('')
      .toUpperCase();
  }, [employeeName]);

  const currentMonth = new Date().toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const fetchLeaveHistory = useCallback(async () => {
    const employeeId = userData?.employee_id;
    if (!employeeId) {
      setLeaveHistory(null);
      return;
    }

    setLoadingLeave(true);
    try {
      const formData = new FormData();
      formData.append('emp_id', String(employeeId));

      const response = await axios.post(
        `${BASEURL}get_employee_leave_history.php`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      if (response.data && response.data !== 'null') {
        setLeaveHistory(response.data);
      } else {
        setLeaveHistory(null);
      }
    } catch (error) {
      console.log('Employee dashboard leave history error:', error);
      setLeaveHistory(null);
    } finally {
      setLoadingLeave(false);
    }
  }, [userData?.employee_id]);

  useEffect(() => {
    fetchLeaveHistory();
  }, [fetchLeaveHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeaveHistory();
    setRefreshing(false);
  };

  const totalLeaves = Number(leaveHistory?.leave_days || 0);
  const availedLeaves = Number(leaveHistory?.availed || 0);
  const balanceLeaves =
    leaveHistory?.balance !== undefined
      ? Number(leaveHistory.balance)
      : Math.max(totalLeaves - availedLeaves, 0);

  const metricCards = [
    {
      title: 'Leaves Taken',
      value: availedLeaves,
      subTitle: 'This Year',
      icon: 'calendar-remove-outline',
      color: '#8B5CF6',
      onPress: () => navigation.navigate('LeaveStatus'),
    },
    {
      title: 'Present Days',
      value: '0',
      subTitle: 'This Month',
      icon: 'calendar-check-outline',
      color: '#10B981',
      onPress: () => navigation.navigate('Attendance'),
    },
    {
      title: 'Absent Days',
      value: '0',
      subTitle: 'This Month',
      icon: 'account-off-outline',
      color: '#EF4444',
      onPress: () => navigation.navigate('Attendance'),
    },
    {
      title: 'Half Days',
      value: '0',
      subTitle: 'This Month',
      icon: 'account-clock-outline',
      color: '#F59E0B',
      onPress: () => navigation.navigate('Attendance'),
    },
    {
      title: 'CPL Balance',
      value: balanceLeaves,
      subTitle: 'Days',
      icon: 'airplane',
      color: '#3B82F6',
      onPress: () => navigation.navigate('Leave'),
    },
    {
      title: 'Net Salary',
      value: '0',
      subTitle: 'Latest Payslip',
      icon: 'cash-multiple',
      color: '#EF4444',
    },
    {
      title: 'Documents',
      value: '0',
      subTitle: 'Available',
      icon: 'file-document-outline',
      color: '#14B8A6',
      onPress: () => navigation.navigate('Policy'),
    },
    {
      title: 'Assets',
      value: '0',
      subTitle: 'Assigned',
      icon: 'laptop',
      color: '#8B5CF6',
    },
  ];

  const leaveCards = [
    {
      title: 'Casual Leave',
      value: balanceLeaves,
      icon: 'beach',
      color: '#10B981',
    },
    {
      title: 'Sick Leave',
      value: '0',
      icon: 'medical-bag',
      color: '#EF4444',
    },
    {
      title: 'Annual Leave',
      value: totalLeaves,
      icon: 'calendar-account',
      color: '#3B82F6',
    },
    {
      title: 'CPL',
      value: balanceLeaves,
      icon: 'watch',
      color: '#8B5CF6',
      onPress: () => navigation.navigate('Leave'),
    },
  ];

  const documentCards = [
    {title: 'Contracts', value: '0', icon: 'file-document-outline'},
    {title: 'Certificates', value: '0', icon: 'certificate-outline'},
    {title: 'Letters', value: '0', icon: 'email-outline'},
    {title: 'Others', value: '0', icon: 'folder-outline'},
  ];

  const assetCards = [
    {title: 'Laptop', value: '0', icon: 'laptop'},
    {title: 'Mobile', value: '0', icon: 'cellphone'},
    {title: 'SIM', value: '0', icon: 'sim-outline'},
  ];

  const renderMetricCard = item => (
    <TouchableOpacity
      key={item.title}
      activeOpacity={0.75}
      onPress={item.onPress}
      style={styles.metricCard}>
      <View style={[styles.metricIcon, {backgroundColor: `${item.color}18`}]}>
        <Icon name={item.icon} size={22} color={item.color} />
      </View>
      <Text style={styles.metricValue}>{item.value}</Text>
      <Text style={styles.metricTitle}>{item.title}</Text>
      <Text style={styles.metricSubTitle}>{item.subTitle}</Text>
    </TouchableOpacity>
  );

  const renderMiniCard = item => (
    <TouchableOpacity
      key={item.title}
      activeOpacity={item.onPress ? 0.75 : 1}
      onPress={item.onPress}
      style={styles.miniCard}>
      <View style={[styles.miniIcon, {backgroundColor: `${item.color || APPCOLORS.Primary}14`}]}>
        <Icon
          name={item.icon}
          size={20}
          color={item.color || APPCOLORS.Primary}
        />
      </View>
      <Text style={styles.miniTitle}>{item.title}</Text>
      <Text style={styles.miniValue}>{item.value}</Text>
    </TouchableOpacity>
  );

  const renderSectionHeader = (title, actionText, onPress) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionText && (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
          <Text style={styles.sectionAction}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <SimpleHeader title="Employee Dashboard" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[APPCOLORS.Primary]}
          />
        }>
        <PlatformGradient
          colors={[APPCOLORS.Primary, APPCOLORS.Secondary]}
          style={styles.heroCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials || 'E'}</Text>
              <View style={styles.statusDot} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.employeeName}>{employeeName}</Text>
              <Text style={styles.employeeCode}>EMP-{employeeCode}</Text>
              <Text style={styles.employeeMeta}>{designation}</Text>
              <Text style={styles.employeeMeta}>{department}</Text>
            </View>
            <Icon name="chevron-right" size={28} color={APPCOLORS.WHITE} />
          </View>

          <View style={styles.heroFooter}>
            <View style={styles.heroInfoItem}>
              <Icon name="calendar-month-outline" size={20} color={APPCOLORS.WHITE} />
              <View>
                <Text style={styles.heroLabel}>Date of Joining</Text>
                <Text style={styles.heroValue}>{joiningDate}</Text>
              </View>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroInfoItem}>
              <Icon name="badge-account-outline" size={20} color={APPCOLORS.WHITE} />
              <View>
                <Text style={styles.heroLabel}>Employee ID</Text>
                <Text style={styles.heroValue}>EMP-{employeeCode}</Text>
              </View>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroInfoItem}>
              <Icon name="shield-check-outline" size={20} color={APPCOLORS.WHITE} />
              <View>
                <Text style={styles.heroLabel}>Status</Text>
                <Text style={styles.heroValue}>Active</Text>
              </View>
            </View>
          </View>
        </PlatformGradient>

        <View style={styles.metricsGrid}>{metricCards.map(renderMetricCard)}</View>

        <View style={styles.sectionCard}>
          {renderSectionHeader('Leaves Balance', 'View All', () =>
            navigation.navigate('LeaveStatus'),
          )}
          {loadingLeave ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={APPCOLORS.Primary} />
              <Text style={styles.loadingText}>Loading leave balance...</Text>
            </View>
          ) : (
            <View style={styles.miniGrid}>{leaveCards.map(renderMiniCard)}</View>
          )}
        </View>

        <View style={styles.sectionCard}>
          {renderSectionHeader('Attendance This Month', 'Open', () =>
            navigation.navigate('Attendance'),
          )}
          <View style={styles.progressTrack}>
            <View style={[styles.progressChunk, {flex: 8, backgroundColor: '#10B981'}]} />
            <View style={[styles.progressChunk, {flex: 1, backgroundColor: '#EF4444'}]} />
            <View style={[styles.progressChunk, {flex: 1, backgroundColor: '#F59E0B'}]} />
          </View>
          <View style={styles.legendRow}>
            <Text style={styles.legendText}>Present 0</Text>
            <Text style={styles.legendText}>Absent 0</Text>
            <Text style={styles.legendText}>Half Day 0</Text>
            <Text style={styles.legendText}>Holiday 0</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          {renderSectionHeader('Latest Payslip', 'View All')}
          <View style={styles.payslipRow}>
            <View style={styles.quickIcon}>
              <Icon name="file-document-outline" size={24} color={APPCOLORS.Primary} />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.quickTitle}>{currentMonth}</Text>
              <Text style={styles.quickSubTitle}>Salary for {currentMonth}</Text>
            </View>
            <Text style={styles.salaryText}>0</Text>
            <TouchableOpacity style={styles.downloadButton} activeOpacity={0.7}>
              <Icon name="download" size={20} color={APPCOLORS.Primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionCard}>
          {renderSectionHeader('Documents', 'Policy', () =>
            navigation.navigate('Policy'),
          )}
          <View style={styles.miniGrid}>{documentCards.map(renderMiniCard)}</View>
        </View>

        <View style={styles.sectionCard}>
          {renderSectionHeader('Assets')}
          <View style={styles.assetRow}>{assetCards.map(renderMiniCard)}</View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APPCOLORS.BG_SCREEN,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  heroCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    overflow: 'hidden',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: APPCOLORS.WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: APPCOLORS.Primary,
  },
  statusDot: {
    position: 'absolute',
    right: 4,
    bottom: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: APPCOLORS.WHITE,
  },
  profileInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: '800',
    color: APPCOLORS.WHITE,
    marginBottom: 3,
  },
  employeeCode: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E5E7EB',
    marginBottom: 4,
  },
  employeeMeta: {
    fontSize: 12,
    color: '#E5E7EB',
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
  heroInfoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroDivider: {
    width: 1,
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginHorizontal: 12,
  },
  heroLabel: {
    fontSize: 10,
    color: '#E5E7EB',
  },
  heroValue: {
    fontSize: 11,
    fontWeight: '800',
    color: APPCOLORS.WHITE,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 14,
  },
  metricCard: {
    width: '23.5%',
    minHeight: 116,
    backgroundColor: APPCOLORS.WHITE,
    borderRadius: 14,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
  },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: APPCOLORS.Primary,
    textAlign: 'center',
  },
  metricTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: APPCOLORS.Primary,
    textAlign: 'center',
  },
  metricSubTitle: {
    fontSize: 8,
    color: APPCOLORS.Secondary,
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: APPCOLORS.WHITE,
    borderRadius: 16,
    padding: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: APPCOLORS.Primary,
  },
  sectionAction: {
    fontSize: 12,
    fontWeight: '700',
    color: APPCOLORS.Secondary,
  },
  miniGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  miniCard: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  miniIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  miniTitle: {
    fontSize: 10,
    color: APPCOLORS.Secondary,
    textAlign: 'center',
  },
  miniValue: {
    fontSize: 14,
    fontWeight: '800',
    color: APPCOLORS.Primary,
    marginTop: 2,
    textAlign: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: APPCOLORS.Secondary,
    fontSize: 13,
  },
  progressTrack: {
    height: 12,
    borderRadius: 8,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
  },
  progressChunk: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  legendText: {
    fontSize: 11,
    color: APPCOLORS.Secondary,
    fontWeight: '600',
  },
  quickActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payslipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quickTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: APPCOLORS.Primary,
  },
  quickSubTitle: {
    fontSize: 12,
    color: APPCOLORS.Secondary,
    marginTop: 2,
  },
  salaryText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10B981',
    marginRight: 10,
  },
  downloadButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetRow: {
    flexDirection: 'row',
  },
});

export default EmployeeDashboard;
