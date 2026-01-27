import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Animatable from 'react-native-animatable';
import {Dropdown} from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import {launchImageLibrary} from 'react-native-image-picker';
import {pick, types} from '@react-native-documents/picker';
import {Modal, SafeAreaView} from 'react-native';
import {formatDate} from '../../../../utils/DateUtils';
import {BASEURL} from '../../../../utils/BaseUrl';

const {width} = Dimensions.get('window');

const COLORS = {
  PRIMARY: '#000000', // Black as requested
  SECONDARY: '#3b82f6',
  WHITE: '#FFFFFF',
  BACKGROUND: '#f3f4f6', // As requested
  TEXT_DARK: '#1f2937',
  TEXT_LIGHT: '#6b7280',
  BORDER: '#e5e7eb',
  ERROR: '#ef4444',
  SUCCESS: '#10b981',
};

const GENDER_OPTIONS = [
  {label: 'Male', value: 4},
  {label: 'Female', value: 5},
];

const MARITAL_STATUS_OPTIONS = [
  {label: 'Single', value: 0},
  {label: 'Married', value: 1},
];

const BLOOD_GROUP_OPTIONS = [
  {label: 'O+', value: 1},
  {label: 'O-', value: 2},
  {label: 'A+', value: 3},
  {label: 'A-', value: 4},
  {label: 'B+', value: 5},
  {label: 'B-', value: 6},
  {label: 'AB+', value: 7},
  {label: 'AB-', value: 8},
];

const InputField = ({
  label,
  field,
  placeholder,
  formData,
  handleInputChange,
  keyboardType = 'default',
  isMandatory = true,
}) => (
  <View style={styles.inputWrapper}>
    <Text style={styles.label}>
      {label} {isMandatory && <Text style={{color: COLORS.ERROR}}>*</Text>}
    </Text>
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor={COLORS.TEXT_LIGHT}
      value={formData[field]}
      onChangeText={text => handleInputChange(field, text)}
      keyboardType={keyboardType}
    />
  </View>
);

const SectionHeader = ({section, activeSection, setActiveSection}) => {
  const isActive = activeSection === section.id;
  return (
    <TouchableOpacity
      onPress={() => setActiveSection(isActive ? null : section.id)}
      style={[styles.sectionHeader, isActive && styles.activeSectionHeader]}>
      <View style={styles.sectionHeaderLeft}>
        <Icon
          name={section.icon}
          size={24}
          color={isActive ? COLORS.WHITE : COLORS.PRIMARY}
        />
        <Text
          style={[styles.sectionTitle, isActive && styles.activeSectionTitle]}>
          {section.title}
        </Text>
      </View>
      <Icon
        name={isActive ? 'chevron-up' : 'chevron-down'}
        size={24}
        color={isActive ? COLORS.WHITE : COLORS.TEXT_LIGHT}
      />
    </TouchableOpacity>
  );
};

