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
import PlatformGradient from '../../../../components/PlatformGradient';
import {useRoute, useNavigation} from '@react-navigation/native';

import axios from 'axios';

// ✅ Correct import for new package
import {pick, types} from '@react-native-documents/picker';
import {BASEURL} from '../../../../utils/BaseUrl';

const UploadScreen = () => {
  const route = useRoute();
  const {transactionType, transactionNo, fromScreen} = route.params || {};

  const [transaction, setTransaction] = useState(transactionType || '');
  const [transNo, setTransNo] = useState(transactionNo || '');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false); // ✅ loader state

  const navigation = useNavigation();

  // ✅ Gallery Permission
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

  // ✅ Camera Permission
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  // ✅ Open Camera
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

  // ✅ Open Gallery
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

  // ✅ Open Documents
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
    <PlatformGradient
      colors={['#1a1c22', '#5a5c6a', '#000000']}
      style={styles.container}>
      <SimpleHeader title="Attach Document" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.bigInput}
          placeholder="Enter description..."
          placeholderTextColor="#aaa"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        {/* Attach File */}
        <Text style={styles.label}>Attachment</Text>
        <View style={styles.row}>
          <TouchableOpacity style={styles.button} onPress={openCamera}>
            <Icon name="camera" size={20} color="#fff" />
            <Text style={styles.buttonText}>Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={openGallery}>
            <Icon name="image-multiple" size={20} color="#fff" />
            <Text style={styles.buttonText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={openDocuments}>
            <Icon name="file-document" size={20} color="#fff" />
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
                <Icon name="file-check" size={50} color="#00ff99" />
                <Text style={styles.fileName}>{file.name}</Text>
              </View>
            )}
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading} // ✅ disable while loading
        >
          {loading ? (
            <ActivityIndicator color="#00ff99" />
          ) : (
            <>
              <Icon name="plus-circle-outline" size={20} color="#00ff99" />
              <Text style={styles.submitText}>Upload Attachment</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
      <Toast />
    </PlatformGradient>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  scroll: {padding: 20, flexGrow: 1},
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 10,
    color: '#eee',
  },
  bigInput: {
    borderRadius: 15,
    padding: 16,
    minHeight: 120,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    marginBottom: 20,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  row: {flexDirection: 'row', justifyContent: 'space-between', gap: 10},
  button: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  buttonText: {color: '#fff', fontWeight: '600', marginLeft: 6, fontSize: 12},
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 15,
    marginTop: 15,
  },
  filePreview: {
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentPreview: {
    width: '100%',
    height: 200,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileName: {
    color: '#fff',
    marginTop: 10,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,255,150,0.1)',
    padding: 15,
    borderRadius: 15,
    marginTop: 25,
    borderWidth: 1,
    borderColor: 'rgba(0,255,150,0.3)',
  },
  submitText: {
    color: '#00ff99',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});

export default UploadScreen;
