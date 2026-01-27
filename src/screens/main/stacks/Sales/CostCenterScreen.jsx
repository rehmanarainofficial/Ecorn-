import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import SimpleHeader from '../../../../components/SimpleHeader';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import {BASEURL} from '../../../../utils/BaseUrl';
import * as Animatable from 'react-native-animatable';

const CostCenterScreen = ({navigation}) => {
  const [locCode, setLocCode] = useState('');
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!locCode.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter Cost Center Code',
      });
      return;
    }

    if (!locationName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter Cost Center Name',
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('loc_code', locCode.trim());
      formData.append('location_name', locationName.trim());

      console.log('Submitting Cost Center:', {
        loc_code: locCode,
        location_name: locationName,
      });

      const res = await axios.post(`${BASEURL}location_post.php`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('API Response:', res.data);

      if (res.data?.status === true) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Cost Center added successfully!',
        });

        // Clear form
        setLocCode('');
        setLocationName('');

        // Navigate back after short delay
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: res.data?.message || 'Failed to add Cost Center',
        });
      }
    } catch (error) {
      console.log('API Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Network error. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SimpleHeader title="Add Cost Center" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <Animatable.View
            animation="fadeInUp"
            duration={600}
            style={styles.formContainer}>
            {/* Header Icon */}
            <View style={styles.headerIconContainer}>
              <Icon name="map-marker-plus" size={50} color="#1a1c22" />
              <Text style={styles.headerTitle}>New Cost Center</Text>
              <Text style={styles.headerSubtitle}>
                Enter the details to add a new cost center
              </Text>
            </View>

            {/* Location Code Input */}
            <Animatable.View animation="fadeInLeft" delay={200}>
              <Text style={styles.label}>Cost Center Code</Text>
              <View style={styles.inputContainer}>
                <Icon
                  name="barcode"
                  size={22}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter location code"
                  placeholderTextColor="#999"
                  value={locCode}
                  onChangeText={setLocCode}
                  autoCapitalize="characters"
                />
              </View>
            </Animatable.View>

            {/* Location Name Input */}
            <Animatable.View animation="fadeInRight" delay={300}>
              <Text style={styles.label}>Cost Center Name</Text>
              <View style={styles.inputContainer}>
                <Icon
                  name="office-building-marker"
                  size={22}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter location name"
                  placeholderTextColor="#999"
                  value={locationName}
                  onChangeText={setLocationName}
                />
              </View>
            </Animatable.View>

            {/* Submit Button */}
            <Animatable.View animation="fadeInUp" delay={400}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  loading && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}>
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Icon name="check-circle" size={22} color="#FFF" />
                    <Text style={styles.submitButtonText}>Add Cost Center</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animatable.View>

            {/* Cancel Button */}
            <Animatable.View animation="fadeInUp" delay={500}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}>
                <Icon name="close-circle-outline" size={22} color="#666" />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </Animatable.View>
          </Animatable.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  headerIconContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1c22',
    marginTop: 15,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginLeft: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1c22',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 10,
    shadowColor: '#1a1c22',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default CostCenterScreen;
