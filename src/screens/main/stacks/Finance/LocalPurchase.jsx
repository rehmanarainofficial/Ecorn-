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

// Material Category options (labels provided by user)
const CATEGORY_OPTIONS = [
  {label: 'Electrical Raw Material', value: '1'},
  {label: 'Mechanical Raw Material', value: '2'},
  {label: 'Powder Coating Paint', value: '3'},
  {label: 'Liquid Paint', value: '4'},
  {label: 'Cable', value: '5'},
  {label: 'Hardware', value: '6'},
  {label: 'Accessories - Mechanical', value: '7'},
  {label: 'Accessories - Electrical', value: '8'},
  {label: 'Plastic Raw Material - Mould', value: '9'},
  {label: 'Metal Raw Material - Mould', value: '10'},
  {label: 'Copper Raw Material Mould', value: '11'},
];

// Product types will be populated from locations.php (fetched at runtime)

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
  

  // Material Purchase State
  const [materialItems, setMaterialItems] = useState([]);
  const [materialCategory, setMaterialCategory] = useState('');
  const [materialProductType, setMaterialProductType] = useState('');
  const [materialProductTypeLabel, setMaterialProductTypeLabel] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [materialAmount, setMaterialAmount] = useState('');
  const [materialCurrentImages, setMaterialCurrentImages] = useState([]);

  // Locations for Product Type (fetched from locations.php)
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  // Multi-file attachments for material and factory
  const [materialFiles, setMaterialFiles] = useState([]);
  const [factoryFiles, setFactoryFiles] = useState([]);

  // (Removed Stores/Spares/Tools state as per request)

  // Image Modal State
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImage, setModalImage] = useState(null);

  useEffect(() => {
    fetchAccounts();
    fetchExpenseAccounts();
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setLocationsLoading(true);
    try {
      const response = await axios.get(`${BASEURL}locations.php`);
      if (response.data?.status === 'true' && response.data?.data) {
        const mapped = response.data.data.map(loc => ({
          label: loc.location_name,
          value: loc.loc_code,
        }));
        setLocations(mapped);
      }
    } catch (error) {
      console.log('Fetch Locations Error:', error);
    } finally {
      setLocationsLoading(false);
    }
  };

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

  const pickMultipleImages = (currentArraySetter, append = false) => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1200,
      maxHeight: 1200,
      selectionLimit: 0, // allow multiple
    };

    setImageLoading(true);
    launchImageLibrary(options, response => {
      setImageLoading(false);
      if (response.assets && response.assets.length > 0) {
        const uris = response.assets.map(a => a.uri);
        if (append) {
          currentArraySetter(prev => [...prev, ...uris]);
        } else {
          currentArraySetter(uris);
        }
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
      expenseAccounts.find(o => o.value === factoryType)?.label ||
      factoryType;
    setFactoryItems([
      ...factoryItems,
      {
        id: Date.now(),
        type: typeLabel,
        typeValue: factoryType,
        description: factoryDescription,
        amount: factoryAmount,
      },
    ]);
    setFactoryType(null);
    setFactoryDescription('');
    setFactoryAmount('');
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
      locations.find(o => o.value === materialProductType)?.label ||
      materialProductType;
    setMaterialItems([
      ...materialItems,
      {
        id: Date.now(),
        category: categoryLabel,
        categoryValue: materialCategory,
        productType: productTypeLabel,
        productTypeValue: materialProductType,
        productTypeLabel: materialProductTypeLabel,
        description: materialDescription,
        amount: materialAmount,
        images: [...materialCurrentImages],
      },
    ]);
    setMaterialCategory(null);
    setMaterialProductType(null);
    setMaterialProductTypeLabel('');
    setMaterialDescription('');
    setMaterialAmount('');
    setMaterialCurrentImages([]);
  };


  const removeFactoryItem = itemId => {
    setFactoryItems(factoryItems.filter(item => item.id !== itemId));
  };

  const removeMaterialItem = itemId => {
    setMaterialItems(materialItems.filter(item => item.id !== itemId));
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
            ToastAndroid.show('Please add at least one item', ToastAndroid.SHORT);
            setLoading(false);
            return;
          }
          items = factoryItems;
        } else if (paymentCategory === 'material_purchase') {
          if (materialItems.length === 0) {
            ToastAndroid.show('Please add at least one item', ToastAndroid.SHORT);
            setLoading(false);
            return;
          }
          items = materialItems;
        } else {
          ToastAndroid.show('Invalid payment category', ToastAndroid.SHORT);
          setLoading(false);
          return;
        }

        const totalAmount = calculateTotal(items);

        const expenseDetail = items.map(item => {
          if (paymentCategory === 'material_purchase') {
            // Material Purchase: loc_code, category_id, amount, line_memo
            const locCode = item.productTypeValue || '';
            const categoryId = item.categoryValue || '';
            const categoryName = item.category || '';
            const costCenterName = item.productTypeLabel || item.productType || '';
            const description = item.description || '';
            
            const lineMemo = `${categoryName}; ${costCenterName}; ${description}`;
            
            return {
              loc_code: locCode,
              category_id: categoryId,
              amount: parseFloat(item.amount),
              line_memo: lineMemo,
            };
          } else {
            // Factory Purchase: account_code, amount, line_memo
            const accountCode = item.typeValue || '';
            const description = item.description || '';
            
            // line_memo: just the description
            const lineMemo = description;
            
            return {
              account_code: accountCode,
              amount: parseFloat(item.amount),
              line_memo: lineMemo,
            };
          }
        });

        const formData = new FormData();
        formData.append('trans_date', formatToYYYYMMDD(date));
        formData.append('amount', totalAmount.toString());
        formData.append('user_id', id);
        formData.append('expense_detail', JSON.stringify(expenseDetail));

        // Append bills image (single) if present
        if (billsImage) {
          const imageFile = {
            uri: billsImage,
            type: 'image/jpeg',
            name: `bills_${Date.now()}.jpg`,
          };
          formData.append('filename', imageFile);
        }

        // Append images from items (both factory and material)
        // Each item can have multiple images attached
        if (paymentCategory === 'material_purchase') {
          items.forEach((item, itemIdx) => {
            if (item.images && item.images.length > 0) {
              item.images.forEach((uri, imgIdx) => {
                formData.append('filename[]', {
                  uri,
                  type: 'image/jpeg',
                  name: `material_item_${itemIdx + 1}_${imgIdx + 1}_${Date.now()}.jpg`,
                });
              });
            }
          });
        }

        if (paymentCategory === 'factory_expenses') {
          if (factoryFiles.length > 0) {
            factoryFiles.forEach((uri, idx) => {
              formData.append('filename[]', {
                uri,
                type: 'image/jpeg',
                name: `factory_${Date.now()}_${idx}.jpg`,
              });
            });
          }
          // Also include images from factory items
          items.forEach((item, itemIdx) => {
            if (item.images && item.images.length > 0) {
              item.images.forEach((uri, imgIdx) => {
                formData.append('filename[]', {
                  uri,
                  type: 'image/jpeg',
                  name: `factory_item_${itemIdx + 1}_${imgIdx + 1}_${Date.now()}.jpg`,
                });
              });
            }
          });
        }

        const apiEndpoint = paymentCategory === 'material_purchase' 
          ? 'post_local_purchase_material.php'
          : 'post_local_purchase_payment.php';

        console.log('Payment Submission Data:', {
          endpoint: apiEndpoint,
          trans_date: formatToYYYYMMDD(date),
          amount: totalAmount,
          user_id: id,
          expense_detail: expenseDetail,
          has_bills_image: !!billsImage,
          total_item_images: items.reduce((sum, item) => sum + (item.images?.length || 0), 0),
        });

        const response = await axios.post(
          `${BASEURL}${apiEndpoint}`,
          formData,
          {
            timeout: 30000,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        );

        console.log('API Response:', response.data);

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
    setFactoryFiles([]);
    setMaterialFiles([]);
    setMaterialCurrentImages([]);
    setDate(new Date());
  };

  // Render Image Picker Buttons
  const renderImagePicker = (image, setImage, label = 'Attachment') => (
    <View style={styles.attachmentSection}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.imageButtonsRow}>
        <TouchableOpacity
          style={[styles.imageButton, imageLoading && styles.imageButtonDisabled]}
          onPress={() => pickImage(setImage)}
          disabled={imageLoading}>
          {imageLoading ? (
            <ActivityIndicator size="small" color={COLORS.AccentBlue} />
          ) : (
            <Ionicons name="images-outline" size={20} color={COLORS.AccentBlue} />
          )}
          <Text style={[styles.imageButtonText, imageLoading && styles.imageButtonTextDisabled]}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.imageButton, imageLoading && styles.imageButtonDisabled]}
          onPress={() => captureImage(setImage)}
          disabled={imageLoading}>
          {imageLoading ? (
            <ActivityIndicator size="small" color={COLORS.AccentBlue} />
          ) : (
            <Ionicons name="camera-outline" size={20} color={COLORS.AccentBlue} />
          )}
          <Text style={[styles.imageButtonText, imageLoading && styles.imageButtonTextDisabled]}>Camera</Text>
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
            <Text style={[styles.tableHeaderCell, {flex: 0.6}]}>#</Text>
            <Text style={[styles.tableHeaderCell, {flex: 1}]}>Type</Text>
            <Text style={[styles.tableHeaderCell, {flex: 1.6}]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderCell, {flex: 1}]}>Amount</Text>
            <Text style={[styles.tableHeaderCell, {flex: 0.5}]}></Text>
          </View>
          {factoryItems.map((item, index) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, {flex: 0.6}]}>{index + 1}</Text>
              <Text style={[styles.tableCell, {flex: 1}]} numberOfLines={1}>
                {item.type}
              </Text>
              <Text style={[styles.tableCell, {flex: 1.6}]} numberOfLines={1}>
                {item.description || '-'}
              </Text>
              <Text style={[styles.tableCell, {flex: 1}]}> 
                {formatNumber(item.amount)}
              </Text>
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
          <Text style={styles.fieldLabel}>Cost Center</Text>
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownSelectedText}
            data={locations}
            labelField="label"
            valueField="value"
            placeholder={locationsLoading ? 'Loading...' : 'Select Cost Center'}
            value={materialProductType}
            onChange={item => {
              setMaterialProductType(item.value);
              setMaterialProductTypeLabel(item.label);
            }}
            search
            searchPlaceholder="Search location..."
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
              <Text style={[styles.tableHeaderCell, {flex: 0.3}]}>#</Text>
              <Text style={[styles.tableHeaderCell, {flex: 0.8}]}>Category</Text>
              <Text style={[styles.tableHeaderCell, {flex: 0.8}]}>Cost Ctr</Text>
              <Text style={[styles.tableHeaderCell, {flex: 0.8}]}>Desc</Text>
              <Text style={[styles.tableHeaderCell, {flex: 0.6}]}>Amt</Text>
              <Text style={[styles.tableHeaderCell, {flex: 0.5}]}>Imgs</Text>
              <Text style={[styles.tableHeaderCell, {flex: 0.4}]}></Text>
            </View>
            {materialItems.map((item, index) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, {flex: 0.3}]}>{index + 1}</Text>
                <Text style={[styles.tableCell, {flex: 0.8}]} numberOfLines={1}>
                  {item.category}
                </Text>
                <Text style={[styles.tableCell, {flex: 0.8}]} numberOfLines={1}>
                  {item.productType || '-'}
                </Text>
                <Text style={[styles.tableCell, {flex: 0.8}]} numberOfLines={1}>
                  {item.description || '-'}
                </Text>
                <Text style={[styles.tableCell, {flex: 0.6}]}> 
                  {formatNumber(item.amount)}
                </Text>
                <Text style={[styles.tableCell, {flex: 0.5, color: item.images?.length > 0 ? COLORS.Success : COLORS.LabelColor}]}>
                  {item.images?.length || 0}
                </Text>
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

      {/* Image Loading Indicator Modal */}
      <Modal
        visible={imageLoading}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}>
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.AccentBlue} />
            <Text style={styles.loadingText}>Loading images...</Text>
          </View>
        </View>
      </Modal>

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
  imageButtonDisabled: {
    backgroundColor: '#E5E7EB',
    borderColor: '#D1D5DB',
    opacity: 0.6,
  },
  imageButtonText: {
    color: COLORS.AccentBlue,
    fontSize: 13,
    fontWeight: '600',
  },
  imageButtonTextDisabled: {
    color: '#6B7280',
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

  // Loading Overlay Styles
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    paddingVertical: 40,
    paddingHorizontal: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TextDark,
  },
});
