import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import PlatformGradient from '../../../../components/PlatformGradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Dropdown, MultiSelect} from 'react-native-element-dropdown';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import {BASEURL} from '../../../../utils/BaseUrl';
const COLORS = {
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  Primary: '#1a1c22',
  Secondary: '#5a5c6a',
  Glass: 'rgba(255,255,255,0.08)',
};

// --- Static Dropdown Options ---
const projectTypeOptions = [
  {label: 'In-hand', value: '0'},
  {label: 'Tender', value: '1'},
];

const poStatusOptions = [
  {label: 'Active', value: '0'},
  {label: 'PO Received', value: '1'},
  {label: 'On-Hold', value: '2'},
  {label: 'Enquiry Cancelled', value: '3'},
];

const AddLeadScreen = ({navigation, route}) => {
  const {id} = route.params || {};

  const [form, setForm] = useState({
    id: id || 0,
    project_receiving_date: '',
    job_type_id: '',
    revision_no: '',
    reference_no: '',
    project_name: '',
    company_name: '',
    component_id: '',
    enclosure_id: '',
    sales_person_id: '',
    project_type: '',
    purch_order_details: [], // [{estimator_id: 1}, {estimator_id: 2}]
    project_sending_date: '',
    revision_date: '',
    latest_revision_price: '',
    po_status: '',
    number_of_days: '',
  });

  const [loading, setLoading] = useState(false);
  const [dropdownData, setDropdownData] = useState({
    jobTypes: [],
    components: [],
    enclosures: [],
    salesPersons: [],
    estimators: [],
  });
  const [showPicker, setShowPicker] = useState({show: false, key: null});

  // --- Fetch Dropdown Data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const jobTypes = await fetch(`${BASEURL}lead_job_type.php`).then(res =>
          res.json(),
        );

        const components = await fetch(`${BASEURL}lead_components.php`).then(
          res => res.json(),
        );

        const enclosures = await fetch(`${BASEURL}lead_enclosure.php`).then(
          res => res.json(),
        );

        const salesPersons = await fetch(`${BASEURL}salesman.php`).then(res =>
          res.json(),
        );

        const estimators = await fetch(`${BASEURL}lead_estimator.php`).then(
          res => res.json(),
        );

        setDropdownData({
          jobTypes: jobTypes.data || [],
          components: components.data || [],
          enclosures: enclosures.data || [],
          salesPersons: salesPersons.data || [],
          estimators: estimators.data || [],
        });
      } catch (err) {
        console.log('API Error:', err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (form.id > 0) {
      const fetchLead = async () => {
        try {
          const formData = new FormData();
          formData.append('id', form.id);

          const response = await fetch(`${BASEURL}lead_edit.php`, {
            method: 'POST',
            body: formData,
          });

          const result = await response.json();

          if (result.status === 'true') {
            const header = result.header[0];
            const estimators = result.data || [];

            setForm(prev => ({
              ...prev,
              ...header,
              purch_order_details: estimators,
            }));
          }
        } catch (err) {
          console.log('Edit API error:', err);
        }
      };
      fetchLead();
    }
  }, [form.id]);

  // --- Update Form Fields ---
  const updateField = (key, value) => {
    setForm(prev => ({...prev, [key]: value}));

    // Auto generate Reference No
    if (key === 'job_type_id' || key === 'revision_no') {
      generateReferenceNo(
        key === 'job_type_id' ? value : form.job_type_id,
        key === 'revision_no' ? value : form.revision_no,
      );
    }
  };

  // --- Auto Generate Reference No ---
  const generateReferenceNo = (jobTypeId, revisionNo) => {
    let prefix = 'PK';
    if (jobTypeId == '1') prefix = 'PK';
    if (jobTypeId == '9') prefix = 'PKm';
    if (jobTypeId == '3') prefix = 'SO';

    const date = new Date();

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');

    const counter = `00${day}`;

    const rev = revisionNo ? revisionNo.toString().padStart(2, '0') : '00';

    const ref = `${prefix}${counter}-${month}-R${rev}`;
    setForm(prev => ({...prev, reference_no: ref}));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formData = new FormData();

      Object.keys(form).forEach(key => {
        if (key === 'purch_order_details') {
          formData.append(key, JSON.stringify(form[key]));
        } else {
          formData.append(key, form[key] || 0);
        }
      });

      formData.append('id', form.id || 0);

      const url = `${BASEURL}lead_post.php`;

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      const raw = await response.text();
      console.log('Submit Raw Response:', raw);

      let result;
      try {
        result = JSON.parse(raw);
      } catch (e) {
        result = {status: true, message: raw};
      }

      if (result.status === true || result.status === 'true') {
        Toast.show({
          type: 'success',
          text1:
            form.id > 0
              ? 'Lead updated successfully!'
              : 'Lead added successfully!',
        });

        setForm({
          id: 0,
          project_receiving_date: '',
          job_type_id: '',
          revision_no: '',
          reference_no: '',
          project_name: '',
          company_name: '',
          component_id: '',
          enclosure_id: '',
          sales_person_id: '',
          project_type: '',
          purch_order_details: [],
          project_sending_date: '',
          revision_date: '',
          latest_revision_price: '',
          po_status: '',
          number_of_days: '',
        });

        navigation.navigate('ViewLeads');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error submitting form',
          text2: JSON.stringify(result),
        });
      }
    } catch (err) {
      console.log('Submit Error:', err);
      Toast.show({
        type: 'error',
        text1: 'Error submitting form',
      });
    }
    setLoading(false);
  };

  // --- Render Date Picker ---
  const renderDateField = (label, key) => (
    <TouchableOpacity
      style={styles.input}
      onPress={() => setShowPicker({show: true, key})}>
      <Text style={styles.dateText}>
        {form[key] ? new Date(form[key]).toLocaleDateString() : label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <PlatformGradient
      colors={[COLORS.Primary, COLORS.Secondary, COLORS.BLACK]}
      style={{flex: 1}}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color={COLORS.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {form.id > 0 ? 'Update Lead' : 'Add Lead'}
        </Text>
        <View style={{width: 26}} />
      </View>

      <ScrollView contentContainerStyle={{padding: 16}}>
        {/* Project Receiving Date */}
        {renderDateField('Project Receiving Date', 'project_receiving_date')}

        <Dropdown
          style={styles.dropdown}
          data={dropdownData.jobTypes.map(j => ({
            label: j.description,
            value: j.id,
          }))}
          labelField="label"
          valueField="value"
          placeholder="Job Type"
          placeholderStyle={{color: 'rgba(255,255,255,0.6)'}} // Placeholder white-ish
          selectedTextStyle={{color: COLORS.WHITE}} // Selected value white
          itemTextStyle={{color: COLORS.BLACK}} // Dropdown list black
          value={form.job_type_id}
          onChange={item => updateField('job_type_id', item.value)}
        />

        {/* Revision No */}
        <TextInput
          style={styles.input}
          placeholder="Revision No"
          placeholderTextColor="rgba(255,255,255,0.6)"
          keyboardType="numeric"
          value={form.revision_no?.toString()}
          onChangeText={t => updateField('revision_no', t)}
        />

        {/* Reference No */}
        <TextInput
          style={styles.input}
          placeholder="Reference No"
          placeholderTextColor="rgba(255,255,255,0.6)"
          value={form.reference_no}
          editable={false}
        />

        {/* Project Name */}
        <TextInput
          style={styles.input}
          placeholder="Project Name"
          placeholderTextColor="rgba(255,255,255,0.6)"
          value={form.project_name}
          onChangeText={t => updateField('project_name', t)}
        />

        {/* Company Name */}
        <TextInput
          style={styles.input}
          placeholder="Company Name"
          placeholderTextColor="rgba(255,255,255,0.6)"
          value={form.company_name}
          onChangeText={t => updateField('company_name', t)}
        />

        {/* Components */}
        <Dropdown
          style={styles.dropdown}
          data={dropdownData.components.map(c => ({
            label: c.description,
            value: c.id,
          }))}
          labelField="label"
          valueField="value"
          placeholder="Components"
          placeholderStyle={{color: 'rgba(255,255,255,0.6)'}} // Placeholder white-ish
          selectedTextStyle={{color: COLORS.WHITE}} // Selected value white
          itemTextStyle={{color: COLORS.BLACK}} // Dropdown list black
          value={form.component_id}
          onChange={item => updateField('component_id', item.value)}
        />

        {/* Enclosure */}
        <Dropdown
          style={styles.dropdown}
          data={dropdownData.enclosures.map(e => ({
            label: e.description,
            value: e.id,
          }))}
          labelField="label"
          valueField="value"
          placeholder="Enclosure"
          placeholderStyle={{color: 'rgba(255,255,255,0.6)'}} // Placeholder white-ish
          selectedTextStyle={{color: COLORS.WHITE}} // Selected value white
          itemTextStyle={{color: COLORS.BLACK}} // Dropdown list black
          value={form.enclosure_id}
          onChange={item => updateField('enclosure_id', item.value)}
        />

        {/* Sales Person */}
        <Dropdown
          style={styles.dropdown}
          data={dropdownData.salesPersons.map(s => ({
            label: s.salesman_name,
            value: s.salesman_code,
          }))}
          labelField="label"
          valueField="value"
          placeholder="Sales Person"
          placeholderStyle={{color: 'rgba(255,255,255,0.6)'}} // Placeholder white-ish
          selectedTextStyle={{color: COLORS.WHITE}} // Selected value white
          itemTextStyle={{color: COLORS.BLACK}} // Dropdown list black
          value={form.sales_person_id}
          onChange={item => updateField('sales_person_id', item.value)}
        />

        {/* Project Type */}
        <Dropdown
          style={styles.dropdown}
          data={projectTypeOptions}
          labelField="label"
          valueField="value"
          placeholder="Project Type"
          placeholderStyle={{color: 'rgba(255,255,255,0.6)'}} // Placeholder white-ish
          selectedTextStyle={{color: COLORS.WHITE}} // Selected value white
          itemTextStyle={{color: COLORS.BLACK}} // Dropdown list black
          value={form.project_type}
          onChange={item => updateField('project_type', item.value)}
        />

        <MultiSelect
          style={styles.dropdown}
          data={dropdownData.estimators.map(e => ({
            label: e.description,
            value: e.id,
          }))}
          labelField="label"
          valueField="value"
          placeholder="Select Estimator"
          value={form.purch_order_details.map(e => e.estimator_id)}
          onChange={items => {
            const mapped = items.map(i => ({estimator_id: i}));
            updateField('purch_order_details', mapped);
          }}
          placeholderStyle={{color: 'rgba(255,255,255,0.6)'}}
          selectedTextStyle={{color: COLORS.WHITE}}
          itemTextStyle={{color: COLORS.BLACK}} // Dropdown list black
          renderSelectedItem={(item, unSelect) => (
            <View style={styles.selectedStyle}>
              <Text style={styles.textSelectedStyle}>{item.label}</Text>
              <TouchableOpacity onPress={() => unSelect(item)}>
                <Ionicons name="close" size={18} color="white" />
              </TouchableOpacity>
            </View>
          )}
          selectedStyle={styles.selectedContainer}
        />

        {/* Project Sending Date */}
        {renderDateField('Project Sending Date', 'project_sending_date')}

        {/* Revision Date */}
        {renderDateField('Revision Date', 'revision_date')}

        {/* Latest Revision Price */}
        <TextInput
          style={styles.input}
          placeholder="Latest Revision Price"
          placeholderTextColor="rgba(255,255,255,0.6)"
          keyboardType="numeric"
          value={form.latest_revision_price?.toString()}
          onChangeText={t => updateField('latest_revision_price', t)}
        />

        {/* PO Status */}
        <Dropdown
          style={styles.dropdown}
          data={poStatusOptions}
          labelField="label"
          valueField="value"
          placeholder="PO Status"
          placeholderStyle={{color: 'rgba(255,255,255,0.6)'}} // Placeholder white-ish
          selectedTextStyle={{color: COLORS.WHITE}} // Selected value white
          itemTextStyle={{color: COLORS.BLACK}} // Dropdown list black
          value={form.po_status}
          onChange={item => updateField('po_status', item.value)}
        />

        {/* Number of Days */}
        <TextInput
          style={styles.input}
          placeholder="Number of Days"
          placeholderTextColor="rgba(255,255,255,0.6)"
          keyboardType="numeric"
          value={form.number_of_days?.toString()}
          onChangeText={t => updateField('number_of_days', t)}
        />

        {/* Submit Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={loading}>
          <PlatformGradient
            colors={[COLORS.Secondary, '#7a7c8a', COLORS.Primary]}
            style={styles.submitGradient}>
            {loading ? (
              <ActivityIndicator color={COLORS.WHITE} />
            ) : (
              <Text style={styles.submitText}>
                {form.id > 0 ? 'Update Lead' : 'Submit Lead'}
              </Text>
            )}
          </PlatformGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Date Picker */}
      {showPicker.show && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, selected) => {
            setShowPicker({show: false, key: null});
            if (selected) {
              updateField(showPicker.key, selected.toISOString().split('T')[0]);
            }
          }}
        />
      )}
    </PlatformGradient>
  );
};

export default AddLeadScreen;

const styles = StyleSheet.create({
  header: {
    height: 70,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.WHITE,
  },
  input: {
    height: 50,
    borderRadius: 14,
    paddingHorizontal: 14,
    color: COLORS.WHITE,
    backgroundColor: COLORS.Glass,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
    justifyContent: 'center',
  },
  dropdown: {
    height: 50,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: COLORS.Glass,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
  },
  dateText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
  },
  submitBtn: {
    marginTop: 20,
    borderRadius: 14,
    overflow: 'hidden',
  },
  submitGradient: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
  selectedStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.Secondary,
    borderRadius: 12,
    marginRight: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  textSelectedStyle: {
    color: COLORS.WHITE,
    marginRight: 4,
  },
  selectedContainer: {
    marginTop: 8,
  },
  dropdownText: {
    color: COLORS.WHITE,
  },
});
