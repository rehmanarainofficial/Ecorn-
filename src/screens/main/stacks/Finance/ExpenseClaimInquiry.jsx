import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ToastAndroid,
  Platform,
  FlatList,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PlatformGradient from '../../../../components/PlatformGradient';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import axios from 'axios';
import { BASEURL } from '../../../../utils/BaseUrl';
import { useSelector } from 'react-redux';
import { formatNumber } from '../../../../utils/NumberUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APPCOLORS } from '../../../../utils/APPCOLORS';
import { generateAndDownloadPDF } from '../../../../components/PDFGenerator';
import Toast from 'react-native-toast-message';

const COLORS = {
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  Primary: '#1a1c22',
  Secondary: '#5a5c6a',
  CardBg: '#F8FAFC',
  Border: '#E2E8F0',
  LabelColor: '#64748B',
  TextDark: '#1E293B',
  AccentBlue: '#3B82F6',
  CheckboxActive: '#10B981',
};

// Helper to get default date range (1 month)
const getDefaultDateRange = () => {
  const today = new Date();
  const fromDate = new Date(today.getFullYear(), today.getMonth(), 1); // First day of current month
  return { fromDate, toDate: today };
};

export default function ExpenseClaimInquiry({ navigation }) {
  const insets = useSafeAreaInsets();
  const userData = useSelector(state => state.Data.currentData);
  const employeeId = userData?.employee_id;

  // Inquiry State
  const [inquiryData, setInquiryData] = useState([]);
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const { fromDate: defaultFromDate, toDate: defaultToDate } = getDefaultDateRange();
  const [filterFromDate, setFilterFromDate] = useState(defaultFromDate);
  const [filterToDate, setFilterToDate] = useState(defaultToDate);
  const [showFilterFromDatePicker, setShowFilterFromDatePicker] = useState(false);
  const [showFilterToDatePicker, setShowFilterToDatePicker] = useState(false);

  // Fetch inquiry data on mount
  useEffect(() => {
    fetchInquiryData();
  }, []);

  const formatDateForApi = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const fetchInquiryData = async () => {
    setInquiryLoading(true);
    try {
      const formData = new FormData();
      formData.append('from_date', formatDateForApi(filterFromDate));
      formData.append('to_date', formatDateForApi(filterToDate));
      formData.append('employee_id', employeeId);

      console.log('Fetching inquiry with:', {
        from_date: formatDateForApi(filterFromDate),
        to_date: formatDateForApi(filterToDate),
        employee_id: employeeId,
      });

      const response = await axios.post(
        `${BASEURL}expense_claim_inquiry.php`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      console.log('Inquiry response:', response.data);

      if (response.data?.status === 'true' || response.data?.status === true) {
        setInquiryData(response.data.data || []);
      } else {
        setInquiryData([]);
      }
    } catch (error) {
      console.log('Inquiry error:', error);
      ToastAndroid.show('Error loading expense claims', ToastAndroid.SHORT);
      setInquiryData([]);
    } finally {
      setInquiryLoading(false);
    }
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleView = async (item) => {
    setViewLoading(true);
    try {
      const formData = new FormData();
      formData.append('trans_no', item.trans_no);
      formData.append('type', item.type);

      const response = await axios.post(
        `${BASEURL}view_gl.php`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      console.log('GL View response:', response.data);

      navigation.navigate('GLViewScreen', {
        glData: response.data,
        reference: item.reference,
        transNo: item.trans_no,
      });
    } catch (error) {
      console.log('GL View API Error:', error);
      ToastAndroid.show('Failed to fetch GL details', ToastAndroid.SHORT);
    } finally {
      setViewLoading(false);
    }
  };

  const handlePDF = async (item) => {
    setPdfLoading(true);
    try {
      const formData = new FormData();
      formData.append('trans_no', item.trans_no);
      formData.append('type', item.type);

      const response = await axios.post(
        `${BASEURL}view_data.php`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      console.log('PDF data response:', response.data);

      const data = response.data;
      await generateAndDownloadPDF(data, item.reference);
    } catch (error) {
      console.log('PDF Download Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Download Failed',
        text2: 'Failed to download PDF',
      });
    } finally {
      setPdfLoading(false);
    }
  };

  const renderInquiryItem = ({ item, index }) => {
    const isApproved = item.approval === '0' || item.approval === 0;
    
    return (
      <View style={styles.inquiryCard}>
        <View style={styles.inquiryHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.inquiryRef}>{item.reference || 'N/A'}</Text>
            <Text style={styles.inquiryName}>{item.name || 'N/A'}</Text>
          </View>
          <View style={[
            styles.approvalBadge,
            isApproved ? styles.approvalBadgeApproved : styles.approvalBadgeUnapproved
          ]}>
            <Ionicons 
              name={isApproved ? "checkmark-circle" : "close-circle"} 
              size={14} 
              color={isApproved ? '#16A34A' : '#DC2626'} 
            />
            <Text style={[
              styles.approvalText,
              isApproved ? styles.approvalTextApproved : styles.approvalTextUnapproved
            ]}>
              {isApproved ? 'Approved' : 'Unapproved'}
            </Text>
          </View>
        </View>

        <View style={styles.inquiryBody}>
          <View style={styles.inquiryRow}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.LabelColor} />
            <Text style={styles.inquiryDateText}>{formatDisplayDate(item.ord_date)}</Text>
          </View>
          <Text style={styles.inquiryTotal}>Rs. {formatNumber(item.total || 0)}</Text>
        </View>

        <View style={styles.inquiryFooter}>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => handleView(item)}
            disabled={viewLoading}>
            {viewLoading ? (
              <ActivityIndicator size="small" color={COLORS.AccentBlue} />
            ) : (
              <>
                <Ionicons name="eye-outline" size={18} color={COLORS.AccentBlue} />
                <Text style={styles.actionBtnText}>View</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.actionBtnPdf]}
            onPress={() => handlePDF(item)}
            disabled={pdfLoading}>
            {pdfLoading ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <>
                <Ionicons name="document-text-outline" size={18} color="#DC2626" />
                <Text style={[styles.actionBtnText, styles.actionBtnTextPdf]}>PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const paddingTop = Platform.OS === 'ios' ? insets.top + 10 : insets.top + 15;

  return (
    <View style={styles.container}>
      {/* Header */}
      <PlatformGradient
        colors={[APPCOLORS.Primary, APPCOLORS.Secondary]}
        style={[styles.header, { paddingTop }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" color={COLORS.WHITE} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Expense Claims</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('ExpenseClaim', { onRefresh: fetchInquiryData })} 
          style={styles.newBtn}>
          <Ionicons name="add" color={COLORS.WHITE} size={24} />
        </TouchableOpacity>
      </PlatformGradient>

      <View style={styles.inquiryContainer}>
        {/* Filter Section */}
        <View style={styles.filterCard}>
          <View style={styles.filterRow}>
            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>From:</Text>
              <TouchableOpacity
                style={styles.filterDateBtn}
                onPress={() => setShowFilterFromDatePicker(true)}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.AccentBlue} />
                <Text style={styles.filterDateText}>{formatDisplayDate(filterFromDate)}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>To:</Text>
              <TouchableOpacity
                style={styles.filterDateBtn}
                onPress={() => setShowFilterToDatePicker(true)}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.AccentBlue} />
                <Text style={styles.filterDateText}>{formatDisplayDate(filterToDate)}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.filterSearchBtn} onPress={fetchInquiryData}>
              <Ionicons name="search" size={18} color={COLORS.WHITE} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Inquiry List */}
        {inquiryLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.AccentBlue} />
            <Text style={styles.loaderText}>Loading expense claims...</Text>
          </View>
        ) : inquiryData.length > 0 ? (
          <FlatList
            data={inquiryData}
            keyExtractor={(item, index) => `inquiry-${item.trans_no || index}`}
            renderItem={renderInquiryItem}
            contentContainerStyle={styles.inquiryList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={60} color={COLORS.LabelColor} />
            <Text style={styles.emptyText}>No expense claims found</Text>
            <Text style={styles.emptySubText}>Try adjusting the date filter or create a new claim</Text>
          </View>
        )}

        {/* Filter Date Pickers */}
        <DateTimePickerModal
          isVisible={showFilterFromDatePicker}
          mode="date"
          onConfirm={(date) => {
            setFilterFromDate(date);
            setShowFilterFromDatePicker(false);
          }}
          onCancel={() => setShowFilterFromDatePicker(false)}
        />
        <DateTimePickerModal
          isVisible={showFilterToDatePicker}
          mode="date"
          onConfirm={(date) => {
            setFilterToDate(date);
            setShowFilterToDatePicker(false);
          }}
          onCancel={() => setShowFilterToDatePicker(false)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: '700',
  },
  newBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    padding: 4,
  },
  inquiryContainer: {
    flex: 1,
  },
  filterCard: {
    backgroundColor: COLORS.WHITE,
    margin: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterField: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 11,
    color: COLORS.LabelColor,
    marginBottom: 4,
    fontWeight: '500',
  },
  filterDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.Border,
    gap: 6,
  },
  filterDateText: {
    fontSize: 13,
    color: COLORS.TextDark,
  },
  filterSearchBtn: {
    backgroundColor: COLORS.AccentBlue,
    borderRadius: 8,
    padding: 10,
    marginTop: 16,
  },
  inquiryList: {
    padding: 16,
    paddingTop: 8,
  },
  inquiryCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  inquiryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.Border,
  },
  headerLeft: {
    flex: 1,
  },
  inquiryRef: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.AccentBlue,
    marginBottom: 2,
  },
  inquiryName: {
    fontSize: 13,
    color: COLORS.TextDark,
  },
  approvalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  approvalBadgeApproved: {
    backgroundColor: '#DCFCE7',
  },
  approvalBadgeUnapproved: {
    backgroundColor: '#FEE2E2',
  },
  approvalText: {
    fontSize: 12,
    fontWeight: '600',
  },
  approvalTextApproved: {
    color: '#16A34A',
  },
  approvalTextUnapproved: {
    color: '#DC2626',
  },
  inquiryBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inquiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inquiryDateText: {
    fontSize: 13,
    color: COLORS.LabelColor,
  },
  inquiryTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16A34A',
  },
  inquiryFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.Border,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnPdf: {
    backgroundColor: '#FEF2F2',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.AccentBlue,
  },
  actionBtnTextPdf: {
    color: '#DC2626',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.LabelColor,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TextDark,
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 13,
    color: COLORS.LabelColor,
    marginTop: 8,
    textAlign: 'center',
  },
});
