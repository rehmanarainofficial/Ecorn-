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
import { BASEURL } from '../../../../utils/BaseUrl';

const COLORS = {
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  Primary: '#1a1c22',
  Secondary: '#5a5c6a',
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
        const res = await fetch(
          `${BASEURL}leads.php`,
        );
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
    <PlatformGradient
      colors={[COLORS.Primary, COLORS.Secondary, COLORS.BLACK]}
      style={{flex: 1}}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" color={COLORS.WHITE} size={28} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>View Leads</Text>

        <TouchableOpacity
          onPress={
            () => (selectedFilter === 'All' ? null : setSelectedFilter('All')) // 👈 reset filter
          }>
          <Ionicons
            name={selectedFilter === 'All' ? 'filter' : 'close-circle'}
            color={COLORS.WHITE}
            size={24}
          />
        </TouchableOpacity>
      </View>

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
              color={selectedFilter === f.key ? COLORS.WHITE : '#ccc'}
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
          color={COLORS.WHITE}
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
    </PlatformGradient>
  );
};

export default ViewLeads;

const styles = StyleSheet.create({
  header: {
    height: 70,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.WHITE,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 12,
  },
  filterBtn: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterBtnActive: {
    backgroundColor: COLORS.Secondary,
    borderColor: COLORS.WHITE,
  },
  filterText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  kvKey: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  kvValue: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  editBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: COLORS.Secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editText: {
    marginLeft: 6,
    color: COLORS.WHITE,
    fontSize: 13,
    fontWeight: '600',
  },
});
