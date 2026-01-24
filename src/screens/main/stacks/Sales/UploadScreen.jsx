import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import SimpleHeader from '../../../../components/SimpleHeader';
import {useRoute, useNavigation} from '@react-navigation/native';

import axios from 'axios';

import {pick, types} from '@react-native-documents/picker';
import {BASEURL} from '../../../../utils/BaseUrl';

const COLORS = {
  WHITE: '#FFFFFF',
  PRIMARY: '#1a1c22',
  Background: '#F3F4F6',
  Border: '#E2E8F0',
  TextDark: '#1E293B',
  TextMuted: '#64748B',
  Success: '#10B981',
  SuccessLight: '#ECFDF5',
};

const UploadScreen = () => {
  const route = useRoute();
  const {transactionType, transactionNo, fromScreen} = route.params || {};

  const [transaction, setTransaction] = useState(transactionType || '');
  const [transNo, setTransNo] = useState(transactionNo || '');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();

  // Gallery Permission
  const requestGalleryPermission = async () => {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true;
  };

  // Camera Permission
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  // Open Camera
  const openCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Toast.show({
        type: 'error',
        text1: 'Permission Required',
        text2: 'Camera permission is needed.',
      });
      return;
    }
    launchCamera({mediaType: 'photo'}, response => {
      if (!response.didCancel && !response.errorCode) {
        const asset = response.assets[0];
        setFile({
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName,
        });
      }
    });
  };

  // Open Gallery
  const openGallery = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) {
      Toast.show({
        type: 'error',
        text1: 'Permission Required',
        text2: 'Gallery permission is needed.',
      });
      return;
    }
    launchImageLibrary({mediaType: 'photo'}, response => {
      if (!response.didCancel && !response.errorCode) {
        const asset = response.assets[0];
        setFile({
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName,
        });
      }
    });
  };

  // Open Documents
  const openDocuments = async () => {
    try {
      const [res] = await pick({
        type: [types.allFiles],
      });

      setFile({
        uri: res.uri,
        type: res.type,
        name: res.name,
      });
    } catch (err) {
      if (err?.code === 'DOCUMENT_PICKER_CANCELED') {
        console.log('User cancelled document picker');
      } else {
        console.error('Document Picker Error: ', err);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to open file picker.',
        });
      }
    }
  };

  const handleSubmit = async () => {
    if (!transaction || !transNo || !description || !file) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Missing required fields or attachment',
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('type', transaction);
      formData.append('trans_no', transNo);
      formData.append('description', description);
      formData.append('filename', {
        uri: file.uri,
        type: file.type || 'application/octet-stream',
        name: file.name,
      });

      const response = await axios.post(
        `${BASEURL}dattachment_post.php`,
        formData,
        {headers: {'Content-Type': 'multipart/form-data'}},
      );

      Toast.show({
        type: 'success',
        text1: 'Uploaded',
        text2: 'Attachment sent successfully!',
      });

      if (fromScreen) {
        navigation.navigate(fromScreen, {refresh: true});
      }
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: 'Something went wrong!',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SimpleHeader title="Attach Document" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.bigInput}
          placeholder="Enter description..."
          placeholderTextColor={COLORS.TextMuted}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        {/* Attach File */}
        <Text style={styles.label}>Attachment</Text>
        <View style={styles.row}>
          <TouchableOpacity style={styles.button} onPress={openCamera}>
            <View style={[styles.iconWrap, {backgroundColor: '#3B82F6'}]}>
              <Icon name="camera" size={20} color={COLORS.WHITE} />
            </View>
            <Text style={styles.buttonText}>Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={openGallery}>
            <View style={[styles.iconWrap, {backgroundColor: '#8B5CF6'}]}>
              <Icon name="image-multiple" size={20} color={COLORS.WHITE} />
            </View>
            <Text style={styles.buttonText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={openDocuments}>
            <View style={[styles.iconWrap, {backgroundColor: '#F59E0B'}]}>
              <Icon name="file-document" size={20} color={COLORS.WHITE} />
            </View>
            <Text style={styles.buttonText}>Docs</Text>
          </TouchableOpacity>
        </View>

        {/* File Preview */}
        {file && (
          <View style={styles.filePreview}>
            {file.type && file.type.startsWith('image/') ? (
              <Image source={{uri: file.uri}} style={styles.imagePreview} />
            ) : (
              <View style={styles.documentPreview}>
                <Icon name="file-check" size={50} color={COLORS.Success} />
                <Text style={styles.fileName}>{file.name}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => setFile(null)}>
              <Icon name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, loading && {opacity: 0.7}]}
          onPress={handleSubmit}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.WHITE} />
          ) : (
            <>
              <Icon name="cloud-upload" size={22} color={COLORS.WHITE} />
              <Text style={styles.submitText}>Upload Attachment</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.Background,
  },
  scroll: {
    padding: 16,
    flexGrow: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
    color: COLORS.TextDark,
  },
  bigInput: {
    borderRadius: 12,
    padding: 14,
    minHeight: 120,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.Border,
    color: COLORS.TextDark,
    marginBottom: 16,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.Border,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  buttonText: {
    color: COLORS.TextDark,
    fontWeight: '600',
    fontSize: 12,
  },
  filePreview: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.Border,
  },
  documentPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.Border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileName: {
    color: COLORS.TextDark,
    marginTop: 10,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.Success,
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});

export default UploadScreen;
