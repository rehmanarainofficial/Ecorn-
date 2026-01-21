import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  ToastAndroid,
  Image,
  Modal,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Dropdown} from 'react-native-element-dropdown';
import PlatformGradient from '../../../../components/PlatformGradient';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import {launchImageLibrary} from 'react-native-image-picker';
import axios from 'axios';
import {BASEURL} from '../../../../utils/BaseUrl';
import {useSelector} from 'react-redux';
import {formatNumber} from '../../../../utils/NumberUtils';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {APPCOLORS} from '../../../../utils/APPCOLORS';

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

// Purpose options for checkboxes
const PURPOSE_OPTIONS = [
  {id: 'monthly_exp', label: 'Monthly Exp'},
  {id: 'official_travel', label: 'Official Travel'},
  {id: 'client_meeting', label: 'Client Meeting'},
  {id: 'office_supplies', label: 'Office Supplies'},
  {id: 'training_seminar', label: 'Training / Seminar'},
  {id: 'site_visit', label: 'Site Visit'},
  {id: 'other', label: 'Other'},
];

export default function ExpenseClaim({navigation}) {
  const insets = useSafeAreaInsets();
  const {id} = useSelector(state => state.Data.currentData);
  
  // Claim Details State
  const [claimNo, setClaimNo] = useState('');
  const [submissionDate, setSubmissionDate] = useState(new Date());
  const [periodFromDate, setPeriodFromDate] = useState(new Date());
  const [periodToDate, setPeriodToDate] = useState(new Date());
  const [selectedPurposes, setSelectedPurposes] = useState([]);
  const [otherPurposeText, setOtherPurposeText] = useState('');
  const [accompaniedBy, setAccompaniedBy] = useState('');
  
  // Date Picker States
  const [showSubmissionDatePicker, setShowSubmissionDatePicker] = useState(false);
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  const [showItemDatePicker, setShowItemDatePicker] = useState(false);
  
  // Expense Item Form State
  const [itemDate, setItemDate] = useState(new Date());
  const [expenseCategory, setExpenseCategory] = useState(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  
  // Data State
  const [accountTitles, setAccountTitles] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(false);
  
  // Image State
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  
  // Overall Memo
  const [overallMemo, setOverallMemo] = useState('');

  // Generate Claim No on mount
  useEffect(() => {
    generateClaimNo();
    fetchAccountTitles();
  }, []);

  const generateClaimNo = () => {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setClaimNo(`EC-${timestamp}-${random}`);
  };

  const fetchAccountTitles = async () => {
    setAccountsLoading(true);
    try {
      const response = await axios.get(`${BASEURL}get_gl_account.php`);
      if (response.data.status === 'true') {
        const formattedAccounts = response.data.data.map(account => ({
          label: account.account_name,
          value: account.account_code,
          account_code: account.account_code,
          account_name: account.account_name,
        }));
        setAccountTitles(formattedAccounts);
      } else {
        ToastAndroid.show('Failed to load account titles', ToastAndroid.SHORT);
      }
    } catch (error) {
      console.log('Account titles error:', error);
      ToastAndroid.show('Error loading account titles', ToastAndroid.SHORT);
    } finally {
      setAccountsLoading(false);
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day} / ${month} / ${year}`;
  };

  const formatDateForApi = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const togglePurpose = (purposeId) => {
    setSelectedPurposes(prev => {
      if (prev.includes(purposeId)) {
        return prev.filter(id => id !== purposeId);
      } else {
        return [...prev, purposeId];
      }
    });
  };

  const handleImagePicker = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
    };

    setImageLoading(true);

    launchImageLibrary(options, response => {
      setImageLoading(false);

      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        ToastAndroid.show('Error selecting image', ToastAndroid.SHORT);
      } else if (response.assets && response.assets.length > 0) {
        const imageUri = response.assets[0].uri;
        setSelectedImage(imageUri);
        setShowImageModal(true);
      }
    });
  };

  const handleAddItem = () => {
    if (!expenseCategory || !amount) {
      ToastAndroid.show('Please fill required fields', ToastAndroid.SHORT);
      return;
    }

    const selectedAccount = accountTitles.find(acc => acc.value === expenseCategory);

    setItems(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        srNo: prev.length + 1,
        date: new Date(itemDate),
        expenseCategory: expenseCategory,
        expenseCategoryLabel: selectedAccount?.account_name || '',
        accountCode: selectedAccount?.account_code || '',
        description: description,
        amount: amount,
      },
    ]);

    // Reset form fields
    setExpenseCategory(null);
    setDescription('');
    setAmount('');
    setItemDate(new Date());
  };

  const handleRemoveItem = (id) => {
    setItems(prev => {
      const filtered = prev.filter(item => item.id !== id);
      // Re-number the items
      return filtered.map((item, index) => ({...item, srNo: index + 1}));
    });
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      ToastAndroid.show('Please add at least one expense item', ToastAndroid.SHORT);
      return;
    }

    if (selectedPurposes.length === 0) {
      ToastAndroid.show('Please select at least one purpose', ToastAndroid.SHORT);
      return;
    }

    setLoading(true);

    try {
      const totalAmount = items.reduce(
        (sum, item) => sum + parseFloat(item.amount || 0),
        0,
      );
      
      const glDetail = items.map(item => ({
        type: '41',
        account_code: item.accountCode,
        amount: parseFloat(item.amount),
        memo_: item.description || '',
        trans_date: formatDateForApi(item.date),
      }));

      const purposeLabels = selectedPurposes.map(id => {
        if (id === 'other') return `Other: ${otherPurposeText}`;
        return PURPOSE_OPTIONS.find(p => p.id === id)?.label || '';
      });

      const formData = new FormData();
      formData.append('type', '41');
      formData.append('claim_no', claimNo);
      formData.append('submission_date', formatDateForApi(submissionDate));
      formData.append('period_from', formatDateForApi(periodFromDate));
      formData.append('period_to', formatDateForApi(periodToDate));
      formData.append('purposes', JSON.stringify(purposeLabels));
      formData.append('accompanied_by', accompaniedBy);
      formData.append('comments', overallMemo || '');
      formData.append('trans_date', formatDateForApi(submissionDate));
      formData.append('amount', totalAmount.toString());
      formData.append('gl_detail', JSON.stringify(glDetail));
      formData.append('user_id', id);

      if (selectedImage) {
        const imageFile = {
          uri: selectedImage,
          type: 'image/jpeg',
          name: `expense_${Date.now()}.jpg`,
        };
        formData.append('filename', imageFile);
      }

      const response = await axios.post(
        `${BASEURL}post_service_payments.php`,
        formData,
        {
          headers: {'Content-Type': 'multipart/form-data'},
        },
      );

      if (
        response.data?.status === true ||
        response.data?.status === 'true' ||
        response.data?.status == 1
      ) {
        ToastAndroid.show('Expense claim submitted successfully', ToastAndroid.LONG);

        // Reset all fields
        setItems([]);
        setExpenseCategory(null);
        setDescription('');
        setAmount('');
        setSubmissionDate(new Date());
        setPeriodFromDate(new Date());
        setPeriodToDate(new Date());
        setSelectedPurposes([]);
        setOtherPurposeText('');
        setAccompaniedBy('');
        setSelectedImage(null);
        generateClaimNo();
      } else {
        ToastAndroid.show(
          response.data?.message || 'Server rejected submission',
          ToastAndroid.LONG,
        );
      }
    } catch (error) {
      console.log('Error:', error.response?.data || error.message);
      ToastAndroid.show('Submission failed', ToastAndroid.LONG);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return formatNumber(
      items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0),
    );
  };

  const paddingTop = Platform.OS === 'ios' ? insets.top + 10 : insets.top + 15;

  return (
    <View style={styles.container}>
      {/* Header */}
      <PlatformGradient
        colors={[APPCOLORS.Primary, APPCOLORS.Secondary]}
        style={[styles.header, {paddingTop}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" color={COLORS.WHITE} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Expense Claim Submission</Text>
        <View style={{width: 28}} />
      </PlatformGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Claim Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Claim Details</Text>
          
          {/* Expense Claim No */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Expense Claim No.:</Text>
            <View style={styles.autoGeneratedField}>
              <Text style={styles.autoGeneratedText}>{claimNo}</Text>
            </View>
          </View>

          {/* Claim Submission Date */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Claim Submission Date:</Text>
            <TouchableOpacity 
              style={styles.dateInputField}
              onPress={() => setShowSubmissionDatePicker(true)}>
              <Text style={styles.dateInputText}>{formatDate(submissionDate)}</Text>
              <Ionicons name="calendar-outline" size={20} color={COLORS.LabelColor} />
            </TouchableOpacity>
          </View>

          {/* Expense Period */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Expense Period:</Text>
            <View style={styles.periodContainer}>
              <Text style={styles.periodLabel}>From</Text>
              <TouchableOpacity 
                style={styles.periodDateField}
                onPress={() => setShowFromDatePicker(true)}>
                <Text style={styles.periodDateText}>{formatDate(periodFromDate)}</Text>
              </TouchableOpacity>
              <Text style={styles.periodLabel}>To</Text>
              <TouchableOpacity 
                style={styles.periodDateField}
                onPress={() => setShowToDatePicker(true)}>
                <Text style={styles.periodDateText}>{formatDate(periodToDate)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Purpose of Expense */}
          <View style={styles.purposeSection}>
            <Text style={styles.fieldLabel}>Purpose of Expense:</Text>
            <Text style={styles.purposeHint}>(Check Box - can select more than one)</Text>
            <View style={styles.checkboxGrid}>
              {PURPOSE_OPTIONS.map((purpose) => (
                <TouchableOpacity
                  key={purpose.id}
                  style={styles.checkboxRow}
                  onPress={() => togglePurpose(purpose.id)}>
                  <View style={[
                    styles.checkbox,
                    selectedPurposes.includes(purpose.id) && styles.checkboxChecked
                  ]}>
                    {selectedPurposes.includes(purpose.id) && (
                      <Ionicons name="checkmark" size={14} color={COLORS.WHITE} />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>{purpose.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Other Specify Field */}
            {selectedPurposes.includes('other') && (
              <TextInput
                style={styles.otherSpecifyInput}
                placeholder="Please specify..."
                placeholderTextColor={COLORS.LabelColor}
                value={otherPurposeText}
                onChangeText={setOtherPurposeText}
              />
            )}
          </View>

        </View>

        {/* Expense Items Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Expense Items</Text>
          
          {/* Add Item Form */}
          <View style={styles.addItemForm}>
            {/* Date Field */}
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Date:</Text>
              <TouchableOpacity 
                style={styles.formDateField}
                onPress={() => setShowItemDatePicker(true)}>
                <Text style={styles.formDateText}>{formatDate(itemDate)}</Text>
                <Ionicons name="calendar-outline" size={18} color={COLORS.LabelColor} />
              </TouchableOpacity>
            </View>

            {/* Expense Category Dropdown */}
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Expense Category:</Text>
              <Dropdown
                style={styles.formDropdown}
                data={accountTitles}
                search
                searchPlaceholder="Search account..."
                labelField="account_name"
                valueField="account_code"
                value={expenseCategory}
                onChange={item => setExpenseCategory(item.account_code)}
                placeholder={accountsLoading ? 'Loading...' : 'Select Category'}
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownSelectedText}
                itemTextStyle={styles.dropdownItemText}
                containerStyle={styles.dropdownContainer}
                renderLeftIcon={() =>
                  accountsLoading && (
                    <ActivityIndicator size="small" color={COLORS.AccentBlue} style={{marginRight: 8}} />
                  )
                }
              />
            </View>

            {/* Description Field */}
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Description:</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter description..."
                placeholderTextColor={COLORS.LabelColor}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* Amount Field */}
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Amount:</Text>
              <TextInput
                style={styles.formInput}
                placeholder="0.00"
                placeholderTextColor={COLORS.LabelColor}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            {/* Add Item Button */}
            <TouchableOpacity style={styles.addItemBtn} onPress={handleAddItem}>
              <Ionicons name="add-circle" size={22} color={COLORS.BLACK} />
              <Text style={styles.addItemBtnText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {/* Items Table */}
          {items.length > 0 && (
            <View style={styles.tableContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                  {/* Table Header */}
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderCell, styles.colSr]}>Sr.</Text>
                    <Text style={[styles.tableHeaderCell, styles.colDate]}>Date</Text>
                    <Text style={[styles.tableHeaderCell, styles.colCategory]}>Expense Category</Text>
                    <Text style={[styles.tableHeaderCell, styles.colDesc]}>Description</Text>
                    <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount</Text>
                    <Text style={[styles.tableHeaderCell, styles.colAction]}></Text>
                  </View>

                  {/* Table Rows */}
                  {items.map((item, index) => (
                    <View 
                      key={item.id} 
                      style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}>
                      <Text style={[styles.tableCell, styles.colSr]}>{item.srNo}</Text>
                      <Text style={[styles.tableCell, styles.colDate]}>{formatDate(item.date)}</Text>
                      <Text style={[styles.tableCell, styles.colCategory]} numberOfLines={2}>
                        {item.expenseCategoryLabel}
                      </Text>
                      <Text style={[styles.tableCell, styles.colDesc]} numberOfLines={2}>
                        {item.description || '-'}
                      </Text>
                      <Text style={[styles.tableCell, styles.colAmount]}>{formatNumber(item.amount)}</Text>
                      <TouchableOpacity
                        style={[styles.tableCell, styles.colAction]}
                        onPress={() => handleRemoveItem(item.id)}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Total Row */}
                  <View style={styles.totalRow}>
                    <Text style={[styles.totalCell, styles.colSr]}></Text>
                    <Text style={[styles.totalCell, styles.colDate]}></Text>
                    <Text style={[styles.totalCell, styles.colCategory]}></Text>
                    <Text style={[styles.totalLabel, styles.colDesc]}>Total:</Text>
                    <Text style={[styles.totalAmount, styles.colAmount]}>{calculateTotal()}</Text>
                    <Text style={[styles.totalCell, styles.colAction]}></Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          )}
        </View>

        {/* Additional Notes Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Additional Notes <Text style={styles.cardTitleHint}>(Names of Accompanying Person(s) if any)</Text></Text>
          <TextInput
            style={styles.notesInput}
            placeholder=""
            placeholderTextColor={COLORS.LabelColor}
            multiline
            numberOfLines={4}
            value={accompaniedBy}
            onChangeText={setAccompaniedBy}
          />
        </View>

        {/* Attach Receipt Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Attach Receipt / Document <Text style={styles.cardTitleHint}>(Take photos of your bills before submitting the form.)</Text></Text>
          <TouchableOpacity
            onPress={handleImagePicker}
            style={styles.attachButton}>
            {imageLoading ? (
              <ActivityIndicator size="small" color={COLORS.AccentBlue} />
            ) : (
              <>
                <Ionicons
                  name={selectedImage ? 'checkmark-circle' : 'cloud-upload-outline'}
                  size={32}
                  color={selectedImage ? COLORS.CheckboxActive : COLORS.AccentBlue}
                />
                <Text style={styles.attachButtonText}>
                  {selectedImage ? 'Image Selected - Tap to Change' : 'Tap to Upload Image'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {selectedImage && (
            <TouchableOpacity
              style={styles.imagePreviewContainer}
              onPress={() => setShowImageModal(true)}>
              <Image source={{uri: selectedImage}} style={styles.imagePreview} />
              <Text style={styles.imagePreviewText}>Tap to view full image</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, (loading || items.length === 0) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading || items.length === 0}>
          {loading ? (
            <ActivityIndicator color={COLORS.BLACK} />
          ) : (
            <>
              <Ionicons name="paper-plane" size={22} color={COLORS.BLACK} />
              <Text style={styles.submitBtnText}>Submit Expense Claim</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{height: 40}} />
      </ScrollView>

      {/* Date Pickers */}
      <DateTimePickerModal
        isVisible={showSubmissionDatePicker}
        mode="date"
        onConfirm={(date) => {
          setSubmissionDate(date);
          setShowSubmissionDatePicker(false);
        }}
        onCancel={() => setShowSubmissionDatePicker(false)}
      />

      <DateTimePickerModal
        isVisible={showFromDatePicker}
        mode="date"
        onConfirm={(date) => {
          setPeriodFromDate(date);
          setShowFromDatePicker(false);
        }}
        onCancel={() => setShowFromDatePicker(false)}
      />

      <DateTimePickerModal
        isVisible={showToDatePicker}
        mode="date"
        onConfirm={(date) => {
          setPeriodToDate(date);
          setShowToDatePicker(false);
        }}
        onCancel={() => setShowToDatePicker(false)}
      />

      <DateTimePickerModal
        isVisible={showItemDatePicker}
        mode="date"
        onConfirm={(date) => {
          setItemDate(date);
          setShowItemDatePicker(false);
        }}
        onCancel={() => setShowItemDatePicker(false)}
      />

      {/* Image Preview Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Image Preview</Text>
              <TouchableOpacity onPress={() => setShowImageModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.TextDark} />
              </TouchableOpacity>
            </View>
            {selectedImage && (
              <Image source={{uri: selectedImage}} style={styles.modalImage} />
            )}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowImageModal(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  
  // Card Styles
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TextDark,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.Border,
    paddingBottom: 12,
  },
  cardTitleHint: {
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.LabelColor,
    fontStyle: 'italic',
  },
  
  // Field Styles
  fieldRow: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TextDark,
    marginBottom: 8,
  },
  autoGeneratedField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.Border,
  },
  autoGeneratedText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TextDark,
  },
  autoGeneratedBadge: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.AccentBlue,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dateInputField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.WHITE,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.Border,
  },
  dateInputText: {
    fontSize: 15,
    color: COLORS.TextDark,
  },
  
  // Period Styles
  periodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.LabelColor,
  },
  periodDateField: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.Border,
    minWidth: 110,
  },
  periodDateText: {
    fontSize: 13,
    color: COLORS.TextDark,
    textAlign: 'center',
  },
  
  // Purpose Checkbox Styles
  purposeSection: {
    marginBottom: 16,
  },
  purposeHint: {
    fontSize: 12,
    color: COLORS.LabelColor,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  checkboxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.Border,
    marginBottom: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.LabelColor,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: COLORS.CheckboxActive,
    borderColor: COLORS.CheckboxActive,
  },
  checkboxLabel: {
    fontSize: 13,
    color: COLORS.TextDark,
    fontWeight: '500',
  },
  otherSpecifyInput: {
    marginTop: 12,
    backgroundColor: COLORS.WHITE,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.Border,
    fontSize: 14,
    color: COLORS.TextDark,
  },
  
  
  // Add Item Form Styles
  addItemForm: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  formRow: {
    marginBottom: 14,
  },
  formRowSplit: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  formHalf: {
    flex: 1,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.TextDark,
    marginBottom: 6,
  },
  formDateField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.Border,
  },
  formDateText: {
    fontSize: 14,
    color: COLORS.TextDark,
  },
  formDropdown: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.Border,
    height: 44,
  },
  formInput: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.Border,
    fontSize: 14,
    color: COLORS.TextDark,
    height: 44,
  },
  dropdownPlaceholder: {
    color: COLORS.LabelColor,
    fontSize: 14,
  },
  dropdownSelectedText: {
    color: COLORS.TextDark,
    fontSize: 14,
  },
  dropdownItemText: {
    color: COLORS.TextDark,
    fontSize: 14,
  },
  dropdownContainer: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.Border,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.WHITE,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.BLACK,
  },
  addItemBtnText: {
    color: COLORS.BLACK,
    fontSize: 15,
    fontWeight: '600',
  },
  
  // Table Styles
  tableContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.Border,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: APPCOLORS.Primary,
    paddingVertical: 12,
  },
  tableHeaderCell: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.Border,
    alignItems: 'center',
  },
  tableRowEven: {
    backgroundColor: '#F8FAFC',
  },
  tableCell: {
    fontSize: 12,
    color: COLORS.TextDark,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    paddingVertical: 12,
  },
  totalCell: {
    paddingHorizontal: 8,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.TextDark,
    textAlign: 'right',
    paddingHorizontal: 8,
  },
  totalAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.AccentBlue,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  
  // Column Widths
  colSr: {width: 40},
  colDate: {width: 100},
  colCategory: {width: 150},
  colDesc: {width: 130},
  colAmount: {width: 100},
  colAction: {width: 40, alignItems: 'center', justifyContent: 'center'},
  
  // Notes Styles
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.Border,
    fontSize: 14,
    color: COLORS.TextDark,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  
  // Attach Button Styles
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    paddingVertical: 24,
    borderWidth: 2,
    borderColor: COLORS.AccentBlue,
    borderStyle: 'dashed',
    gap: 12,
  },
  attachButtonText: {
    color: COLORS.AccentBlue,
    fontSize: 15,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.Border,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  imagePreviewText: {
    color: COLORS.LabelColor,
    fontSize: 12,
    marginTop: 8,
  },
  
  // Submit Button Styles
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.WHITE,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
    borderWidth: 1.5,
    borderColor: COLORS.BLACK,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnDisabled: {
    backgroundColor: '#E5E7EB',
    borderColor: '#9CA3AF',
  },
  submitBtnText: {
    color: COLORS.BLACK,
    fontSize: 17,
    fontWeight: '700',
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 20,
    margin: 20,
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    color: COLORS.TextDark,
    fontSize: 18,
    fontWeight: '700',
  },
  modalImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 15,
  },
  modalCloseButton: {
    backgroundColor: COLORS.AccentBlue,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
});
