import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  StatusBar,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import axios from 'axios';
import {BASEURL} from '../../../../utils/BaseUrl';
import {APPCOLORS} from '../../../../utils/APPCOLORS';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SimpleHeader from '../../../../components/SimpleHeader';
import RNFetchBlob from 'react-native-blob-util';
import {PDFDocument, rgb, StandardFonts} from 'pdf-lib';
import Toast from 'react-native-toast-message';
import PlatformGradient from '../../../../components/PlatformGradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {formatDate, formatDateString} from '../../../../utils/DateUtils';
import {formatNumber} from '../../../../utils/NumberUtils';
import FileViewer from 'react-native-file-viewer';

const Aging = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const {name, item} = route.params;
  const [aging, setAgingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (name === 'Customer') {
      getCustomerAging();
    } else if (name === 'Suppliers') {
      getSupplierAging();
    }
  }, []);

  const getCustomerAging = () => {
    setDataLoading(true);
    let data = new FormData();
    data.append('customer_id', item?.customer_id);

    axios
      .post(`${BASEURL}dash_cust_aging.php`, data, {
        headers: {'Content-Type': 'multipart/form-data'},
      })
      .then(res => setAgingData(res.data.data_cust_age || []))
      .catch(err => console.warn('API error', err.message))
      .finally(() => setDataLoading(false));
  };

  const getSupplierAging = () => {
    setDataLoading(true);
    let data = new FormData();
    data.append('supplier_id', item?.supplier_id);

    axios
      .post(`${BASEURL}dash_supp_aging.php`, data, {
        headers: {'Content-Type': 'multipart/form-data'},
      })
      .then(res => setAgingData(res.data.data_cust_age || []))
      .catch(err => console.warn('API error', err.message))
      .finally(() => setDataLoading(false));
  };

  // Helper function to safely parse numbers (handles strings with commas)
  const safeParseNumber = value => {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;
    // Remove commas and parse
    const cleanValue = String(value).replace(/,/g, '').trim();
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Calculate totals
  const totalAllocated = aging.reduce(
    (sum, row) => sum + safeParseNumber(row.Allocated),
    0,
  );
  const totalInvoice = aging.reduce(
    (sum, row) => sum + safeParseNumber(row.Invoice_amount),
    0,
  );
  const totalBalance = aging.reduce(
    (sum, row) => sum + safeParseNumber(row.invoce_balance),
    0,
  );

  const requestStoragePermission = async () => {
    if (Platform.OS !== 'android') return true;

    try {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
        ]);

        return (
          granted['android.permission.READ_MEDIA_IMAGES'] ===
          PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (err) {
      console.warn('Permission error:', err);
      return false;
    }
  };

  // Function to convert Uint8Array to base64
  const uint8ArrayToBase64 = uint8Array => {
    let binary = '';
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  };

  const generatePDF = async () => {
    setLoading(true);
    try {
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Toast.show({
          type: 'error',
          text1: 'Permission Denied',
          text2: 'Storage permission is required to save PDF',
        });
        return;
      }

      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();

      // Create a larger page to avoid page breaks
      const page = pdfDoc.addPage([595.28, 2000]); // Taller page
      const {width, height} = page.getSize();

      // Load fonts
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Set initial y position
      let y = height - 50;

      // Add title
      page.drawText('AGING REPORT', {
        x: 50,
        y,
        size: 18,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      y -= 30;

      // Add customer/supplier name
      const entityName =
        item?.name || item?.customer_name || item?.supplier_name || 'Unknown';
      page.drawText(`Name: ${entityName}`, {
        x: 50,
        y,
        size: 12,
        font: font,
        color: rgb(0, 0, 0),
      });
      y -= 20;

      // Add date
      const currentDate = formatDate(new Date());
      page.drawText(`Date: ${currentDate}`, {
        x: 50,
        y,
        size: 12,
        font: font,
        color: rgb(0, 0, 0),
      });
      y -= 40;

      // Table headers
      const headers = [
        'Reference',
        'Tran Date',
        'Days',
        'Allocated',
        'Invoice Amt',
        'Balance',
      ];
      const columnWidths = [80, 80, 50, 80, 80, 80];

      // Draw table headers
      let x = 50;
      headers.forEach((header, index) => {
        page.drawText(header, {
          x,
          y,
          size: 10,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        x += columnWidths[index];
      });
      y -= 20;

      // Draw table rows (simplified without page breaks)
      aging.forEach((row, index) => {
        x = 50;
        const rowData = [
          row.reference || '-',
          formatDateString(row.tran_date),
          row.days || '-',
          formatNumber(row.Allocated || 0),
          formatNumber(row.Invoice_amount || 0),
          formatNumber(row.invoce_balance || 0),
        ];

        rowData.forEach((data, colIndex) => {
          page.drawText(data, {
            x,
            y,
            size: 8,
            font: font,
            color: rgb(0, 0, 0),
          });
          x += columnWidths[colIndex];
        });
        y -= 15;
      });

      // Draw totals
      y -= 10;
      x = 50;

      page.drawText('TOTAL', {
        x,
        y,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      x += 210; // Skip first three columns

      const totals = [
        formatNumber(totalAllocated),
        formatNumber(totalInvoice),
        '',
      ];

      totals.forEach(total => {
        page.drawText(total, {
          x,
          y,
          size: 10,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        x += 80;
      });

      // Save PDF as bytes
      const pdfBytes = await pdfDoc.save();

      // Convert Uint8Array to base64 without using Buffer
      const base64PDF = uint8ArrayToBase64(pdfBytes);

      // Generate file name
      const customerName = entityName.replace(/[^a-zA-Z0-9_]/g, '_');
      const fileName = `${customerName}_Aging_${Date.now()}.pdf`;

      // Use public Downloads directory path
      let downloadPath;

      if (Platform.OS === 'android') {
        // Direct path to public Downloads folder
        downloadPath = '/storage/emulated/0/Download';
      } else {
        downloadPath = RNFetchBlob.fs.dirs.DocumentDir;
      }

      const filePath = `${downloadPath}/${fileName}`;

      // Write file using RNFetchBlob
      await RNFetchBlob.fs.writeFile(filePath, base64PDF, 'base64');

      console.log('✅ PDF saved at:', filePath);

      // Show notification on Android that opens PDF on click
      if (Platform.OS === 'android') {
        RNFetchBlob.android.addCompleteDownload({
          title: 'Aging Report Downloaded',
          description: `${fileName}`,
          mime: 'application/pdf',
          path: filePath,
          showNotification: true,
        });

        Toast.show({
          type: 'success',
          text1: 'PDF Downloaded',
          text2: 'Tap notification to open PDF',
          visibilityTime: 3000,
          onPress: () => {
            FileViewer.open(filePath, {showOpenWithDialog: true}).catch(err => {
              console.log('Error opening PDF:', err);
            });
          },
        });
      } else {
        // iOS - directly open the file
        Toast.show({
          type: 'success',
          text1: 'PDF Saved Successfully',
          text2: 'File saved to Documents folder',
          visibilityTime: 3000,
        });

        // Auto open on iOS
        FileViewer.open(filePath, {showOpenWithDialog: true}).catch(err => {
          console.log('Error opening PDF:', err);
        });
      }
    } catch (error) {
      console.error('❌ PDF generation error:', error);
      Toast.show({
        type: 'error',
        text1: 'PDF Generation Failed',
        text2: 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };
  if (dataLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F3F4F6',
        }}>
        <Text style={{fontSize: 16, marginBottom: 10}}>
          Loading Aging Data...
        </Text>
        <ActivityIndicator size="large" color={APPCOLORS.Primary} />
      </View>
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: '#F3F4F6'}}>
      <StatusBar barStyle="dark-content" backgroundColor={APPCOLORS.WHITE} />

      {/* Custom Header */}
      <PlatformGradient
        colors={[APPCOLORS.Primary, APPCOLORS.Secondary]}
        style={[
          styles.header,
          {
            paddingTop:
              Platform.OS === 'ios' ? insets.top + 25 : insets.top + 30,
          },
        ]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={APPCOLORS.WHITE} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Aging -{' '}
          {item?.name || item?.customer_name || item?.supplier_name || ''}
        </Text>

        <TouchableOpacity
          onPress={generatePDF}
          disabled={loading || aging.length === 0}>
          {loading ? (
            <ActivityIndicator size="small" color={APPCOLORS.WHITE} />
          ) : (
            <MaterialIcons
              name="file-download"
              size={26}
              color={
                aging.length === 0 ? APPCOLORS.TEXTFIELDCOLOR : APPCOLORS.WHITE
              }
            />
          )}
        </TouchableOpacity>
      </PlatformGradient>

      <FlatList
        data={aging}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({item, index}) => (
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9',
              borderTopWidth: 1,
              borderColor: '#ccc',
              paddingVertical: 10,
            }}>
            <Text
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 12,
                borderRightWidth: 1,
                borderColor: '#ccc',
              }}>
              {item.reference}
            </Text>
            <Text
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 12,
                borderRightWidth: 1,
                borderColor: '#ccc',
              }}>
              {formatDateString(item.tran_date)}
            </Text>
            <Text
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 12,
                borderRightWidth: 1,
                borderColor: '#ccc',
              }}>
              {item.days}
            </Text>
            <Text style={{flex: 1, textAlign: 'center', fontSize: 12}}>
              {formatNumber(item.Invoice_amount)}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          !dataLoading && (
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 50,
              }}>
              <Icon name="alert-circle-outline" size={50} color="#999" />
              <Text
                style={{
                  marginTop: 10,
                  fontSize: 16,
                  color: '#999',
                  fontWeight: '500',
                }}>
                No aging data available
              </Text>
            </View>
          )
        }
        ListHeaderComponent={() => (
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: APPCOLORS.Primary,
              paddingVertical: 10,
            }}>
            {['Reference', 'Tran Date', 'Days', 'Amount'].map((col, index) => (
              <View
                key={index}
                style={{
                  flex: 1,
                  borderRightWidth: index !== 3 ? 1 : 0,
                  borderRightColor: '#fff',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Text
                  style={{color: 'white', fontWeight: 'bold', fontSize: 13}}>
                  {col}
                </Text>
              </View>
            ))}
          </View>
        )}
        ListFooterComponent={() => (
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: '#e6e6e6',
              paddingVertical: 12,
              borderTopWidth: 1,
              borderColor: '#ccc',
              marginTop: 5,
            }}>
            <Text
              style={{
                flex: 3,
                textAlign: 'center',
                fontSize: 14,
                fontWeight: 'bold',
                borderRightWidth: 1,
                borderColor: '#ccc',
              }}>
              TOTAL
            </Text>

            <Text
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 14,
                fontWeight: 'bold',
              }}>
              {formatNumber(totalInvoice)}
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = {
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
    paddingBottom: Platform.OS === 'android' ? 20 : 15, // Android ke liye extra padding
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTitle: {
    color: APPCOLORS.WHITE,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 10,
  },
};

export default Aging;