const EmployeeRegistration = ({navigation}) => {
  const [activeSection, setActiveSection] = useState('Information');
  const [formData, setFormData] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateField, setDateField] = useState(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [bankOptions, setBankOptions] = useState([]);
  const [bankLoading, setBankLoading] = useState(false);

  const sections = [
    {id: 'Information', title: 'Information', icon: 'account-details'},
    {id: 'Emergency', title: 'Emergency Contact', icon: 'phone-alert'},
    {id: 'Bank', title: 'Bank Details', icon: 'bank'},
    {id: 'Qualification', title: 'Qualification', icon: 'school'},
    {id: 'Work', title: 'Work History', icon: 'briefcase'},
    {id: 'Attachments', title: 'Attachments', icon: 'paperclip'},
  ];

  useEffect(() => {
    const fetchBanks = async () => {
      setBankLoading(true);
      try {
        const response = await fetch(`${BASEURL}pakistan_banks.php`);
        const json = await response.json();
        if (json.status === 'true' && Array.isArray(json.data)) {
          const formatted = json.data.map(item => ({
            label: item.description,
            value: item.id,
          }));
          setBankOptions(formatted);
        }
      } catch (err) {
        console.log('Fetch Banks Error:', err);
      } finally {
        setBankLoading(false);
      }
    };
    fetchBanks();
  }, []);

  const handleInputChange = (field, value) => {
    let finalValue = value;

    // CNIC Masking: XXXXX-XXXXXXX-X
    if (field === 'nic') {
      const cleaned = value.replace(/\D/g, '').substring(0, 13);
      let masked = cleaned;
      if (cleaned.length > 5 && cleaned.length <= 12) {
        masked = `${cleaned.substring(0, 5)}-${cleaned.substring(5)}`;
      } else if (cleaned.length > 12) {
        masked = `${cleaned.substring(0, 5)}-${cleaned.substring(
          5,
          12,
        )}-${cleaned.substring(12)}`;
      }
      finalValue = masked;
    }

    setFormData(prev => ({...prev, [field]: finalValue}));
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate && dateField) {
      handleInputChange(dateField, formatDate(selectedDate));
      setDateField(null);
    }
  };

  const openDatePicker = field => {
    setDateField(field);
    setShowDatePicker(true);
  };

  const handleImageSelect = async () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 1000,
      maxWidth: 1000,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) return;
      if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
        return;
      }
      if (response.assets && response.assets.length > 0) {
        setFormData(prev => ({...prev, profileImage: response.assets[0]}));
      }
    });
  };

  const handleDocumentSelect = async field => {
    try {
      const [res] = await pick({
        type: [types.allFiles],
      });
      setFormData(prev => ({...prev, [field]: res}));
    } catch (err) {
      if (err?.code === 'DOCUMENT_PICKER_CANCELED') {
        // User cancelled the picker
      } else {
        console.error('DocumentPicker Error: ', err);
      }
    }
  };

  const renderInformationSection = () => (
    <Animatable.View
      animation="fadeIn"
      duration={400}
      style={styles.sectionContent}>
      <InputField
        label="Employee Full Name"
        field="fullName"
        placeholder="Enter Full Name"
        formData={formData}
        handleInputChange={handleInputChange}
      />
      <InputField
        label="Employee's Father Name"
        field="fatherName"
        placeholder="Enter Father's Name"
        formData={formData}
        handleInputChange={handleInputChange}
      />
      <View style={styles.row}>
        <View style={{flex: 1, marginRight: 8}}>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>
              Gender <Text style={{color: COLORS.ERROR}}>*</Text>
            </Text>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              itemTextStyle={{color: '#000'}}
              data={GENDER_OPTIONS}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder="Select"
              value={formData.gender}
              onChange={item => handleInputChange('gender', item.value)}
            />
          </View>
        </View>
        <View style={{flex: 1, marginLeft: 8}}>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>
              Date of Birth <Text style={{color: COLORS.ERROR}}>*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => openDatePicker('dob')}
              style={styles.dateSelector}>
              <Text
                style={[
                  styles.dateText,
                  !formData.dob && {color: COLORS.TEXT_LIGHT},
                ]}>
                {formData.dob || 'DD-MM-YYYY'}
              </Text>
              <Icon name="calendar" size={20} color={COLORS.PRIMARY} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <InputField
        label="Employee's Mother Name (As per Bank record)"
        field="motherName"
        placeholder="Enter Mother's Name"
        formData={formData}
        handleInputChange={handleInputChange}
      />
      <InputField
        label="Mobile (registered on your NIC)"
        field="mobile"
        placeholder="03xx-xxxxxxx"
        keyboardType="phone-pad"
        formData={formData}
        handleInputChange={handleInputChange}
      />
      <InputField
        label="Email"
        field="email"
        placeholder="example@domain.com"
        keyboardType="email-address"
        formData={formData}
        handleInputChange={handleInputChange}
      />
      <View style={styles.row}>
        <View style={{flex: 1, marginRight: 8}}>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>
              Blood Group <Text style={{color: COLORS.ERROR}}>*</Text>
            </Text>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              itemTextStyle={{color: '#000'}}
              data={BLOOD_GROUP_OPTIONS}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder="Select"
              value={formData.bloodGroup}
              onChange={item => handleInputChange('bloodGroup', item.value)}
            />
          </View>
        </View>
        <View style={{flex: 1, marginLeft: 8}}>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>
              Marital Status <Text style={{color: COLORS.ERROR}}>*</Text>
            </Text>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              itemTextStyle={{color: '#000'}}
              data={MARITAL_STATUS_OPTIONS}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder="Select"
              value={formData.maritalStatus}
              onChange={item => handleInputChange('maritalStatus', item.value)}
            />
          </View>
        </View>
      </View>
      <InputField
        label="NIC"
        field="nic"
        placeholder="xxxxx-xxxxxxx-x"
        keyboardType="numeric"
        formData={formData}
        handleInputChange={handleInputChange}
      />
      <View style={styles.row}>
        <View style={{flex: 1, marginRight: 8}}>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>
              NIC Issue Date <Text style={{color: COLORS.ERROR}}>*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => openDatePicker('nicIssue')}
              style={styles.dateSelector}>
              <Text
                style={[
                  styles.dateText,
                  !formData.nicIssue && {color: COLORS.TEXT_LIGHT},
                ]}>
                {formData.nicIssue || 'DD-MM-YYYY'}
              </Text>
              <Icon name="calendar" size={20} color={COLORS.PRIMARY} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={{flex: 1, marginLeft: 8}}>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>
              NIC Expiry Date <Text style={{color: COLORS.ERROR}}>*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => openDatePicker('nicExpiry')}
              style={styles.dateSelector}>
              <Text
                style={[
                  styles.dateText,
                  !formData.nicExpiry && {color: COLORS.TEXT_LIGHT},
                ]}>
                {formData.nicExpiry || 'DD-MM-YYYY'}
              </Text>
              <Icon name="calendar" size={20} color={COLORS.PRIMARY} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <InputField
        label="Physical Address"
        field="address"
        placeholder="Enter full address"
        formData={formData}
        handleInputChange={handleInputChange}
      />

      <View style={styles.imageUploadContainer}>
        <Text style={styles.label}>
          EMPLOYEE IMAGE <Text style={{color: COLORS.ERROR}}>*</Text>
        </Text>
        {formData.profileImage ? (
          <View style={styles.pickerWrapper}>
            <TouchableOpacity
              onPress={() => setIsPreviewVisible(true)}
              style={styles.imagePlaceholder}>
              <Image
                source={{uri: formData.profileImage.uri}}
                style={styles.previewImage}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleImageSelect}
              style={styles.changeBtn}>
              <Icon name="pencil" size={16} color={COLORS.WHITE} />
              <Text style={styles.changeBtnText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleImageSelect}
            style={styles.imagePicker}>
            <Icon name="camera-plus" size={32} color={COLORS.PRIMARY} />
            <Text style={styles.uploadText}>Select Image</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animatable.View>
  );

  const renderEmergencySection = () => (
    <Animatable.View
      animation="fadeIn"
      duration={400}
      style={styles.sectionContent}>
      <InputField
        label="Emergency Contact Name"
        field="emergencyName"
        placeholder="Enter Contact Name"
        formData={formData}
        handleInputChange={handleInputChange}
      />
      <View style={styles.row}>
        <View style={{flex: 1, marginRight: 8}}>
          <InputField
            label="Relation"
            field="emergencyRelation"
            placeholder="e.g. Brother"
            formData={formData}
            handleInputChange={handleInputChange}
          />
        </View>
        <View style={{flex: 1, marginLeft: 8}}>
          <InputField
            label="Phone Number"
            field="emergencyPhone"
            placeholder="03xx-xxxxxxx"
            keyboardType="phone-pad"
            formData={formData}
            handleInputChange={handleInputChange}
          />
        </View>
      </View>
    </Animatable.View>
  );

  const renderBankSection = () => (
    <Animatable.View
      animation="fadeIn"
      duration={400}
      style={styles.sectionContent}>
      <InputField
        label="Employee Bank A/C No (IBAN)"
        field="iban"
        placeholder="PKxx XXXX xxxx xxxx xxxx xxxx"
        formData={formData}
        handleInputChange={handleInputChange}
      />
      <View style={styles.inputWrapper}>
        <Text style={styles.label}>
          Employee Bank <Text style={{color: COLORS.ERROR}}>*</Text>
        </Text>
        <Dropdown
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          itemTextStyle={{color: '#000'}}
          data={bankOptions}
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder={bankLoading ? 'Loading...' : 'Select Bank'}
          value={formData.bankName}
          onChange={item => handleInputChange('bankName', item.value)}
          search
          searchPlaceholder="Search bank..."
        />
      </View>
      <InputField
        label="Employee Bank Branch"
        field="bankBranch"
        placeholder="Enter Branch Name/Code"
        formData={formData}
        handleInputChange={handleInputChange}
      />
      <InputField
        label="TITLE OF BANK ACCOUNT"
        field="accountTitle"
        placeholder="Enter Account Title"
        formData={formData}
        handleInputChange={handleInputChange}
      />
    </Animatable.View>
  );

  const renderQualificationSection = () => (
    <Animatable.View
      animation="fadeIn"
      duration={400}
      style={styles.sectionContent}>
      <InputField
        label="Last qualification"
        field="lastQualification"
        placeholder="e.g. Masters"
        formData={formData}
        handleInputChange={handleInputChange}
      />
      <InputField
        label="Qualification Degree"
        field="degree"
        placeholder="e.g. MCS"
        formData={formData}
        handleInputChange={handleInputChange}
      />
      <InputField
        label="Passing Year"
        field="passingYear"
        placeholder="YYYY"
        keyboardType="numeric"
        formData={formData}
        handleInputChange={handleInputChange}
      />
      <InputField
        label="University / Institute"
        field="university"
        placeholder="Enter University Name"
        formData={formData}
        handleInputChange={handleInputChange}
      />
      <InputField
        label="CGPA/ Passing%"
        field="cgpa"
        placeholder="e.g. 3.5 or 80%"
        formData={formData}
        handleInputChange={handleInputChange}
      />
    </Animatable.View>
  );

  const renderWorkSection = () => (
    <Animatable.View
      animation="fadeIn"
      duration={400}
      style={styles.sectionContent}>
      <Text style={styles.subHeading}>Last Work History</Text>
      <InputField
        label="Previous employer"
        field="prevEmployer"
        placeholder="Company Name"
        formData={formData}
        handleInputChange={handleInputChange}
      />
      <View style={styles.row}>
        <View style={{flex: 1, marginRight: 8}}>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Date From</Text>
            <TouchableOpacity
              onPress={() => openDatePicker('workFrom')}
              style={styles.dateSelector}>
              <Text
                style={[
                  styles.dateText,
                  !formData.workFrom && {color: COLORS.TEXT_LIGHT},
                ]}>
                {formData.workFrom || 'DD-MM-YYYY'}
              </Text>
              <Icon name="calendar" size={20} color={COLORS.PRIMARY} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={{flex: 1, marginLeft: 8}}>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Date To</Text>
            <TouchableOpacity
              onPress={() => openDatePicker('workTo')}
              style={styles.dateSelector}>
              <Text
                style={[
                  styles.dateText,
                  !formData.workTo && {color: COLORS.TEXT_LIGHT},
                ]}>
                {formData.workTo || 'DD-MM-YYYY'}
              </Text>
              <Icon name="calendar" size={20} color={COLORS.PRIMARY} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <InputField
        label="Designation"
        field="prevDesignation"
        placeholder="Enter Designation"
        formData={formData}
        handleInputChange={handleInputChange}
      />
    </Animatable.View>
  );

  const renderAttachmentSection = () => (
    <Animatable.View
      animation="fadeIn"
      duration={400}
      style={styles.sectionContent}>
      <TouchableOpacity
        onPress={() => handleDocumentSelect('cnicDoc')}
        activeOpacity={0.7}
        style={styles.attachmentItem}>
        <View style={styles.attachmentTextInfo}>
          <Text style={styles.attachmentTitle}>
            CNIC <Text style={{color: COLORS.ERROR}}>*</Text>
          </Text>
          <Text
            style={[
              styles.attachmentSub,
              formData.cnicDoc && {color: COLORS.SUCCESS, fontWeight: '600'},
            ]}>
            {formData.cnicDoc ? formData.cnicDoc.name : 'Front & Back Scan'}
          </Text>
        </View>
        <View style={styles.uploadBtnWrapper}>
          <Icon
            name={formData.cnicDoc ? 'check-circle' : 'upload'}
            size={24}
            color={formData.cnicDoc ? COLORS.SUCCESS : COLORS.PRIMARY}
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => handleDocumentSelect('cvDoc')}
        activeOpacity={0.7}
        style={styles.attachmentItem}>
        <View style={styles.attachmentTextInfo}>
          <Text style={styles.attachmentTitle}>
            Update CV <Text style={{color: COLORS.ERROR}}>*</Text>
          </Text>
          <Text
            style={[
              styles.attachmentSub,
              formData.cvDoc && {color: COLORS.SUCCESS, fontWeight: '600'},
            ]}>
            {formData.cvDoc ? formData.cvDoc.name : 'Latest Professional CV'}
          </Text>
        </View>
        <View style={styles.uploadBtnWrapper}>
          <Icon
            name={formData.cvDoc ? 'check-circle' : 'upload'}
            size={24}
            color={formData.cvDoc ? COLORS.SUCCESS : COLORS.PRIMARY}
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => handleDocumentSelect('qualDoc')}
        activeOpacity={0.7}
        style={styles.attachmentItem}>
        <View style={styles.attachmentTextInfo}>
          <Text style={styles.attachmentTitle}>
            Last qualification documents{' '}
            <Text style={{color: COLORS.ERROR}}>*</Text>
          </Text>
          <Text
            style={[
              styles.attachmentSub,
              formData.qualDoc && {color: COLORS.SUCCESS, fontWeight: '600'},
            ]}>
            {formData.qualDoc ? formData.qualDoc.name : 'Degree/Transcript'}
          </Text>
        </View>
        <View style={styles.uploadBtnWrapper}>
          <Icon
            name={formData.qualDoc ? 'check-circle' : 'upload'}
            size={24}
            color={formData.qualDoc ? COLORS.SUCCESS : COLORS.PRIMARY}
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => handleDocumentSelect('policeDoc')}
        activeOpacity={0.7}
        style={styles.attachmentItem}>
        <View style={styles.attachmentTextInfo}>
          <Text style={styles.attachmentTitle}>
            Police character certificate
          </Text>
          <Text
            style={[
              styles.attachmentSub,
              formData.policeDoc && {color: COLORS.SUCCESS, fontWeight: '600'},
            ]}>
            {formData.policeDoc ? formData.policeDoc.name : '(Not mandatory)'}
          </Text>
        </View>
        <View style={styles.uploadBtnWrapper}>
          <Icon
            name={formData.policeDoc ? 'check-circle' : 'upload'}
            size={24}
            color={formData.policeDoc ? COLORS.SUCCESS : COLORS.TEXT_LIGHT}
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => handleDocumentSelect('otherDoc')}
        activeOpacity={0.7}
        style={styles.attachmentItem}>
        <View style={styles.attachmentTextInfo}>
          <Text style={styles.attachmentTitle}>Other documents</Text>
          <Text
            style={[
              styles.attachmentSub,
              formData.otherDoc && {color: COLORS.SUCCESS, fontWeight: '600'},
            ]}>
            {formData.otherDoc ? formData.otherDoc.name : '(Not mandatory)'}
          </Text>
        </View>
        <View style={styles.uploadBtnWrapper}>
          <Icon
            name={formData.otherDoc ? 'check-circle' : 'upload'}
            size={24}
            color={formData.otherDoc ? COLORS.SUCCESS : COLORS.TEXT_LIGHT}
          />
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.customHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={COLORS.TEXT_DARK} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <Animatable.View
          animation="fadeInDown"
          duration={600}
          style={styles.topInfo}>
          <Text style={styles.headerTitle}>Registration Form</Text>
          <Text style={styles.headerSub}>
            Enter your details to register as an employee
          </Text>
        </Animatable.View>

        <View style={styles.formCard}>
          {sections.map(section => (
            <View key={section.id} style={styles.sectionContainer}>
              <SectionHeader
                section={section}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
              />
              {activeSection === section.id && (
                <View>
                  {section.id === 'Information' && renderInformationSection()}
                  {section.id === 'Emergency' && renderEmergencySection()}
                  {section.id === 'Bank' && renderBankSection()}
                  {section.id === 'Qualification' &&
                    renderQualificationSection()}
                  {section.id === 'Work' && renderWorkSection()}
                  {section.id === 'Attachments' && renderAttachmentSection()}
                </View>
              )}
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.submitButton} activeOpacity={0.8}>
          <Text style={styles.submitButtonText}>Submit Registration</Text>
        </TouchableOpacity>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {/* Image Preview Modal */}
      <Modal
        visible={isPreviewVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsPreviewVisible(false)}>
        <SafeAreaView style={styles.modalBackground}>
          <TouchableOpacity
            style={styles.closePreview}
            onPress={() => setIsPreviewVisible(false)}>
            <Icon name="close" size={30} color={COLORS.WHITE} />
          </TouchableOpacity>
          {formData.profileImage && (
            <Image
              source={{uri: formData.profileImage.uri}}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  customHeader: {
    height: Platform.OS === 'ios' ? 100 : 60,
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 36,
  },
  topInfo: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  pickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  changeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changeBtnText: {
    color: COLORS.WHITE,
    fontWeight: '600',
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_DARK,
    textAlign: 'center',
  },
  headerSub: {
    fontSize: 14,
    color: COLORS.TEXT_LIGHT,
    marginTop: 8,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  sectionContainer: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  activeSectionHeader: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.PRIMARY,
    marginLeft: 12,
  },
  activeSectionTitle: {
    color: COLORS.WHITE,
  },
  sectionContent: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    paddingHorizontal: 16,
    color: COLORS.TEXT_DARK,
    backgroundColor: '#fafafa',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageUploadContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  imagePicker: {
    height: 120,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  uploadText: {
    marginTop: 8,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  subHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.PRIMARY,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    paddingBottom: 4,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  attachmentTextInfo: {
    flex: 1,
  },
  attachmentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  attachmentSub: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
    marginTop: 2,
  },
  uploadBtnWrapper: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closePreview: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 30,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: {
    width: width,
    height: width,
  },
  dropdown: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fafafa',
  },
  placeholderStyle: {
    fontSize: 14,
    color: COLORS.TEXT_LIGHT,
  },
  selectedTextStyle: {
    fontSize: 14,
    color: COLORS.TEXT_DARK,
  },
  dateSelector: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fafafa',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 14,
    color: COLORS.TEXT_DARK,
  },
  submitButton: {
    backgroundColor: COLORS.PRIMARY,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.PRIMARY,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  submitButtonText: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: '700',
  },
});

export default EmployeeRegistration;
