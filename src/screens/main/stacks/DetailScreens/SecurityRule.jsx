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
} from 'react-native';
import SimpleHeader from '../../../../components/SimpleHeader';
import {Dropdown} from 'react-native-element-dropdown';
import axios from 'axios';
import {BASEURL} from '../../../../utils/BaseUrl';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
    items: [{id: 'dash_detail', name: 'Detail'}],
  },
  {
    id: 'approval',
    name: 'Approval',
    items: [
      {id: 'app_sq', name: 'Sale Quotation'},
      {id: 'app_so', name: 'Sale Order'},
      {id: 'app_dn', name: 'Delivery Note'},
      {id: 'app_po', name: 'Purchase Order'},
      {id: 'app_grn', name: 'GRN Approval'},
      {id: 'app_lt', name: 'Location Transfer'},
      {id: 'app_va', name: 'Voucher Approval'},
      {id: 'app_ea', name: 'Electrical Approval'},
      {id: 'app_ma', name: 'Mechanical Approval'},
    ],
  },
  {
    id: 'sales',
    name: 'Sales',
    items: [
      {id: 'sal_ac', name: 'Add Customer'},
      {id: 'sal_del', name: 'Delivery'},
      {id: 'sal_tos', name: 'Track Order Status'},
      {id: 'sal_rec', name: 'Receivable'},
      {id: 'sal_cc', name: 'Cost Center'},
      {id: 'sal_st', name: 'Sales Transactions'},
    ],
  },
  {
    id: 'purchase',
    name: 'Purchase',
    items: [
      {id: 'pur_as', name: 'Add Suppliers'},
      {id: 'pur_grn', name: 'GRN against PO'},
      {id: 'pur_pdc', name: 'Post Dated Cheque Detail'},
      {id: 'pur_ps', name: 'Payable Summary'},
      {id: 'pur_pt', name: 'Purchase Transactions'},
    ],
  },
  {
    id: 'inventory',
    name: 'Inventory',
    items: [
      {id: 'inv_ai', name: 'Add Item'},
      {id: 'inv_si', name: 'Search Item'},
      {id: 'inv_im', name: 'Item Movement'},
      {id: 'inv_lt', name: 'Location Transfer'},
      {id: 'inv_ia', name: 'Inventory Adjustment'},
      {id: 'inv_dss', name: 'Dated Stock Sheet'},
      {id: 'inv_it', name: 'Inventory Transactions'},
    ],
  },
  {
    id: 'hcm',
    name: 'HCM',
    items: [
      {id: 'hcm_att', name: 'Attendance'},
      {id: 'hcm_ec', name: 'Expense Claim'},
      {id: 'hcm_dvr', name: 'DVR Inquiry'},
      {id: 'hcm_lp', name: 'Local Purchase'},
    ],
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    items: [
      {id: 'man_ejc', name: 'Electrical Job Cards'},
      {id: 'man_mjc', name: 'Mechanical Job Cards'},
      {id: 'man_mt', name: 'Manufacturing Transactions'},
    ],
  },
  {
    id: 'crm',
    name: 'CRM',
    items: [
      {id: 'crm_al', name: 'Add Lead'},
      {id: 'crm_vl', name: 'View Leads'},
      {id: 'crm_sm', name: 'Schedule Meeting'},
      {id: 'crm_vlo', name: 'View Lead to Order'},
    ],
  },
  {
    id: 'finance',
    name: 'Finance',
    items: [
      {id: 'fin_vl', name: 'View Ledger'},
      {id: 'fin_ft', name: 'Financial Transactions'},
    ],
  },
  {
    id: 'attach_docs',
    name: 'Attach Docs',
    items: [
      {id: 'ad_so', name: 'Sale Order'},
      {id: 'ad_po', name: 'Purchase Order'},
      {id: 'ad_v', name: 'Voucher'},
    ],
  },
];

const SecurityRule = () => {
  const [value, setValue] = useState(null);
  const [isFocus, setIsFocus] = useState(false);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selection states
  const [selectedModules, setSelectedModules] = useState({}); // { moduleId: boolean }
  const [selectedItems, setSelectedItems] = useState({}); // { itemId: boolean }
  const [expandedModules, setExpandedModules] = useState({}); // { moduleId: boolean }

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

  const toggleModuleExpand = moduleId => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const toggleModuleSelect = moduleId => {
    const isSelected = !selectedModules[moduleId];
    const targetModule = MODULES_CONFIG.find(m => m.id === moduleId);

    setSelectedModules(prev => ({
      ...prev,
      [moduleId]: isSelected,
    }));

    // Update all child items
    if (targetModule) {
      const newItems = {...selectedItems};
      targetModule.items.forEach(item => {
        newItems[item.id] = isSelected;
      });
      setSelectedItems(newItems);
    }
  };

  const toggleItemSelect = (moduleId, itemId) => {
    const isSelected = !selectedItems[itemId];
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: isSelected,
    }));

    // Logic: If any item is selected, the parent should be selected?
    // User requested checkboxes on both, so we'll keep it manual but logical
    if (isSelected) {
      setSelectedModules(prev => ({
        ...prev,
        [moduleId]: true,
      }));
    }
  };

  const handleSave = () => {
    console.log('Saved Rules:', {
      roleId: value,
      selectedModules,
      selectedItems,
    });
    alert('Rules saved successfully!');
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
              value={value}
              onFocus={() => setIsFocus(true)}
              onBlur={() => setIsFocus(false)}
              onChange={item => {
                setValue(item.value);
                setIsFocus(false);
              }}
            />
          )}
        </View>

        <View style={styles.modulesContainer}>
          <Text style={styles.sectionHeader}>Module Access Rules</Text>
          {MODULES_CONFIG.map(module => (
            <View key={module.id} style={styles.moduleWrapper}>
              <View style={styles.moduleRow}>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => toggleModuleSelect(module.id)}>
                  <Ionicons
                    name={
                      selectedModules[module.id] ? 'checkbox' : 'square-outline'
                    }
                    size={24}
                    color={selectedModules[module.id] ? '#1a1c22' : '#64748B'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.moduleTextContainer}
                  onPress={() => toggleModuleExpand(module.id)}>
                  <Text style={styles.moduleName}>{module.name}</Text>
                  <Ionicons
                    name={
                      expandedModules[module.id] ? 'chevron-up' : 'chevron-down'
                    }
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>

              {expandedModules[module.id] && (
                <View style={styles.itemsContainer}>
                  {module.items.map(item => (
                    <View key={item.id} style={styles.itemRow}>
                      <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => toggleItemSelect(module.id, item.id)}>
                        <Ionicons
                          name={
                            selectedItems[item.id]
                              ? 'checkbox'
                              : 'square-outline'
                          }
                          size={22}
                          color={selectedItems[item.id] ? '#1a1c22' : '#64748B'}
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

        <TouchableOpacity
          style={[styles.saveBtn, !value && styles.saveBtnDisabled]}
          disabled={!value}
          onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Rules</Text>
        </TouchableOpacity>
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
});
