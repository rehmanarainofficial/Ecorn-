import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import SimpleHeader from '../../../../components/SimpleHeader';
import {useFocusEffect, useRoute} from '@react-navigation/native';
import {BASEURL} from '../../../../utils/BaseUrl';
import {formatDate, formatDateString} from '../../../../utils/DateUtils';
import {formatNumber} from '../../../../utils/NumberUtils';
import {downloadFile} from '../../../../components/DownloadFile';

const COLORS = {
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  Primary: '#1a1c22',
  Background: '#F3F4F6',
  Border: '#E2E8F0',
  TextDark: '#1E293B',
  TextMuted: '#64748B',
};

export default function PurchaseOrder({navigation}) {
  const [allData, setAllData] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Default: 1 week range
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  });
  const [toDate, setToDate] = useState(new Date());

  const [showPicker, setShowPicker] = useState({visible: false, type: null});
  const route = useRoute();

  useEffect(() => {
    fetchData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.refresh) {
        fetchData();
        navigation.setParams({refresh: false});
      }
    }, [route.params?.refresh]),
  );

  const fetchData = async (start = fromDate, end = toDate) => {
    setLoading(true);
    try {
      const from_date = start ? start.toISOString().split('T')[0] : '';
      const to_date = end ? end.toISOString().split('T')[0] : '';

      const formData = new FormData();
      formData.append('from_date', from_date);
      formData.append('to_date', to_date);

      const res = await axios.post(
        `${BASEURL}dash_upload_purchase.php`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      let result = res.data?.data_cust_age || [];
      setAllData(result);

      if (result.length === 0) {
        setData([]);
        setLoading(false);
        return;
      }

      setData(result);
    } catch (error) {
      console.log('Error fetching data:', error);
    }
    setLoading(false);
  };

  const applyFilter = () => {
    fetchData(fromDate, toDate);
  };

  const clearFilter = () => {
    const defaultEnd = new Date();
    const defaultStart = new Date();
    defaultStart.setDate(defaultStart.getDate() - 7);

    setFromDate(defaultStart);
    setToDate(defaultEnd);
    fetchData(defaultStart, defaultEnd);
  };

  const normalizeDate = date => {
    if (!date) return null;
    return new Date(date).toISOString().split('T')[0];
  };

  const handleDownload = async (trans_no, type) => {
    if (downloading) return;

    setDownloading(true);
    try {
      await downloadFile(trans_no, type);
    } catch (error) {
      console.log('Download handler error:', error);
    }
    setDownloading(false);
  };

  return (
    <View style={styles.container}>
      <SimpleHeader title="Purchase Order" />

      {/* Filter Section - Single Row */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowPicker({visible: true, type: 'from'})}>
          <Icon name="calendar" size={16} color={COLORS.TextMuted} />
          <Text style={styles.dateButtonText}>
            {fromDate ? formatDate(fromDate) : 'From'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowPicker({visible: true, type: 'to'})}>
          <Icon name="calendar" size={16} color={COLORS.TextMuted} />
          <Text style={styles.dateButtonText}>
            {toDate ? formatDate(toDate) : 'To'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={applyFilter} style={styles.iconBtn}>
          <Icon name="magnify" size={20} color={COLORS.WHITE} />
        </TouchableOpacity>

        <TouchableOpacity onPress={clearFilter} style={styles.clearBtn}>
          <Icon name="close" size={20} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      {showPicker.visible && (
        <DateTimePicker
          value={
            showPicker.type === 'from'
              ? fromDate || new Date()
              : toDate || new Date()
          }
          mode="date"
          display="default"
          onChange={(e, date) => {
            setShowPicker({visible: false, type: null});
            if (date) {
              if (showPicker.type === 'from') setFromDate(date);
              if (showPicker.type === 'to') setToDate(date);
            }
          }}
        />
      )}

      {loading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.Primary}
          style={{marginTop: 20}}
        />
      ) : data.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon
            name="file-document-outline"
            size={48}
            color={COLORS.TextMuted}
          />
          <Text style={styles.emptyText}>No Data Found</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, index) => index.toString()}
          stickyHeaderIndices={[0]}
          ListHeaderComponent={
            <View style={[styles.row, styles.headerRow]}>
              <Text style={[styles.headerCell, {flex: 1}]}>Ref</Text>
              <Text style={[styles.headerCell, {flex: 1.5}]}>Date</Text>
              <Text style={[styles.headerCell, {flex: 1.5}]}>Amount</Text>
              <Text style={[styles.headerCell, {flex: 1}]}>Action</Text>
            </View>
          }
          renderItem={({item}) => (
            <View style={styles.row}>
              <Text style={[styles.cell, {flex: 1}]}>
                {item.reference?.slice(0, 6) + '..' || 'N/A'}
              </Text>
              <Text style={[styles.cell, {flex: 1.5}]}>
                {formatDateString(item.tran_date)}
              </Text>
              <Text style={[styles.cell, {flex: 1.5}]}>
                {formatNumber(item.amount)}
              </Text>
              <View
                style={[
                  styles.cell,
                  {
                    flex: 1,
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                  },
                ]}>
                {/* Upload Icon */}
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('UploadScreen', {
                      transactionType: item.type,
                      transactionNo: item.trans_no,
                      fromScreen: 'PurchaseOrder',
                    })
                  }>
                  <Icon name="paperclip" size={20} color="#10B981" />
                </TouchableOpacity>

                {/* View PDF Icon */}
                <TouchableOpacity
                  disabled={!item.upload_status}
                  onPress={() =>
                    navigation.navigate('PDFViewerScreen', {
                      type: item.type,
                      trans_no: item.trans_no,
                    })
                  }>
                  <Icon
                    name="eye"
                    size={20}
                    color={item.upload_status ? '#3B82F6' : '#CBD5E1'}
                  />
                </TouchableOpacity>

                {/* Download Icon */}
                <TouchableOpacity
                  disabled={!item.upload_status || downloading}
                  onPress={() => handleDownload(item.trans_no, item.type)}>
                  {downloading ? (
                    <ActivityIndicator size="small" color="#F59E0B" />
                  ) : (
                    <Icon
                      name="download"
                      size={20}
                      color={item.upload_status ? '#F59E0B' : '#CBD5E1'}
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={{paddingBottom: 50}}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.Background,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.Border,
    gap: 6,
  },
  dateButtonText: {
    color: COLORS.TextDark,
    fontSize: 13,
    fontWeight: '500',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.Primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.Border,
  },
  headerRow: {
    backgroundColor: COLORS.Primary,
  },
  cell: {
    color: COLORS.TextDark,
    fontSize: 13,
  },
  headerCell: {
    color: COLORS.WHITE,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    color: COLORS.TextMuted,
    fontSize: 16,
    fontWeight: '500',
  },
});
