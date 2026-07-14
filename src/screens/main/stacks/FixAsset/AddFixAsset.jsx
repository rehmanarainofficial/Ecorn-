import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Animated,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Image,
  PermissionsAndroid,
} from 'react-native';
import {Dropdown} from 'react-native-element-dropdown';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {BASEURL} from '../../../../utils/BaseUrl';
import SimpleHeader from '../../../../components/SimpleHeader';

const COLORS = {
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  Primary: '#1a1c22',
  Secondary: '#5a5c6a',
  BG: '#f3f4f6',
  TEXT_MAIN: '#1f2937',
  TEXT_MUTED: '#6b7280',
  BORDER: '#e5e7eb',
};

export default function AddFixAsset({navigation}) {
  const [category, setCategory] = useState(null);
  const [categories, setCategories] = useState([]);

  const [description, setDescription] = useState('');

  const [unit, setUnit] = useState(null);
  const [units, setUnits] = useState([]);

  const [location, setLocation] = useState(null);
  const [locations, setLocations] = useState([]);

  const [employee, setEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);

  const [imageFile, setImageFile] = useState(null);

  const [loading, setLoading] = useState(false);

  // Animation setup
  const animValues = useRef([]).current;
  const fieldCount = 6;
  if (animValues.length === 0) {
    for (let i = 0; i < fieldCount; i++) {
      animValues.push({
        translateY: new Animated.Value(20),
        opacity: new Animated.Value(0),
      });
    }
  }

  // Animate fields on mount
  useEffect(() => {
    const anims = animValues.map((av, idx) =>
      Animated.parallel([
        Animated.timing(av.translateY, {
          toValue: 0,
          duration: 400,
          delay: idx * 80,
          useNativeDriver: true,
        }),
        Animated.timing(av.opacity, {
          toValue: 1,
          duration: 400,
          delay: idx * 80,
          useNativeDriver: true,
        }),
      ]),
    );
    Animated.stagger(80, anims).start();
  }, [animValues]);

  // Fetch Dropdowns Data
  useEffect(() => {
    fetchData(
      `${BASEURL}fix_asset_stock_category.php`,
      setCategories,
      'category_id',
      'description',
    );
    fetchData(
      `${BASEURL}item_units.php`,
      setUnits,
      'abbr',
      'name',
    );
    fetchData(
      `${BASEURL}fix_asset_locations.php`,
      setLocations,
      'loc_code',
      'location_name',
    );
    fetchData(
      `${BASEURL}get_all_employees.php`,
      setEmployees,
      'employee_id',
      'emp_name',
      emp => emp.emp_code ? `${emp.emp_name} - ${emp.emp_code}` : emp.emp_name
    );
  }, []);

  const fetchData = async (url, setState, valueField, labelField, customLabelFn) => {
    try {
      const {data} = await axios.get(url);
      if ((data?.status === 'true' || data?.status === true) && Array.isArray(data.data)) {
        const mapped = data.data.map(item => ({
          label: customLabelFn ? customLabelFn(item) : item[labelField],
          value: item[valueField],
        }));
        setState(mapped);
      }
    } catch (error) {
      console.error('Error fetching dropdown:', url, error);
    }
  };

  // Gallery Permission Request
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

  // Camera Permission Request
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  // Capture Image via Camera
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
    launchCamera({mediaType: 'photo', quality: 0.8}, response => {
      if (!response.didCancel && !response.errorCode) {
        const asset = response.assets[0];
        setImageFile({
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName,
        });
      }
    });
  };

  // Select Image from Gallery
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
    launchImageLibrary({mediaType: 'photo', quality: 0.8}, response => {
      if (!response.didCancel && !response.errorCode) {
        const asset = response.assets[0];
        setImageFile({
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName,
        });
      }
    });
  };

  // Submit Form
  const handleSubmit = async () => {
    if (!category || !description.trim() || !unit || !location || !employee) {
      Toast.show({type: 'error', text1: 'Please fill all fields'});
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('category_id', category);
    formData.append('description', description.trim());
    formData.append('units', unit);
    formData.append('location', location);
    formData.append('employee_id', employee);

    if (imageFile) {
      formData.append('image', {
        uri: imageFile.uri,
        type: imageFile.type || 'image/jpeg',
        name: imageFile.name || 'photo.jpg',
      });
    }

    try {
      const res = await axios.post(
        `${BASEURL}fix_asset_item_post.php`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      console.log('Add Asset Response:', res.data);

      let parsedData = {};
      if (typeof res.data === 'string') {
        const jsonMatch = res.data.match(/\{.*\}$/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        }
      } else {
        parsedData = res.data;
      }

      if (parsedData?.status === true || parsedData?.status === 'true') {
        Toast.show({type: 'success', text1: 'Asset added successfully!'});

        // Reset inputs
        setCategory(null);
        setDescription('');
        setUnit(null);
        setLocation(null);
        setEmployee(null);
        setImageFile(null);

        // Go back after successful insertion
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed to add asset',
          text2: parsedData?.message || 'Please check input details.',
        });
      }
    } catch (error) {
      console.error('Submit Error:', error);
      Toast.show({type: 'error', text1: 'Error submitting asset'});
    } finally {
      setLoading(false);
    }
  };

  // Reusable Dropdown Render helper
  const renderDropdown = (index, placeholder, value, setValue, options) => (
    <Animated.View
      style={[
        styles.inputContainer,
        {
          transform: [{translateY: animValues[index].translateY}],
          opacity: animValues[index].opacity,
        },
      ]}>
      <Dropdown
        style={styles.dropdown}
        data={options}
        search
        labelField="label"
        valueField="value"
        placeholder={placeholder}
        placeholderStyle={{color: COLORS.TEXT_MUTED}}
        selectedTextStyle={{color: COLORS.TEXT_MAIN}}
        itemTextStyle={{color: COLORS.BLACK}}
        searchPlaceholder="Search..."
        value={value}
        onChange={item => setValue(item.value)}
      />
    </Animated.View>
  );

  // Reusable Input Render helper
  const renderInput = (index, placeholder, value, setValue) => (
    <Animated.View
      style={[
        styles.inputContainer,
        {
          transform: [{translateY: animValues[index].translateY}],
          opacity: animValues[index].opacity,
        },
      ]}>
      <TextInput
        style={styles.textInput}
        placeholder={placeholder}
        placeholderTextColor={COLORS.TEXT_MUTED}
        value={value}
        onChangeText={setValue}
      />
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={{backgroundColor: COLORS.WHITE}}>
        <SimpleHeader title="Add New Asset" />
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{padding: 24, gap: 16}}
        showsVerticalScrollIndicator={false}>
        {renderDropdown(0, 'Select Category', category, setCategory, categories)}
        {renderInput(1, 'Description', description, setDescription)}
        {renderDropdown(2, 'Select Units', unit, setUnit, units)}
        {renderDropdown(3, 'Select Location', location, setLocation, locations)}
        {renderDropdown(4, 'Select Employee', employee, setEmployee, employees)}

        {/* Image Attachment Section */}
        <Animated.View
          style={[
            styles.imageContainer,
            {
              transform: [{translateY: animValues[5].translateY}],
              opacity: animValues[5].opacity,
            },
          ]}>
          <Text style={styles.imageLabel}>Asset Image (Optional)</Text>
          <View style={styles.row}>
            <TouchableOpacity style={styles.mediaButton} onPress={openCamera}>
              <Icon name="camera" size={24} color={COLORS.WHITE} />
              <Text style={styles.mediaButtonText}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.mediaButton} onPress={openGallery}>
              <Icon name="image-multiple" size={24} color={COLORS.WHITE} />
              <Text style={styles.mediaButtonText}>Gallery</Text>
            </TouchableOpacity>
          </View>

          {imageFile && (
            <View style={styles.previewContainer}>
              <Image source={{uri: imageFile.uri}} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => setImageFile(null)}>
                <Icon name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.WHITE} />
          ) : (
            <Text style={styles.submitBtnText}>Submit</Text>
          )}
        </TouchableOpacity>

        <View style={{height: 40}} />
      </ScrollView>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  inputContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 64,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  textInput: {
    color: COLORS.TEXT_MAIN,
    fontSize: 16,
    height: '100%',
  },
  dropdown: {
    height: 60,
  },
  imageContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  imageLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT_MAIN,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  mediaButton: {
    flex: 1,
    height: 50,
    backgroundColor: COLORS.Primary,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mediaButtonText: {
    color: COLORS.WHITE,
    fontSize: 15,
    fontWeight: '600',
  },
  previewContainer: {
    marginTop: 16,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
  },
  submitBtn: {
    height: 60,
    backgroundColor: COLORS.Primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.Primary,
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  submitBtnText: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
