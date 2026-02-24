import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  ToastAndroid,
  Alert,
} from 'react-native';
import SimpleHeader from '../../../../components/SimpleHeader';
import {Dropdown} from 'react-native-element-dropdown';
import axios from 'axios';
import {BASEURL} from '../../../../utils/BaseUrl';
import Ionicons from 'react-native-vector-icons/Ionicons';
import GetMobileAccessData from '../../../../global/GetMobileAccessData';
import UpdateMobileAccessData from '../../../../global/UpdateMobileAccessData';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MODULES_CONFIG = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    items: [],
  },
  {
    id: 'approval',
    name: 'Approval',
    items: [
      {id: 'sales_alerts', name: 'Sales Alerts'},
      {id: 'purchase_alerts', name: 'Purchase Alerts'},
      {id: 'inventory_alerts', name: 'Inventory Alerts'},
      {id: 'accounts_alerts', name: 'Accounts Alerts'},
      {id: 'job_card_alerts', name: 'Job Card Alerts'},
    ],
  },
  {
    id: 'sales',
    name: 'Sales',
    items: [
      {id: 'add_customer', name: 'Add Customer'},
      {id: 'delivery', name: 'Delivery'},
      {id: 'track_order_status', name: 'Track Order Status'},
      {id: 'receivable', name: 'Receivable'},
      {id: 'cost_center', name: 'Cost Center'},
      {id: 'sales_transction', name: 'Sales Transaction'},
    ],
  },
  {
    id: 'purchase',
    name: 'Purchase',
    items: [
      {id: 'add_supplier', name: 'Add Supplier'},
      {id: 'grn', name: 'GRN'},
      {id: 'post_dated_cheque', name: 'Post Dated Cheque'},
      {id: 'payable', name: 'Payable'},
      {id: 'purchase_transction', name: 'Purchase Transaction'},
    ],
  },
  {
    id: 'inventory',
    name: 'Inventory',
    items: [
      {id: 'add_item', name: 'Add Item'},
      {id: 'search_item', name: 'Search Item'},
      {id: 'item_movement', name: 'Item Movement'},
      {id: 'location_transfer', name: 'Location Transfer'},
      {id: 'inventory_adjustment', name: 'Inventory Adjustment'},
      {id: 'dated_stock_sheet', name: 'Dated Stock Sheet'},
      {id: 'inventory_transction', name: 'Inventory Transaction'},
    ],
  },
  {
    id: 'hcm',
    name: 'HCM',
    items: [
      {id: 'hcm_attendence', name: 'Attendance'},
      {id: 'hcm_expense_claim', name: 'Expense Claim'},
      {id: 'hcm_dvr_inquiry', name: 'DVR Inquiry'},
      {id: 'hcm_local_purchase', name: 'Local Purchase'},
    ],
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    items: [
      {id: 'electrical_job_card', name: 'Electrical Job Card'},
      {id: 'mechnical_job_card', name: 'Mechanical Job Card'},
      {id: 'manufacturing_transction', name: 'Manufacturing Transaction'},
    ],
  },
  {
    id: 'crm',
    name: 'CRM',
    items: [
      {id: 'add_lead', name: 'Add Lead'},
      {id: 'view_lead', name: 'View Lead'},
      {id: 'shedule_meeting', name: 'Schedule Meeting'},
      {id: 'view_lead_to_order', name: 'View Lead to Order'},
    ],
  },
  {
    id: 'finance',
    name: 'Finance',
    items: [
      {id: 'view_ledger', name: 'View Ledger'},
      {id: 'local_purchase', name: 'Local Purchase'},
      {id: 'finance_transction', name: 'Finance Transaction'},
    ],
  },
  {
    id: 'attach_doc',
    name: 'Attach Docs',
    items: [
      {id: 'attach_sales_order', name: 'Attach Sales Order'},
      {id: 'attach_purchase_order', name: 'Attach Purchase Order'},
      {id: 'attach_voucher', name: 'Attach Voucher'},
    ],
  },
];

