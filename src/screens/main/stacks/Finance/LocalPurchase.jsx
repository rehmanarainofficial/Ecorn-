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
  PermissionsAndroid,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import {Dropdown} from 'react-native-element-dropdown';
import axios from 'axios';
import {BASEURL} from '../../../../utils/BaseUrl';
import {useSelector} from 'react-redux';
import SimpleHeader from '../../../../components/SimpleHeader';
import {formatToYYYYMMDD} from '../../../../utils/DateUtils';

// Material/Stores Category options
const CATEGORY_OPTIONS = [
  {label: 'Raw Material', value: 'raw_material'},
  {label: 'Packaging Material', value: 'packaging_material'},
  {label: 'Consumables', value: 'consumables'},
  {label: 'Chemicals', value: 'chemicals'},
  {label: 'Electrical', value: 'electrical'},
  {label: 'Mechanical', value: 'mechanical'},
  {label: 'Hardware', value: 'hardware'},
  {label: 'Stationery', value: 'stationery'},
  {label: 'Safety Equipment', value: 'safety_equipment'},
  {label: 'Other', value: 'other'},
];

// Product Type options
const PRODUCT_TYPE_OPTIONS = [
  {label: 'Spare Parts', value: 'spare_parts'},
  {label: 'Tools', value: 'tools'},
  {label: 'Equipment', value: 'equipment'},
  {label: 'Accessories', value: 'accessories'},
  {label: 'Components', value: 'components'},
  {label: 'Supplies', value: 'supplies'},
  {label: 'Lubricants', value: 'lubricants'},
  {label: 'Fasteners', value: 'fasteners'},
  {label: 'Bearings', value: 'bearings'},
  {label: 'Other', value: 'other'},
];

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
  Success: '#10B981',
  Danger: '#EF4444',
};

