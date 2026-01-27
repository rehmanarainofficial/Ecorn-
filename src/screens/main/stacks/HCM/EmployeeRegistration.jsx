import React, {useState} from 'react';
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
import SimpleHeader from '../../../../components/SimpleHeader';
import * as Animatable from 'react-native-animatable';

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

const EmployeeRegistration = ({navigation}) => {
  const [activeSection, setActiveSection] = useState('Information');
  const [formData, setFormData] = useState({});

  const sections = [
    {id: 'Information', title: 'Information', icon: 'account-details'},
    {id: 'Bank', title: 'Bank Details', icon: 'bank'},
    {id: 'Qualification', title: 'Qualification', icon: 'school'},
    {id: 'Work', title: 'Work History', icon: 'briefcase'},
    {id: 'Attachments', title: 'Attachments', icon: 'paperclip'},
  ];

  const handleInputChange = (field, value) => {
    setFormData({...formData, [field]: value});
  };

  const InputField = ({
    label,
    field,
    placeholder,
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

  const SectionHeader = ({section}) => {
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
            style={[
              styles.sectionTitle,
              isActive && styles.activeSectionTitle,
            ]}>
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

  const renderInformationSection = () => (
    <Animatable.View
      animation="fadeIn"
      duration={400}
      style={styles.sectionContent}>
      <InputField
        label="Employee Full Name"
        field="fullName"
        placeholder="Enter Full Name"
      />
      <InputField
        label="Employee's Father Name"
        field="fatherName"
        placeholder="Enter Father's Name"
      />
      <View style={styles.row}>
        <View style={{flex: 1, marginRight: 8}}>
          <InputField label="Gender" field="gender" placeholder="Male/Female" />
        </View>
        <View style={{flex: 1, marginLeft: 8}}>
          <InputField
            label="Date of Birth"
            field="dob"
            placeholder="DD-MM-YYYY"
          />
        </View>
      </View>
      <InputField
        label="Employee's Mother Name (As per Bank record)"
        field="motherName"
        placeholder="Enter Mother's Name"
      />
      <InputField
        label="Mobile (registered on your NIC)"
        field="mobile"
        placeholder="03xx-xxxxxxx"
        keyboardType="phone-pad"
      />
      <InputField
        label="Email"
        field="email"
        placeholder="example@domain.com"
        keyboardType="email-address"
      />
      <View style={styles.row}>
        <View style={{flex: 1, marginRight: 8}}>
          <InputField
            label="Blood Group"
            field="bloodGroup"
            placeholder="e.g. A+"
          />
        </View>
        <View style={{flex: 1, marginLeft: 8}}>
          <InputField
            label="Marital Status"
            field="maritalStatus"
            placeholder="Single/Married"
          />
        </View>
      </View>
      <InputField label="NIC" field="nic" placeholder="xxxxx-xxxxxxx-x" />
      <View style={styles.row}>
        <View style={{flex: 1, marginRight: 8}}>
          <InputField
            label="NIC Issue Date"
            field="nicIssue"
            placeholder="DD-MM-YYYY"
          />
        </View>
        <View style={{flex: 1, marginLeft: 8}}>
          <InputField
            label="NIC Expiry Date"
            field="nicExpiry"
            placeholder="DD-MM-YYYY"
          />
        </View>
      </View>
      <InputField
        label="Physical Address"
        field="address"
        placeholder="Enter full address"
      />

      <View style={styles.imageUploadContainer}>
        <Text style={styles.label}>
          EMPLOYEE IMAGE <Text style={{color: COLORS.ERROR}}>*</Text>
        </Text>
        <TouchableOpacity style={styles.imagePicker}>
          <Icon name="camera-plus" size={32} color={COLORS.PRIMARY} />
          <Text style={styles.uploadText}>Select Image</Text>
        </TouchableOpacity>
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
      />
      <InputField
        label="Employee Bank"
        field="bankName"
        placeholder="Enter Bank Name"
      />
      <InputField
        label="Employee Bank Branch"
        field="bankBranch"
        placeholder="Enter Branch Name/Code"
      />
      <InputField
        label="TITLE OF BANK ACCOUNT"
        field="accountTitle"
        placeholder="Enter Account Title"
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
      />
      <InputField
        label="Qualification Degree"
        field="degree"
        placeholder="e.g. MCS"
      />
      <InputField
        label="Passing Year"
        field="passingYear"
        placeholder="YYYY"
        keyboardType="numeric"
      />
      <InputField
        label="University / Institute"
        field="university"
        placeholder="Enter University Name"
      />
      <InputField
        label="CGPA/ Passing%"
        field="cgpa"
        placeholder="e.g. 3.5 or 80%"
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
      />
      <View style={styles.row}>
        <View style={{flex: 1, marginRight: 8}}>
          <InputField
            label="Date From"
            field="workFrom"
            placeholder="DD-MM-YYYY"
          />
        </View>
        <View style={{flex: 1, marginLeft: 8}}>
          <InputField label="Date To" field="workTo" placeholder="DD-MM-YYYY" />
        </View>
      </View>
      <InputField
        label="Designation"
        field="prevDesignation"
        placeholder="Enter Designation"
      />
    </Animatable.View>
  );

  const renderAttachmentSection = () => (
    <Animatable.View
      animation="fadeIn"
      duration={400}
      style={styles.sectionContent}>
      <View style={styles.attachmentItem}>
        <View style={styles.attachmentTextInfo}>
          <Text style={styles.attachmentTitle}>
            CNIC# <Text style={{color: COLORS.ERROR}}>*</Text>
          </Text>
          <Text style={styles.attachmentSub}>Front & Back Scan</Text>
        </View>
        <TouchableOpacity style={styles.uploadBtnMini}>
          <Icon name="upload" size={20} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      <View style={styles.attachmentItem}>
        <View style={styles.attachmentTextInfo}>
          <Text style={styles.attachmentTitle}>
            Update CV# <Text style={{color: COLORS.ERROR}}>*</Text>
          </Text>
          <Text style={styles.attachmentSub}>Latest Professional CV</Text>
        </View>
        <TouchableOpacity style={styles.uploadBtnMini}>
          <Icon name="upload" size={20} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      <View style={styles.attachmentItem}>
        <View style={styles.attachmentTextInfo}>
          <Text style={styles.attachmentTitle}>
            Last qualification documents{' '}
            <Text style={{color: COLORS.ERROR}}>*</Text>
          </Text>
          <Text style={styles.attachmentSub}>Degree/Transcript</Text>
        </View>
        <TouchableOpacity style={styles.uploadBtnMini}>
          <Icon name="upload" size={20} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      <View style={styles.attachmentItem}>
        <View style={styles.attachmentTextInfo}>
          <Text style={styles.attachmentTitle}>
            Police character certificate
          </Text>
          <Text style={styles.attachmentSub}>(Not mandatory)</Text>
        </View>
        <TouchableOpacity
          style={[styles.uploadBtnMini, {backgroundColor: COLORS.TEXT_LIGHT}]}>
          <Icon name="upload" size={20} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      <View style={styles.attachmentItem}>
        <View style={styles.attachmentTextInfo}>
          <Text style={styles.attachmentTitle}>Other documents</Text>
          <Text style={styles.attachmentSub}>(Not mandatory)</Text>
        </View>
        <TouchableOpacity
          style={[styles.uploadBtnMini, {backgroundColor: COLORS.TEXT_LIGHT}]}>
          <Icon name="upload" size={20} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>
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
          <Image
            source={require('../../../../assets/images/Rider.png')}
            style={styles.logo}
          />
          <Text style={styles.headerTitle}>Join Ercon Industries</Text>
          <Text style={styles.headerSub}>
            Complete your registration to continue
          </Text>
        </Animatable.View>

        <View style={styles.formCard}>
          {sections.map(section => (
            <View key={section.id} style={styles.sectionContainer}>
              <SectionHeader section={section} />
              {activeSection === section.id && (
                <View>
                  {section.id === 'Information' && renderInformationSection()}
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
  uploadBtnMini: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
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