const SecurityRule = () => {
  const [roleId, setRoleId] = useState(null);
  const [isFocus, setIsFocus] = useState(false);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Access data state (raw '0' or '1' from API)
  const [accessData, setAccessData] = useState({});
  const [expandedModules, setExpandedModules] = useState({});

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${BASEURL}security_role.php`);
      if (response.data.status === 'true') {
        setRoles(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccessData = async rId => {
    setFetchLoading(true);
    try {
      const res = await GetMobileAccessData(rId);
      if (res.status === 'true' && res.data && res.data.length > 0) {
        setAccessData(res.data[0]);
      } else {
        // Initialize with default values if no data exists
        const defaultAccess = {};
        MODULES_CONFIG.forEach(module => {
          defaultAccess[module.id] = '1'; // Default: Unchecked (1)
          module.items.forEach(item => {
            defaultAccess[item.id] = '1';
          });
        });
        setAccessData(defaultAccess);
      }
    } catch (error) {
      console.error('Error fetching access data:', error);
      Alert.alert('Error', 'Failed to fetch access data');
    } finally {
      setFetchLoading(false);
    }
  };

  const toggleModuleExpand = moduleId => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const isChecked = key => {
    // Logic: 0 is checked (tick), 1 is unchecked
    return accessData[key] === '0';
  };

  const toggleValue = key => {
    const currentValue = accessData[key];
    const newValue = currentValue === '0' ? '1' : '0';
    setAccessData(prev => ({
      ...prev,
      [key]: newValue,
    }));
  };

  const toggleModuleSelection = module => {
    const currentValue = accessData[module.id];
    const newValue = currentValue === '0' ? '1' : '0';

    const updatedAccess = {...accessData};
    updatedAccess[module.id] = newValue;

    // Also update all items under this module
    module.items.forEach(item => {
      updatedAccess[item.id] = newValue;
    });

    setAccessData(updatedAccess);
  };

  const handleSave = async () => {
    if (!roleId) return;

    setSaveLoading(true);
    try {
      const formData = new FormData();
      formData.append('role_id', roleId);

      // Append all permissions from config
      MODULES_CONFIG.forEach(module => {
        formData.append(module.id, accessData[module.id] || '1');
        module.items.forEach(item => {
          formData.append(item.id, accessData[item.id] || '1');
        });
      });

      const res = await UpdateMobileAccessData(formData);
      if (res.status === 'true' || res.status === true) {
        if (Platform.OS === 'android') {
          ToastAndroid.show('Rules updated successfully', ToastAndroid.SHORT);
        } else {
          Alert.alert('Success', 'Rules updated successfully');
        }
      } else {
        Alert.alert('Error', res.message || 'Failed to update rules');
      }
    } catch (error) {
      console.error('Error saving rules:', error);
      Alert.alert('Error', 'An error occurred while saving rules');
    } finally {
      setSaveLoading(false);
    }
  };

  const dropdownData = roles.map(item => ({
    label: item.role,
    value: item.id,
  }));

  return (
    <View style={styles.container}>
      <SimpleHeader title="Security Rule" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.dropdownSection}>
          <Text style={styles.label}>Select Role</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#1a1c22" />
          ) : (
            <Dropdown
              style={[styles.dropdown, isFocus && {borderColor: '#1a1c22'}]}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              inputSearchStyle={styles.inputSearchStyle}
              iconStyle={styles.iconStyle}
              data={dropdownData}
              search
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder={!isFocus ? 'Select Role' : '...'}
              searchPlaceholder="Search..."
              value={roleId}
              onFocus={() => setIsFocus(true)}
              onBlur={() => setIsFocus(false)}
              onChange={item => {
                setRoleId(item.value);
                setIsFocus(false);
                fetchAccessData(item.value);
              }}
            />
          )}
        </View>

        {fetchLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#1a1c22" />
            <Text style={styles.loaderText}>Fetching Access Data...</Text>
          </View>
        ) : (
          roleId && (
            <View style={styles.modulesContainer}>
              <Text style={styles.sectionHeader}>Module Access Rules</Text>
              {MODULES_CONFIG.map(module => (
                <View key={module.id} style={styles.moduleWrapper}>
                  <View style={styles.moduleRow}>
                    <TouchableOpacity
                      style={styles.checkboxContainer}
                      onPress={() => toggleModuleSelection(module)}>
                      <Ionicons
                        name={
                          isChecked(module.id) ? 'checkbox' : 'square-outline'
                        }
                        size={24}
                        color={isChecked(module.id) ? '#1a1c22' : '#64748B'}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.moduleTextContainer}
                      onPress={() => toggleModuleExpand(module.id)}>
                      <Text style={styles.moduleName}>{module.name}</Text>
                      <Ionicons
                        name={
                          expandedModules[module.id]
                            ? 'chevron-up'
                            : 'chevron-down'
                        }
                        size={20}
                        color="#64748B"
                      />
                    </TouchableOpacity>
                  </View>

                  {expandedModules[module.id] && module.items.length > 0 && (
                    <View style={styles.itemsContainer}>
                      {module.items.map(item => (
                        <View key={item.id} style={styles.itemRow}>
                          <TouchableOpacity
                            style={styles.checkboxContainer}
                            onPress={() => toggleValue(item.id)}>
                            <Ionicons
                              name={
                                isChecked(item.id)
                                  ? 'checkbox'
                                  : 'square-outline'
                              }
                              size={22}
                              color={isChecked(item.id) ? '#1a1c22' : '#64748B'}
                            />
                          </TouchableOpacity>
                          <Text style={styles.itemName}>{item.name}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )
        )}

        {(roleId && !fetchLoading && (
          <TouchableOpacity
            style={[styles.saveBtn, saveLoading && styles.saveBtnDisabled]}
            disabled={saveLoading}
            onPress={handleSave}>
            {saveLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveBtnText}>Save Rules</Text>
            )}
          </TouchableOpacity>
        )) ||
          (!roleId && (
            <View style={styles.emptyState}>
              <Ionicons
                name="shield-checkmark-outline"
                size={60}
                color="#CBD5E1"
              />
              <Text style={styles.emptyStateText}>
                Select a role to manage security rules
              </Text>
            </View>
          ))}
      </ScrollView>
    </View>
  );
};

export default SecurityRule;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  dropdownSection: {
    padding: 20,
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    color: '#1E293B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdown: {
    height: 50,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#F8FAFC',
  },
  placeholderStyle: {
    fontSize: 16,
    color: '#64748B',
  },
  selectedTextStyle: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  loaderContainer: {
    marginTop: 50,
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 16,
  },
  modulesContainer: {
    marginTop: 20,
    marginHorizontal: 15,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 15,
  },
  moduleWrapper: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
  },
  moduleTextContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 10,
  },
  moduleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  checkboxContainer: {
    padding: 2,
  },
  itemsContainer: {
    paddingLeft: 45,
    paddingBottom: 15,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemName: {
    fontSize: 15,
    color: '#334155',
    marginLeft: 10,
  },
  saveBtn: {
    backgroundColor: '#1a1c22',
    marginHorizontal: 15,
    marginTop: 30,
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  saveBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  emptyState: {
    marginTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    marginTop: 20,
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
  },
});
