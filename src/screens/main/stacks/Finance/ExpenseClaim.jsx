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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Dropdown} from 'react-native-element-dropdown';
import LinearGradient from 'react-native-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import {launchImageLibrary} from 'react-native-image-picker';
import axios from 'axios';
import {BASEURL} from '../../../../utils/BaseUrl';
import {useSelector} from 'react-redux';
const COLORS = {
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  Primary: '#1a1c22',
  Secondary: '#5a5c6a',
};

export default function ExpenseClaim({navigation}) {
  const {id} = useSelector(state => state.Data.currentData);
  const [date, setDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);

  const [accountTitle, setAccountTitle] = useState(null);
  const [accountTitles, setAccountTitles] = useState([]);
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [overallMemo, setOverallMemo] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(false);

  // Fetch Account Titles from API
  useEffect(() => {
    fetchAccountTitles();
  }, []);

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
    if (!accountTitle || !amount) {
      ToastAndroid.show('Please fill all fields', ToastAndroid.SHORT);
      return;
    }

    const selectedAccount = accountTitles.find(
      acc => acc.value === accountTitle,
    );

    setItems(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        accountTitle: accountTitle,
        accountTitleLabel: selectedAccount?.account_name || '',
        accountCode: selectedAccount?.account_code || '',
        amount: amount,
        memo: memo,
      },
    ]);

    // Reset form fields
    setAccountTitle(null);
    setAmount('');
    setMemo('');
  };

  const handleRemoveItem = id => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      ToastAndroid.show(
        'Please add at least one expense item',
        ToastAndroid.SHORT,
      );
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
        memo_: item.memo || '',
      }));

      const formData = new FormData();
      formData.append('type', '41');
      formData.append('comments', overallMemo || '');
      formData.append('trans_date', date.toISOString().split('T')[0]);
      formData.append('amount', totalAmount.toString());
      formData.append('gl_detail', JSON.stringify(glDetail));
      formData.append('user_id', id);

      // Add image file if selected
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
        ToastAndroid.show(
          'Expense claim submitted successfully',
          ToastAndroid.LONG,
        );

        setItems([]);
        setAccountTitle(null);
        setAmount('');
        setMemo('');
        setOverallMemo('');
        setDate(new Date());
        setSelectedImage(null);
      } else {
        console.log('⚠️ Server rejected submission');
        ToastAndroid.show(
          response.data?.message || 'Server rejected submission',
          ToastAndroid.LONG,
        );
      }
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
      ToastAndroid.show('Submission failed', ToastAndroid.LONG);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return items
      .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)
      .toFixed(2);
  };

  return (
    <LinearGradient
      colors={[COLORS.Primary, COLORS.Secondary, COLORS.BLACK]}
      style={{flex: 1}}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" color={COLORS.WHITE} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Expense Claim Form</Text>
        <View style={{width: 28}} />
      </View>

      <ScrollView contentContainerStyle={{padding: 20, paddingBottom: 100}}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDate(true)}>
          <Text style={styles.dateText}>
            {date.toISOString().split('T')[0]}
          </Text>
        </TouchableOpacity>

        {showDate && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(event, selected) => {
              setShowDate(false);
              if (selected) setDate(selected);
            }}
          />
        )}

        {/* Expense Items Form */}
        <Text style={styles.sectionTitle}>Add Expense Item</Text>

        <View style={styles.rowContainer}>
          <Dropdown
            style={[styles.dropdown, {flex: 2}]}
            data={accountTitles}
            search
            searchPlaceholder="Search account title..."
            labelField="account_name"
            valueField="account_code"
            value={accountTitle}
            onChange={item => setAccountTitle(item.account_code)}
            placeholder={
              accountsLoading ? 'Loading accounts...' : 'Account Title'
            }
            placeholderStyle={{color: 'rgba(255,255,255,0.6)'}}
            selectedTextStyle={{color: COLORS.WHITE}}
            itemTextStyle={{color: COLORS.BLACK}}
            renderLeftIcon={() =>
              accountsLoading && (
                <ActivityIndicator
                  size="small"
                  color={COLORS.WHITE}
                  style={{marginRight: 8}}
                />
              )
            }
          />

          <TextInput
            style={[styles.textInput, {flex: 1}]}
            placeholder="Amount"
            placeholderTextColor="rgba(255,255,255,0.6)"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        <View style={styles.rowContainer}>
          <TextInput
            style={[styles.textInput, {flex: 1}]}
            placeholder="Memo"
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={memo}
            onChangeText={setMemo}
          />

          <TouchableOpacity onPress={handleAddItem} style={styles.addButton}>
            <Ionicons name="add" size={24} color={COLORS.WHITE} />
          </TouchableOpacity>
        </View>

        {/* Expense Items Table */}
        {items.length > 0 && (
          <View style={styles.tableContainer}>
            <Text style={styles.sectionTitle}>Expense Items</Text>

            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, {flex: 1.5}]}>Account</Text>
              <Text style={[styles.tableHeaderText, {flex: 1}]}>Amount</Text>
              <Text style={[styles.tableHeaderText, {flex: 1.2}]}>Memo</Text>
              <Text style={[styles.tableHeaderText, {flex: 0.3}]}></Text>
            </View>

            {/* Table Rows */}
            {items.map((item, index) => (
              <View key={item.id} style={styles.tableRow}>
                <View style={[styles.tableCell, {flex: 1.5}]}>
                  <Text style={styles.tableText} numberOfLines={2}>
                    {item.accountTitleLabel}
                  </Text>
                </View>
                <Text style={[styles.tableText, {flex: 1}]}>{item.amount}</Text>
                <Text style={[styles.tableText, {flex: 1.2}]} numberOfLines={2}>
                  {item.memo}
                </Text>
                <TouchableOpacity
                  style={[styles.actionButton, {flex: 0.3}]}
                  onPress={() => handleRemoveItem(item.id)}>
                  <Ionicons name="trash-outline" size={18} color="#ff6b6b" />
                </TouchableOpacity>
              </View>
            ))}

            {/* Total Row */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalAmount}>{calculateTotal()}</Text>
            </View>
          </View>
        )}

        {/* Overall Memo */}
        <Text style={styles.sectionTitle}>Overall Memo</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="Enter overall description or notes..."
          placeholderTextColor="rgba(255,255,255,0.6)"
          multiline
          numberOfLines={4}
          value={overallMemo}
          onChangeText={setOverallMemo}
        />

        {/* Attach Image Section */}
        <Text style={styles.sectionTitle}>Attach Receipt/Document</Text>
        <TouchableOpacity
          onPress={handleImagePicker}
          style={styles.attachImageButton}>
          {imageLoading ? (
            <ActivityIndicator size="small" color={COLORS.WHITE} />
          ) : (
            <>
              <Ionicons
                name={selectedImage ? 'checkmark-circle' : 'camera'}
                size={28}
                color={selectedImage ? '#4CAF50' : COLORS.WHITE}
              />
              <Text style={styles.attachImageText}>
                {selectedImage
                  ? 'Image Selected - Tap to Change'
                  : 'Select Image'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Selected Image Preview */}
        {selectedImage && (
          <TouchableOpacity
            style={styles.imagePreviewContainer}
            onPress={() => setShowImageModal(true)}>
            <Image source={{uri: selectedImage}} style={styles.imagePreview} />
            <Text style={styles.imagePreviewText}>Tap to view full image</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

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
                <Ionicons name="close" size={24} color={COLORS.WHITE} />
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

      {/* Bottom Process Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={loading || items.length === 0}>
          {loading ? (
            <ActivityIndicator color={COLORS.WHITE} />
          ) : (
            <Text style={styles.submitBtnText}>Process Expense Claim</Text>
          )}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    color: COLORS.WHITE,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
  },
  dateButton: {
    height: 52,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateText: {
    color: COLORS.WHITE,
    fontSize: 16,
  },
  dropdown: {
    height: 52,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textInput: {
    height: 52,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    color: COLORS.WHITE,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  imageButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
  },
  addButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.Secondary,
    borderRadius: 10,
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  imagePreviewText: {
    color: COLORS.WHITE,
    fontSize: 12,
    marginTop: 5,
  },
  tableContainer: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableHeaderText: {
    color: COLORS.WHITE,
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 12,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  tableCell: {
    justifyContent: 'center',
  },
  tableText: {
    color: COLORS.WHITE,
    textAlign: 'center',
    fontSize: 12,
  },
  accountCodeText: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    fontSize: 10,
    marginTop: 2,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  totalLabel: {
    color: COLORS.WHITE,
    fontWeight: '700',
    fontSize: 16,
  },
  totalAmount: {
    color: COLORS.WHITE,
    fontWeight: '700',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.Primary,
    borderRadius: 12,
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
    color: COLORS.WHITE,
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
    backgroundColor: COLORS.Secondary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  attachImageButton: {
    height: 60,
    borderRadius: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 10,
  },
  attachImageText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: COLORS.Primary,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  submitBtn: {
    height: 56,
    backgroundColor: COLORS.Secondary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: '600',
  },
});
