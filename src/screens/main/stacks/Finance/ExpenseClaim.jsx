import React, { useState, useEffect } from 'react';
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
  PermissionsAndroid,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Dropdown } from 'react-native-element-dropdown';
import PlatformGradient from '../../../../components/PlatformGradient';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import axios from 'axios';
import { BASEURL } from '../../../../utils/BaseUrl';
import { useSelector } from 'react-redux';
import { formatNumber } from '../../../../utils/NumberUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APPCOLORS } from '../../../../utils/APPCOLORS';

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

// Purpose options for checkboxes with expense_type numbers
const PURPOSE_OPTIONS = [
  { id: 1, label: 'Monthly Exp' },
  { id: 2, label: 'Official Travel' },
  { id: 3, label: 'Client Meeting' },
  { id: 4, label: 'Office Supplies' },
  { id: 5, label: 'Training / Seminar' },
  { id: 6, label: 'Site Visit' },
  { id: 7, label: 'Other' },
];

export default function ExpenseClaim({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const userData = useSelector(state => state.Data.currentData);
  const userId = userData?.id;
  const employeeId = userData?.employee_id;
  const onRefresh = route?.params?.onRefresh;

  // Claim Details State
  const [submissionDate, setSubmissionDate] = useState(new Date());
  const [selectedPurpose, setSelectedPurpose] = useState(null);
  const [otherPurposeText, setOtherPurposeText] = useState('');
  const [accompaniedBy, setAccompaniedBy] = useState('');

  // Date Picker States
  const [showSubmissionDatePicker, setShowSubmissionDatePicker] = useState(false);
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

  // Fetch account titles on mount
  useEffect(() => {
    fetchAccountTitles();
  }, []);

  const fetchAccountTitles = async () => {
    setAccountsLoading(true);
    try {
      const response = await axios.get(`${BASEURL}claim_expense_account.php`);
      if (response.data.status === 'true' || response.data.status === true) {
        const formattedAccounts = response.data.data
          .filter(account => account.inactive === '0' || account.inactive === 0)
          .map(account => ({
            label: account.account_name,
            value: account.account_code,
            account_code: account.account_code,
            account_name: account.account_name,
          }));
        setAccountTitles(formattedAccounts);
      } else {
        ToastAndroid.show('Failed to load expense types', ToastAndroid.SHORT);
      }
    } catch (error) {
      console.log('Expense types error:', error);
      ToastAndroid.show('Error loading expense types', ToastAndroid.SHORT);
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

  const handleCameraCapture = async () => {
    // Request camera permission on Android
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'App needs camera permission to take photos.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        ToastAndroid.show('Camera permission denied', ToastAndroid.SHORT);
        return;
      }
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
      saveToPhotos: false,
    };

    setImageLoading(true);

    launchCamera(options, response => {
      setImageLoading(false);

      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.error) {
        console.log('Camera Error: ', response.error);
        ToastAndroid.show('Error capturing image', ToastAndroid.SHORT);
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
      return filtered.map((item, index) => ({ ...item, srNo: index + 1 }));
    });
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      ToastAndroid.show('Please add at least one expense item', ToastAndroid.SHORT);
      return;
    }

    if (!selectedPurpose) {
      ToastAndroid.show('Please select a purpose', ToastAndroid.SHORT);
      return;
    }

    setLoading(true);

    try {
      const totalAmount = items.reduce(
        (sum, item) => sum + parseFloat(item.amount || 0),
        0,
      );

      // Build expense_detail array
      const expenseDetail = items.map(item => ({
        account_code: item.accountCode,
        line_date: formatDateForApi(item.date),
        amount: parseFloat(item.amount),
        line_memo: item.description || '',
      }));

      const formData = new FormData();
      formData.append('trans_date', formatDateForApi(submissionDate));
      formData.append('expense_type', selectedPurpose.toString());
      formData.append('amount', totalAmount.toString());
      formData.append('user_id', userId);
      formData.append('expense_detail', JSON.stringify(expenseDetail));
      formData.append('comments', accompaniedBy || '');
      formData.append('employee_id', employeeId);

      if (selectedImage) {
        const imageFile = {
          uri: selectedImage,
          type: 'image/jpeg',
          name: `expense_${Date.now()}.jpg`,
        };
        formData.append('filename', imageFile);
      }

      console.log('Submitting expense claim:', {
        trans_date: formatDateForApi(submissionDate),
        expense_type: selectedPurpose,
        amount: totalAmount,
        user_id: userId,
        expense_detail: expenseDetail,
        comments: accompaniedBy,
        employee_id: employeeId,
      });

      const response = await axios.post(
        `${BASEURL}post_service_expense_claim.php`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );

      if (
        response.data?.status === true || response.data?.status === 'true'
      ) {
        ToastAndroid.show('Expense claim submitted successfully', ToastAndroid.LONG);
        console.log("response", response.data);

        // Reset all fields
        setItems([]);
        setExpenseCategory(null);
        setDescription('');
        setAmount('');
        setSubmissionDate(new Date());
        setSelectedPurpose(null);
        setOtherPurposeText('');
        setAccompaniedBy('');
        setSelectedImage(null);

        // Refresh inquiry list and go back
        if (onRefresh) {
          onRefresh();
        }
        navigation.goBack();
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
        style={[styles.header, { paddingTop }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" color={COLORS.WHITE} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Expense Claim</Text>
        <View style={{ width: 28 }} />
      </PlatformGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Claim Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Claim Details</Text>

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

          {/* Purpose of Expense */}
          <View style={styles.purposeSection}>
            <Text style={styles.fieldLabel}>Purpose of Expense:</Text>
            <Text style={styles.purposeHint}>(Select one option)</Text>
            <View style={styles.checkboxGrid}>
              {PURPOSE_OPTIONS.map((purpose) => {
                const isSelected = selectedPurpose === purpose.id;

                return (
                  <TouchableOpacity
                    key={purpose.id}
                    style={styles.checkboxRow}
                    onPress={() => setSelectedPurpose(purpose.id)}>
                    <View style={[
                      styles.checkbox,
                      isSelected && styles.checkboxChecked,
                    ]}>
                      {isSelected && (
                        <Ionicons name="checkmark" size={14} color={COLORS.WHITE} />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>
                      {purpose.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Other Specify Field */}
            {selectedPurpose === 7 && (
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
                    <ActivityIndicator size="small" color={COLORS.AccentBlue} style={{ marginRight: 8 }} />
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

          {imageLoading ? (
            <View style={styles.attachButtonsRow}>
              <ActivityIndicator size="small" color={COLORS.AccentBlue} />
            </View>
          ) : (
            <View style={styles.attachButtonsRow}>
              <TouchableOpacity
                onPress={handleCameraCapture}
                style={styles.attachOptionButton}>
                <View style={[styles.attachIconWrap, { backgroundColor: '#3B82F6' }]}>
                  <Ionicons name="camera" size={24} color={COLORS.WHITE} />
                </View>
                <Text style={styles.attachOptionText}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleImagePicker}
                style={styles.attachOptionButton}>
                <View style={[styles.attachIconWrap, { backgroundColor: '#8B5CF6' }]}>
                  <Ionicons name="images" size={24} color={COLORS.WHITE} />
                </View>
                <Text style={styles.attachOptionText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          )}

          {selectedImage && (
            <TouchableOpacity
              style={styles.imagePreviewContainer}
              onPress={() => setShowImageModal(true)}>
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
              <Text style={styles.imagePreviewText}>Tap to view full image</Text>
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => setSelectedImage(null)}>
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
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

        <View style={{ height: 40 }} />
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
              <Image source={{ uri: selectedImage }} style={styles.modalImage} />
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
    shadowOffset: { width: 0, height: 2 },
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
  colSr: { width: 40 },
  colDate: { width: 100 },
  colCategory: { width: 150 },
  colDesc: { width: 130 },
  colAmount: { width: 100 },
  colAction: { width: 40, alignItems: 'center', justifyContent: 'center' },

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
  attachButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  attachOptionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.Border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  attachIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  attachOptionText: {
    color: COLORS.TextDark,
    fontSize: 14,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    position: 'relative',
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
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
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
    shadowOffset: { width: 0, height: 2 },
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
