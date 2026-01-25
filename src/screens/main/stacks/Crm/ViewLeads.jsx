import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PlatformGradient from '../../../../components/PlatformGradient';
import {BASEURL} from '../../../../utils/BaseUrl';
import SimpleHeader from '../../../../components/SimpleHeader';

const COLORS = {
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  Primary: '#1a1c22',
  Secondary: '#5a5c6a',
  Background: '#f3f5f6',
  Border: '#E2E8F0',
  TextDark: '#1E293B',
  TextMuted: '#64748B',
};

const FILTERS = [
  {key: 'Active', icon: 'checkmark-circle'},
  {key: 'PO Received', icon: 'document-text'},
  {key: 'On-Hold', icon: 'pause-circle'},
  {key: 'Enquiry Cancelled', icon: 'close-circle'},
];
// 👇 Date format helper
const formatDate = dateStr => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr; // agar backend ka format different ho
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2); // last 2 digits
  return `${day}/${month}/${year}`;
};

const ViewLeads = ({navigation}) => {
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // GET API call
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await fetch(`${BASEURL}leads.php`);
        const json = await res.json();
        if (json.status === 'true') {
          setLeads(json.data);
        } else {
          console.log('API Error:', json);
        }
      } catch (err) {
        console.log('Fetch Error:', err);
      }
      setLoading(false);
    };
    fetchLeads();
  }, []);

  // status mapping
  const STATUS_MAP = {
    0: 'Active',
    1: 'PO Received',
    2: 'On-Hold',
    3: 'Enquiry Cancelled',
  };
  // filter apply
  const filteredLeads =
    selectedFilter === 'All'
      ? leads
      : leads.filter(l => STATUS_MAP[l.po_status] === selectedFilter);

  const renderCard = ({item}) => (
    <View style={styles.card}>
      <View style={styles.kvRow}>
        <Text style={styles.kvKey}>Date:</Text>
        <Text style={styles.kvValue}>
          {formatDate(item.project_receiving_date)}
        </Text>
      </View>

      <View style={styles.kvRow}>
        <Text style={styles.kvKey}>Reference No:</Text>
        <Text style={styles.kvValue}>{item.reference_no}</Text>
      </View>
      <View style={styles.kvRow}>
        <Text style={styles.kvKey}>Project:</Text>
        <Text style={styles.kvValue}>{item.project_name}</Text>
      </View>
      <View style={styles.kvRow}>
        <Text style={styles.kvKey}>Company:</Text>
        <Text style={styles.kvValue}>{item.company_name}</Text>
      </View>
      <View style={styles.kvRow}>
        <Text style={styles.kvKey}>Enclosure:</Text>
        <Text style={styles.kvValue}>{item.enclosure_name}</Text>
      </View>
      <View style={styles.kvRow}>
        <Text style={styles.kvKey}>Sales Person:</Text>
        <Text style={styles.kvValue}>{item.salesman_name}</Text>
      </View>
      <View style={styles.kvRow}>
        <Text style={styles.kvKey}>Estimator:</Text>
        <Text style={styles.kvValue}>{item.estimator_name}</Text>
      </View>

      {/* 👇 New Row */}
      <View style={styles.kvRow}>
        <Text style={styles.kvKey}>Latest Price:</Text>
        <Text style={styles.kvValue}>
          {item.latest_revision_price
            ? `PKR ${item.latest_revision_price}`
            : '-'}
        </Text>
      </View>

      {/* Edit button */}
      <TouchableOpacity
        style={styles.editBtn}
        onPress={() => navigation.navigate('AddLeadScreen', {id: item.id})}>
        <Ionicons name="create-outline" color={COLORS.WHITE} size={18} />
        <Text style={styles.editText}>Edit</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <SimpleHeader title="View Leads" />

      {/* Filters */}
      <View style={styles.filterGrid}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterBtn,
              selectedFilter === f.key && styles.filterBtnActive,
            ]}
            onPress={() => setSelectedFilter(f.key)}>
            <Ionicons
              name={f.icon}
              size={18}
              color={selectedFilter === f.key ? COLORS.WHITE : COLORS.Secondary}
              style={{marginRight: 6}}
            />
            <Text
              style={[
                styles.filterText,
                selectedFilter === f.key && {color: COLORS.WHITE},
              ]}>
              {f.key}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Loader or Cards */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.Primary}
          style={{marginTop: 30}}
        />
      ) : (
        <FlatList
          data={filteredLeads}
          keyExtractor={item => item.id}
          renderItem={renderCard}
          contentContainerStyle={{padding: 16}}
        />
      )}
    </View>
  );
};

export default ViewLeads;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.Background,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  filterBtn: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.WHITE,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.Border,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  filterBtnActive: {
    backgroundColor: COLORS.Primary,
    borderColor: COLORS.Primary,
  },
  filterText: {
    color: COLORS.TextMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.Border,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  kvKey: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.TextMuted,
  },
  kvValue: {
    fontSize: 13,
    color: COLORS.TextDark,
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
    fontWeight: '500',
  },
  editBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: COLORS.Primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    elevation: 2,
  },
  editText: {
    marginLeft: 6,
    color: COLORS.WHITE,
    fontSize: 13,
    fontWeight: '700',
  },
});