export default function LocalPurchase({navigation}) {
  const {id} = useSelector(state => state.Data.currentData);

  // Main Tab State
  const [mainTab, setMainTab] = useState('receipt'); // 'receipt' or 'payment'

  // Accounts State
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);

  // Expense Accounts State
  const [expenseAccounts, setExpenseAccounts] = useState([]);
  const [expenseAccountsLoading, setExpenseAccountsLoading] = useState(false);

  // Payment Category State
  const [paymentCategory, setPaymentCategory] = useState('factory_expenses');

  // Common State
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Receipt Form State
  const [receiptFrom, setReceiptFrom] = useState(null);
  const [receiptAmount, setReceiptAmount] = useState('');
  const [receiptImage, setReceiptImage] = useState(null);

  const [imageLoading, setImageLoading] = useState(false);

  // Payment Common State
  const [billsImage, setBillsImage] = useState(null);

  // Factory Expenses State
  const [factoryItems, setFactoryItems] = useState([]);
  const [factoryType, setFactoryType] = useState('');
  const [factoryDescription, setFactoryDescription] = useState('');
  const [factoryAmount, setFactoryAmount] = useState('');
  const [factoryItemImage, setFactoryItemImage] = useState(null);

  // Material Purchase State
  const [materialItems, setMaterialItems] = useState([]);
  const [materialCategory, setMaterialCategory] = useState('');
  const [materialProductType, setMaterialProductType] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [materialAmount, setMaterialAmount] = useState('');
  const [materialItemImage, setMaterialItemImage] = useState(null);

  // Stores, Spares and Tools State
  const [storesItems, setStoresItems] = useState([]);
  const [storesCategory, setStoresCategory] = useState('');
  const [storesProductType, setStoresProductType] = useState('');
  const [storesDescription, setStoresDescription] = useState('');
  const [storesAmount, setStoresAmount] = useState('');
  const [storesItemImage, setStoresItemImage] = useState(null);

  // Image Modal State
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImage, setModalImage] = useState(null);

  useEffect(() => {
    fetchAccounts();
    fetchExpenseAccounts();
  }, []);

  const fetchAccounts = async () => {
    setAccountsLoading(true);
    try {
      const response = await axios.get(`${BASEURL}local_purchase_account.php`);
      if (response.data?.status === 'true' && response.data?.data) {
        const mappedAccounts = response.data.data.map(acc => ({
          label: acc.account_name.replace(/label: acc.account_name,amp;/g, '&'),
          value: acc.account_code,
        }));
        setAccounts(mappedAccounts);
      }
    } catch (error) {
      console.log('Fetch Accounts Error:', error);
    } finally {
      setAccountsLoading(false);
    }
  };

  const formatDate = d => {
    const date = new Date(d);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const fetchExpenseAccounts = async () => {
    setExpenseAccountsLoading(true);
    try {
      const response = await axios.get(
        `${BASEURL}local_purchase_payment_account.php`,
      );
      if (response.data?.status === 'true' && response.data?.data) {
        const mappedAccounts = response.data.data.map(acc => ({
          label: acc.account_name.replace(/&amp;/g, '&'),
          value: acc.account_code,
        }));
        setExpenseAccounts(mappedAccounts);
      }
    } catch (error) {
      console.log('Fetch Expense Accounts Error:', error);
    } finally {
      setExpenseAccountsLoading(false);
    }
  };

  const formatDateForApi = d => {
    const date = new Date(d);
    return date.toISOString().split('T')[0];
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs access to your camera to take photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const pickImage = setImageFn => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
    };

    setImageLoading(true);
    launchImageLibrary(options, response => {
      setImageLoading(false);
      if (response.assets && response.assets.length > 0) {
        setImageFn(response.assets[0].uri);
      }
    });
  };

  const captureImage = async setImageFn => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      ToastAndroid.show('Camera permission denied', ToastAndroid.SHORT);
      return;
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
      if (response.assets && response.assets.length > 0) {
        setImageFn(response.assets[0].uri);
      }
    });
  };

  const viewImage = imageUri => {
    setModalImage(imageUri);
    setShowImageModal(true);
  };

  // Add item to Factory Expenses
  const addFactoryItem = () => {
    if (!factoryType || !factoryAmount.trim()) {
      ToastAndroid.show('Please fill Type and Amount', ToastAndroid.SHORT);
      return;
    }
    const typeLabel =
      FACTORY_TYPE_OPTIONS.find(o => o.value === factoryType)?.label ||
      factoryType;
    setFactoryItems([
      ...factoryItems,
      {
        id: Date.now(),
        type: typeLabel,
        typeValue: factoryType,
        description: factoryDescription,
        amount: factoryAmount,
        image: factoryItemImage,
      },
    ]);
    setFactoryType(null);
    setFactoryDescription('');
    setFactoryAmount('');
    setFactoryItemImage(null);
  };

  // Add item to Material Purchase
  const addMaterialItem = () => {
    if (!materialCategory || !materialAmount.trim()) {
      ToastAndroid.show('Please fill Category and Amount', ToastAndroid.SHORT);
      return;
    }
    const categoryLabel =
      CATEGORY_OPTIONS.find(o => o.value === materialCategory)?.label ||
      materialCategory;
    const productTypeLabel =
      PRODUCT_TYPE_OPTIONS.find(o => o.value === materialProductType)?.label ||
      materialProductType;
    setMaterialItems([
      ...materialItems,
      {
        id: Date.now(),
        category: categoryLabel,
        categoryValue: materialCategory,
        productType: productTypeLabel,
        productTypeValue: materialProductType,
        description: materialDescription,
        amount: materialAmount,
        image: materialItemImage,
      },
    ]);
    setMaterialCategory(null);
    setMaterialProductType(null);
    setMaterialDescription('');
    setMaterialAmount('');
    setMaterialItemImage(null);
  };

  // Add item to Stores
  const addStoresItem = () => {
    if (!storesCategory || !storesAmount.trim()) {
      ToastAndroid.show('Please fill Category and Amount', ToastAndroid.SHORT);
      return;
    }
    const categoryLabel =
      CATEGORY_OPTIONS.find(o => o.value === storesCategory)?.label ||
      storesCategory;
    const productTypeLabel =
      PRODUCT_TYPE_OPTIONS.find(o => o.value === storesProductType)?.label ||
      storesProductType;
    setStoresItems([
      ...storesItems,
      {
        id: Date.now(),
        category: categoryLabel,
        categoryValue: storesCategory,
        productType: productTypeLabel,
        productTypeValue: storesProductType,
        description: storesDescription,
        amount: storesAmount,
        image: storesItemImage,
      },
    ]);
    setStoresCategory(null);
    setStoresProductType(null);
    setStoresDescription('');
    setStoresAmount('');
    setStoresItemImage(null);
  };

  const removeFactoryItem = itemId => {
    setFactoryItems(factoryItems.filter(item => item.id !== itemId));
  };

  const removeMaterialItem = itemId => {
    setMaterialItems(materialItems.filter(item => item.id !== itemId));
  };

  const removeStoresItem = itemId => {
    setStoresItems(storesItems.filter(item => item.id !== itemId));
  };

  const calculateTotal = items => {
    return items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  };

  const formatNumber = num => {
    return parseFloat(num).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (mainTab === 'receipt') {
        if (!receiptFrom) {
          ToastAndroid.show('Please select Receipt From', ToastAndroid.SHORT);
          setLoading(false);
          return;
        }
        if (!receiptAmount.trim()) {
          ToastAndroid.show('Please enter Amount', ToastAndroid.SHORT);
          setLoading(false);
          return;
        }

        if (!id) {
          ToastAndroid.show(
            'User ID not found. Please login again.',
            ToastAndroid.SHORT,
          );
          setLoading(false);
          return;
        }

        const body = new FormData();
        body.append('trans_date', formatToYYYYMMDD(date));
        body.append('amount', receiptAmount.trim());
        body.append('user_id', id);

        const receiptDetail = [
          {
            account_code: receiptFrom,
            amount: receiptAmount.trim(),
          },
        ];
        body.append('receipt_detail', JSON.stringify(receiptDetail));

        if (receiptImage) {
          const imageFile = {
            uri: receiptImage,
            type: 'image/jpeg',
            name: `receipt_${Date.now()}.jpg`,
          };
          body.append('filename', imageFile);
        }

        console.log('Receipt Submission Data:', {
          trans_date: formatToYYYYMMDD(date),
          amount: receiptAmount.trim(),
          user_id: id,
          receipt_detail: receiptDetail,
          has_image: !!receiptImage,
        });

        const response = await axios.post(
          `${BASEURL}post_local_purchase_receipt.php`,
          body,
          {
            timeout: 30000,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        );

        if (
          response.data?.status === true ||
          response.data?.status === 'true'
        ) {
          ToastAndroid.show('Submitted successfully', ToastAndroid.LONG);
          resetForm();
        } else {
          ToastAndroid.show(
            response.data?.message || 'Server error',
            ToastAndroid.LONG,
          );
        }
      } else {
        // Payment
        if (!id) {
          ToastAndroid.show(
            'User ID not found. Please login again.',
            ToastAndroid.SHORT,
          );
          setLoading(false);
          return;
        }

        let items = [];
        if (paymentCategory === 'factory_expenses') {
          if (factoryItems.length === 0) {
            ToastAndroid.show(
              'Please add at least one item',
              ToastAndroid.SHORT,
            );
            setLoading(false);
            return;
          }
          items = factoryItems;
        } else if (paymentCategory === 'material_purchase') {
          if (materialItems.length === 0) {
            ToastAndroid.show(
              'Please add at least one item',
              ToastAndroid.SHORT,
            );
            setLoading(false);
            return;
          }
          items = materialItems;
        } else {
          if (storesItems.length === 0) {
            ToastAndroid.show(
              'Please add at least one item',
              ToastAndroid.SHORT,
            );
            setLoading(false);
            return;
          }
          items = storesItems;
        }

        const totalAmount = calculateTotal(items);

        // Map items to expense_detail
        // Note: account_code is mapped from typeValue/categoryValue
        // We ensure line_memo and amount are correctly set
        const expenseDetail = items.map(item => ({
          account_code: item.typeValue || item.categoryValue || '',
          amount: parseFloat(item.amount),
          line_memo: item.description || '',
        }));

        const formData = new FormData();
        formData.append('trans_date', formatToYYYYMMDD(date));
        formData.append('amount', totalAmount.toString());
        formData.append('user_id', id);
        formData.append('expense_detail', JSON.stringify(expenseDetail));

        if (billsImage) {
          const imageFile = {
            uri: billsImage,
            type: 'image/jpeg',
            name: `bills_${Date.now()}.jpg`,
          };
          formData.append('filename', imageFile);
        }

        console.log('Payment Submission Data:', {
          trans_date: formatToYYYYMMDD(date),
          amount: totalAmount,
          user_id: id,
          expense_detail: expenseDetail,
          has_filename: !!billsImage,
        });

        const response = await axios.post(
          `${BASEURL}post_local_purchase_payment.php`,
          formData,
          {
            timeout: 30000,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        );

        console.log('Payment API Response:', response.data);

        if (
          response.data?.status === true ||
          response.data?.status === 'true'
        ) {
          ToastAndroid.show('Submitted successfully', ToastAndroid.LONG);
          resetForm();
        } else {
          ToastAndroid.show(
            response.data?.message || 'Server error',
            ToastAndroid.LONG,
          );
        }
      }
    } catch (error) {
      console.log('Submission Error:', error.response?.data || error.message);
      const errorMsg =
        error.response?.data?.message || error.message || 'Network error';
      ToastAndroid.show(`Error: ${errorMsg}`, ToastAndroid.LONG);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setReceiptFrom(null);
    setReceiptAmount('');
    setReceiptImage(null);
    setBillsImage(null);
    setFactoryItems([]);
    setMaterialItems([]);
    setStoresItems([]);
    setDate(new Date());
  };

  // Render Image Picker Buttons
  const renderImagePicker = (image, setImage, label = 'Attachment') => (
    <View style={styles.attachmentSection}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.imageButtonsRow}>
        <TouchableOpacity
          style={styles.imageButton}
          onPress={() => pickImage(setImage)}>
          <Ionicons name="images-outline" size={20} color={COLORS.AccentBlue} />
          <Text style={styles.imageButtonText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.imageButton}
          onPress={() => captureImage(setImage)}>
          <Ionicons name="camera-outline" size={20} color={COLORS.AccentBlue} />
          <Text style={styles.imageButtonText}>Camera</Text>
        </TouchableOpacity>
      </View>
      {image && (
        <View style={styles.imagePreviewSmall}>
          <TouchableOpacity onPress={() => viewImage(image)}>
            <Image source={{uri: image}} style={styles.thumbnailImage} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeImageBtnSmall}
            onPress={() => setImage(null)}>
            <Ionicons name="close-circle" size={22} color={COLORS.Danger} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Render Receipt Form
  const renderReceiptForm = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Receipt Details</Text>

      {/* Date */}
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>Date</Text>
        <TouchableOpacity
          style={styles.dateField}
          onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateText}>{formatDate(date)}</Text>
          <Ionicons
            name="calendar-outline"
            size={20}
            color={COLORS.LabelColor}
          />
        </TouchableOpacity>
      </View>

      {/* Receipt From */}
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>Receipt From</Text>
        <Dropdown
          style={styles.dropdown}
          placeholderStyle={styles.dropdownPlaceholder}
          selectedTextStyle={styles.dropdownSelectedText}
          data={accounts}
          labelField="label"
          valueField="value"
          placeholder={accountsLoading ? 'Loading...' : 'Select Receipt From'}
          value={receiptFrom}
          onChange={item => {
            setReceiptFrom(item.value);
          }}
          search
          searchPlaceholder="Search account..."
        />
      </View>

      {/* Amount */}
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>Amount</Text>
        <TextInput
          style={styles.inputField}
          placeholder="0.00"
          placeholderTextColor={COLORS.LabelColor}
          keyboardType="numeric"
          value={receiptAmount}
          onChangeText={setReceiptAmount}
        />
      </View>

      {/* Attachment */}
      {renderImagePicker(receiptImage, setReceiptImage, 'Attach Picture')}
    </View>
  );

  // Render Factory Expenses Form
  const renderFactoryExpensesForm = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Factory Expenses</Text>

      {/* Add Item Form */}
      <View style={styles.addItemForm}>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Type</Text>
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownSelectedText}
            data={expenseAccounts}
            labelField="label"
            valueField="value"
            placeholder={expenseAccountsLoading ? 'Loading...' : 'Select Type'}
            value={factoryType}
            onChange={item => setFactoryType(item.value)}
            search
            searchPlaceholder="Search expense type..."
          />
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            style={styles.inputField}
            placeholder="Enter description..."
            placeholderTextColor={COLORS.LabelColor}
            value={factoryDescription}
            onChangeText={setFactoryDescription}
          />
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Amount</Text>
          <TextInput
            style={styles.inputField}
            placeholder="0.00"
            placeholderTextColor={COLORS.LabelColor}
            keyboardType="numeric"
            value={factoryAmount}
            onChangeText={setFactoryAmount}
          />
        </View>

        <TouchableOpacity style={styles.addItemBtn} onPress={addFactoryItem}>
          <Ionicons name="add-circle" size={20} color={COLORS.WHITE} />
          <Text style={styles.addItemBtnText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      {/* Items Table */}
      {factoryItems.length > 0 && (
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, {flex: 0.5}]}>#</Text>
            <Text style={[styles.tableHeaderCell, {flex: 1}]}>Type</Text>
            <Text style={[styles.tableHeaderCell, {flex: 1.5}]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderCell, {flex: 1}]}>Amount</Text>
            <Text style={[styles.tableHeaderCell, {flex: 0.5}]}>Att.</Text>
            <Text style={[styles.tableHeaderCell, {flex: 0.5}]}></Text>
          </View>
          {factoryItems.map((item, index) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, {flex: 0.5}]}>{index + 1}</Text>
              <Text style={[styles.tableCell, {flex: 1}]} numberOfLines={1}>
                {item.type}
              </Text>
              <Text style={[styles.tableCell, {flex: 1.5}]} numberOfLines={1}>
                {item.description || '-'}
              </Text>
              <Text style={[styles.tableCell, {flex: 1}]}>
                {formatNumber(item.amount)}
              </Text>
              <View style={[styles.tableCell, {flex: 0.5}]}>
                {item.image && (
                  <TouchableOpacity onPress={() => viewImage(item.image)}>
                    <Ionicons
                      name="image"
                      size={18}
                      color={COLORS.AccentBlue}
                    />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={[styles.tableCell, {flex: 0.5}]}
                onPress={() => removeFactoryItem(item.id)}>
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={COLORS.Danger}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  // Render Material Purchase Form
  const renderMaterialPurchaseForm = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Material Purchase</Text>

      {/* Add Item Form */}
      <View style={styles.addItemForm}>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Category</Text>
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownSelectedText}
            data={CATEGORY_OPTIONS}
            labelField="label"
            valueField="value"
            placeholder="Select Category"
            value={materialCategory}
            onChange={item => setMaterialCategory(item.value)}
          />
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Product Type</Text>
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownSelectedText}
            data={PRODUCT_TYPE_OPTIONS}
            labelField="label"
            valueField="value"
            placeholder="Select Product Type"
            value={materialProductType}
            onChange={item => setMaterialProductType(item.value)}
          />
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            style={styles.inputField}
            placeholder="Enter description..."
            placeholderTextColor={COLORS.LabelColor}
            value={materialDescription}
            onChangeText={setMaterialDescription}
          />
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Amount</Text>
          <TextInput
            style={styles.inputField}
            placeholder="0.00"
            placeholderTextColor={COLORS.LabelColor}
            keyboardType="numeric"
            value={materialAmount}
            onChangeText={setMaterialAmount}
          />
        </View>

        {renderImagePicker(
          materialItemImage,
          setMaterialItemImage,
          'Attachment',
        )}

        <TouchableOpacity style={styles.addItemBtn} onPress={addMaterialItem}>
          <Ionicons name="add-circle" size={20} color={COLORS.WHITE} />
          <Text style={styles.addItemBtnText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      {/* Items Table */}
      {materialItems.length > 0 && (
        <>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, {flex: 0.4}]}>#</Text>
              <Text style={[styles.tableHeaderCell, {flex: 1}]}>Category</Text>
              <Text style={[styles.tableHeaderCell, {flex: 1}]}>Product</Text>
              <Text style={[styles.tableHeaderCell, {flex: 1}]}>Desc</Text>
              <Text style={[styles.tableHeaderCell, {flex: 0.8}]}>Amount</Text>
              <Text style={[styles.tableHeaderCell, {flex: 0.4}]}>Att.</Text>
              <Text style={[styles.tableHeaderCell, {flex: 0.4}]}></Text>
            </View>
            {materialItems.map((item, index) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, {flex: 0.4}]}>{index + 1}</Text>
                <Text style={[styles.tableCell, {flex: 1}]} numberOfLines={1}>
                  {item.category}
                </Text>
                <Text style={[styles.tableCell, {flex: 1}]} numberOfLines={1}>
                  {item.productType || '-'}
                </Text>
                <Text style={[styles.tableCell, {flex: 1}]} numberOfLines={1}>
                  {item.description || '-'}
                </Text>
                <Text style={[styles.tableCell, {flex: 0.8}]}>
                  {formatNumber(item.amount)}
                </Text>
                <View style={[styles.tableCell, {flex: 0.4}]}>
                  {item.image && (
                    <TouchableOpacity onPress={() => viewImage(item.image)}>
                      <Ionicons
                        name="image"
                        size={18}
                        color={COLORS.AccentBlue}
                      />
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.tableCell, {flex: 0.4}]}
                  onPress={() => removeMaterialItem(item.id)}>
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={COLORS.Danger}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalValue}>
              {formatNumber(calculateTotal(materialItems))}
            </Text>
          </View>
        </>
      )}
    </View>
  );

  // Render Stores, Spares and Tools Form
  const renderStoresForm = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Stores, Spares and Tools</Text>

      {/* Add Item Form */}
      <View style={styles.addItemForm}>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Category</Text>
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownSelectedText}
            data={CATEGORY_OPTIONS}
            labelField="label"
            valueField="value"
            placeholder="Select Category"
            value={storesCategory}
            onChange={item => setStoresCategory(item.value)}
          />
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Product Type</Text>
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownSelectedText}
            data={PRODUCT_TYPE_OPTIONS}
            labelField="label"
            valueField="value"
            placeholder="Select Product Type"
            value={storesProductType}
            onChange={item => setStoresProductType(item.value)}
          />
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            style={styles.inputField}
            placeholder="Enter description..."
            placeholderTextColor={COLORS.LabelColor}
            value={storesDescription}
            onChangeText={setStoresDescription}
          />
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Amount</Text>
          <TextInput
            style={styles.inputField}
            placeholder="0.00"
            placeholderTextColor={COLORS.LabelColor}
            keyboardType="numeric"
            value={storesAmount}
            onChangeText={setStoresAmount}
          />
        </View>

        {renderImagePicker(storesItemImage, setStoresItemImage, 'Attachment')}

        <TouchableOpacity style={styles.addItemBtn} onPress={addStoresItem}>
          <Ionicons name="add-circle" size={20} color={COLORS.WHITE} />
          <Text style={styles.addItemBtnText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      {/* Items Table */}
      {storesItems.length > 0 && (
        <>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, {flex: 0.4}]}>#</Text>
              <Text style={[styles.tableHeaderCell, {flex: 1}]}>Category</Text>
              <Text style={[styles.tableHeaderCell, {flex: 1}]}>Product</Text>
              <Text style={[styles.tableHeaderCell, {flex: 1}]}>Desc</Text>
              <Text style={[styles.tableHeaderCell, {flex: 0.8}]}>Amount</Text>
              <Text style={[styles.tableHeaderCell, {flex: 0.4}]}>Att.</Text>
              <Text style={[styles.tableHeaderCell, {flex: 0.4}]}></Text>
            </View>
            {storesItems.map((item, index) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, {flex: 0.4}]}>{index + 1}</Text>
                <Text style={[styles.tableCell, {flex: 1}]} numberOfLines={1}>
                  {item.category}
                </Text>
                <Text style={[styles.tableCell, {flex: 1}]} numberOfLines={1}>
                  {item.productType || '-'}
                </Text>
                <Text style={[styles.tableCell, {flex: 1}]} numberOfLines={1}>
                  {item.description || '-'}
                </Text>
                <Text style={[styles.tableCell, {flex: 0.8}]}>
                  {formatNumber(item.amount)}
                </Text>
                <View style={[styles.tableCell, {flex: 0.4}]}>
                  {item.image && (
                    <TouchableOpacity onPress={() => viewImage(item.image)}>
                      <Ionicons
                        name="image"
                        size={18}
                        color={COLORS.AccentBlue}
                      />
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.tableCell, {flex: 0.4}]}
                  onPress={() => removeStoresItem(item.id)}>
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={COLORS.Danger}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalValue}>
              {formatNumber(calculateTotal(storesItems))}
            </Text>
          </View>
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <SimpleHeader title="Local Purchase" />

      {/* Main Tab Selection */}
      <View style={styles.mainTabContainer}>
        <TouchableOpacity
          style={[
            styles.mainTab,
            mainTab === 'receipt' && styles.mainTabActive,
          ]}
          onPress={() => setMainTab('receipt')}>
          <Ionicons
            name="receipt-outline"
            size={18}
            color={mainTab === 'receipt' ? COLORS.WHITE : COLORS.TextDark}
          />
          <Text
            style={[
              styles.mainTabText,
              mainTab === 'receipt' && styles.mainTabTextActive,
            ]}>
            Receipt
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.mainTab,
            mainTab === 'payment' && styles.mainTabActive,
          ]}
          onPress={() => setMainTab('payment')}>
          <Ionicons
            name="wallet-outline"
            size={18}
            color={mainTab === 'payment' ? COLORS.WHITE : COLORS.TextDark}
          />
          <Text
            style={[
              styles.mainTabText,
              mainTab === 'payment' && styles.mainTabTextActive,
            ]}>
            Payment
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {mainTab === 'receipt' ? (
          renderReceiptForm()
        ) : (
          <>
            {/* Payment Category Selection */}
            <View style={styles.categoryContainer}>
              <TouchableOpacity
                style={[
                  styles.categoryBtn,
                  paymentCategory === 'factory_expenses' &&
                    styles.categoryBtnActive,
                ]}
                onPress={() => setPaymentCategory('factory_expenses')}>
                <Text
                  style={[
                    styles.categoryBtnText,
                    paymentCategory === 'factory_expenses' &&
                      styles.categoryBtnTextActive,
                  ]}>
                  Factory Expenses
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.categoryBtn,
                  paymentCategory === 'material_purchase' &&
                    styles.categoryBtnActive,
                ]}
                onPress={() => setPaymentCategory('material_purchase')}>
                <Text
                  style={[
                    styles.categoryBtnText,
                    paymentCategory === 'material_purchase' &&
                      styles.categoryBtnTextActive,
                  ]}>
                  Material Purchase
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.categoryBtn,
                  paymentCategory === 'stores_spares' &&
                    styles.categoryBtnActive,
                ]}
                onPress={() => setPaymentCategory('stores_spares')}>
                <Text
                  style={[
                    styles.categoryBtnText,
                    paymentCategory === 'stores_spares' &&
                      styles.categoryBtnTextActive,
                  ]}>
                  Stores, Spares & Tools
                </Text>
              </TouchableOpacity>
            </View>

            {/* Serial No & Date for Payment */}
            <View style={styles.card}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Date</Text>
                <TouchableOpacity
                  style={styles.dateField}
                  onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.dateText}>{formatDate(date)}</Text>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={COLORS.LabelColor}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {paymentCategory === 'factory_expenses' &&
              renderFactoryExpensesForm()}
            {paymentCategory === 'material_purchase' &&
              renderMaterialPurchaseForm()}
            {paymentCategory === 'stores_spares' && renderStoresForm()}

            <View style={styles.card}>
              {renderImagePicker(billsImage, setBillsImage, 'Bills Attachment')}
            </View>
          </>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.WHITE} />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={COLORS.WHITE}
              />
              <Text style={styles.submitBtnText}>Submit</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{height: 80}} />
      </ScrollView>

      {/* Date Picker */}
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        onConfirm={selectedDate => {
          setDate(selectedDate);
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
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
            {modalImage && (
              <Image
                source={{uri: modalImage}}
                style={styles.modalImage}
                resizeMode="contain"
              />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Main Tab Styles
  mainTabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  mainTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  mainTabActive: {
    backgroundColor: COLORS.Primary,
  },
  mainTabText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TextDark,
  },
  mainTabTextActive: {
    color: COLORS.WHITE,
  },

  // Category Styles
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.Border,
  },
  categoryBtnActive: {
    backgroundColor: COLORS.Primary,
    borderColor: COLORS.Primary,
  },
  categoryBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TextDark,
  },
  categoryBtnTextActive: {
    color: COLORS.WHITE,
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
  serialField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.Border,
  },
  serialText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TextDark,
    letterSpacing: 2,
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
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.WHITE,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.Border,
  },
  dateText: {
    fontSize: 15,
    color: COLORS.TextDark,
  },
  inputField: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.Border,
    fontSize: 15,
    color: COLORS.TextDark,
  },
  dropdown: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.Border,
  },
  dropdownPlaceholder: {
    color: COLORS.LabelColor,
    fontSize: 15,
  },
  dropdownSelectedText: {
    color: COLORS.TextDark,
    fontSize: 15,
  },

  // Add Item Form
  addItemForm: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.Primary,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
    marginTop: 8,
  },
  addItemBtnText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '600',
  },

  // Table Styles
  tableContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.Border,
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.Primary,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    color: COLORS.WHITE,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.Border,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 11,
    color: COLORS.TextDark,
    textAlign: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.TextDark,
    marginRight: 12,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.AccentBlue,
  },

  // Paid From Section
  paidFromSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.Border,
    paddingTop: 16,
    marginTop: 8,
  },

  // Attachment Section
  attachmentSection: {
    marginBottom: 16,
  },
  imageButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.AccentBlue,
    borderStyle: 'dashed',
    gap: 6,
  },
  imageButtonText: {
    color: COLORS.AccentBlue,
    fontSize: 13,
    fontWeight: '600',
  },
  imagePreviewSmall: {
    marginTop: 10,
    alignItems: 'center',
    position: 'relative',
  },
  thumbnailImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageBtnSmall: {
    position: 'absolute',
    top: -8,
    right: '35%',
    backgroundColor: COLORS.WHITE,
    borderRadius: 11,
  },

  // Submit Button Styles
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.Primary,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitBtnText: {
    color: COLORS.WHITE,
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
    height: 350,
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
