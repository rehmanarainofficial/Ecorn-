import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Dropdown} from 'react-native-element-dropdown';
import SimpleHeader from '../../../../components/SimpleHeader';
import {useFocusEffect, useRoute} from '@react-navigation/native';
import {BASEURL} from '../../../../utils/BaseUrl';
import {downloadFile} from '../../../../components/DownloadFile';
import {formatDate, formatDateString} from '../../../../utils/DateUtils';
import {formatNumber} from '../../../../utils/NumberUtils';

const COLORS = {
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  Primary: '#1a1c22',
  Background: '#F3F4F6',
  Border: '#E2E8F0',
  TextDark: '#1E293B',
  TextMuted: '#64748B',
};

export default function VoucherScreen({navigation}) {
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
  const [reference, setReference] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const [softwareTypes, setSoftwareTypes] = useState([]);

  const route = useRoute();

  useEffect(() => {
    fetchData();
    fetchSoftwareTypes();
  }, []);

  const fetchSoftwareTypes = async () => {
    try {
      const res = await axios.get(`${BASEURL}software_type.php`);
      if (res.data?.status === 'true' && Array.isArray(res.data?.data)) {
        const formattedData = res.data.data.map(item => ({
          label: item.type_name,
          value: item.id,
        }));
        setSoftwareTypes(formattedData);
      }
    } catch (err) {
      console.log('Software Types API Error:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (route.params?.refresh) {
        fetchData();
        navigation.setParams({refresh: false});
      }
    }, [route.params?.refresh]),
  );

  const fetchData = async (
    start = fromDate,
    end = toDate,
    refStr = reference,
    typeVal = selectedType,
  ) => {
    setLoading(true);
    try {
      const from_date = start ? start.toISOString().split('T')[0] : '';
      const to_date = end ? end.toISOString().split('T')[0] : '';

      const formData = new FormData();
      formData.append('from_date', from_date);
      formData.append('to_date', to_date);
      formData.append('ref', refStr);
      if (typeVal) {
        formData.append('type', typeVal);
      }

      const res = await axios.post(`${BASEURL}dash_upload.php`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

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
    fetchData(fromDate, toDate, reference, selectedType);
  };

  const clearFilter = () => {
    const defaultEnd = new Date();
    const defaultStart = new Date();
    defaultStart.setDate(defaultStart.getDate() - 7);

    setFromDate(defaultStart);
    setToDate(defaultEnd);
    setReference('');
    setSelectedType(null);
    fetchData(defaultStart, defaultEnd, '', null);
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
      <SimpleHeader title="Voucher" />

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

      {/* Advanced Filter Row - Reference and Type */}
      <View style={styles.advancedFilterContainer}>
        <View style={styles.searchContainer}>
          <Icon
            name="magnify"
            size={18}
            color={COLORS.TextMuted}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Reference"
            placeholderTextColor={COLORS.TextMuted}
            value={reference}
            onChangeText={setReference}
          />
        </View>

        <Dropdown
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          itemTextStyle={{color: '#000'}}
          data={softwareTypes}
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder="Type"
          value={selectedType}
          onChange={item => setSelectedType(item.value)}
        />
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
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('UploadScreen', {
                      transactionType: item.type,
                      transactionNo: item.trans_no,
                      fromScreen: 'VoucherScreen',
                    })
                  }>
                  <Icon name="paperclip" size={20} color="#10B981" />
                </TouchableOpacity>

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
  advancedFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  searchContainer: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.Border,
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: COLORS.TextDark,
    fontSize: 13,
    paddingVertical: 0,
  },
  dropdown: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.WHITE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.Border,
    paddingHorizontal: 12,
  },
  placeholderStyle: {
    fontSize: 13,
    color: COLORS.TextMuted,
  },
  selectedTextStyle: {
    fontSize: 13,
    color: COLORS.TextDark,
  },
});
