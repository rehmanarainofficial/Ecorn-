import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import axios from 'axios';
import { BASEURL } from '../utils/BaseUrl';
import { checkAndAutoCheckout } from './AttendanceAutoCheckoutService';

let trackingInterval = null;
let currentEmpCode = null;

const UPDATE_LIVE_TRACKING_URL = `${BASEURL}update_live_tracking_post.php`;

const requestLocationPermissions = async () => {
  try {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization('whenInUse');
      return auth === 'granted';
    }

    if (Platform.OS === 'android') {
      const isAlreadyGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (isAlreadyGranted) {
        return true;
      }

      const fineGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (fineGranted !== PermissionsAndroid.RESULTS.GRANTED) {
        return false;
      }

      if (Platform.Version >= 29) {
        try {
          const bgCheck = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
          );
          if (!bgCheck) {
            await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
            );
          }
        } catch (bgErr) {
          console.log('BG Location Permission Error:', bgErr);
        }
      }
      return true;
    }
  } catch (err) {
    console.log('Location permission request error:', err);
    return false;
  }
  return false;
};

const getAddressFromCoords = async (lat, lon) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Ercon-ERP-App/1.0',
        },
      },
    );
    clearTimeout(timeoutId);
    if (!response.ok) return 'Field Location';
    const data = await response.json();
    return data.display_name || 'Field Location';
  } catch (error) {
    return 'Field Location';
  }
};

const sendLiveLocationUpdate = async empCode => {
  if (!empCode) return;

  Geolocation.getCurrentPosition(
    async position => {
      const { latitude, longitude } = position.coords;
      const now = new Date();
      const currentDateStr = now.toISOString().split('T')[0];
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const currentTimeStr = `${hours}:${minutes}:${seconds}`;

      const addressName = await getAddressFromCoords(latitude, longitude);

      const formData = new FormData();
      formData.append('code', String(empCode));
      formData.append('emp_code', String(empCode));
      formData.append('user_id', String(empCode));
      formData.append('employee_id', String(empCode));
      formData.append('latitude', String(latitude));
      formData.append('longitude', String(longitude));
      formData.append('current_location', addressName);
      formData.append('ActivityDate', currentDateStr);
      formData.append('ActivityTime', currentTimeStr);

      try {
        const res = await axios.post(UPDATE_LIVE_TRACKING_URL, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log('📍 [Ercon Live Location Streamed Successfully]', {
          empCode,
          latitude,
          longitude,
          time: currentTimeStr,
          response: res.data,
        });
      } catch (err) {
        console.log('Ercon Live Location Stream Error:', err);
      }

      try {
        await checkAndAutoCheckout(empCode);
      } catch (autoErr) {
        console.log('Auto-checkout interval check error:', autoErr);
      }
    },
    error => {
      console.log('GPS Location Stream Error:', error);
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 15000 },
  );
};

export const startBackgroundTracking = async empCode => {
  if (!empCode) return;
  currentEmpCode = empCode;

  const hasPermission = await requestLocationPermissions();
  if (!hasPermission) {
    console.log('Location permission denied for tracking service');
    return;
  }

  // Send initial location update
  sendLiveLocationUpdate(empCode);

  // Poll location every 30 seconds continuously in background
  if (trackingInterval) clearInterval(trackingInterval);
  trackingInterval = setInterval(() => {
    if (currentEmpCode) {
      sendLiveLocationUpdate(currentEmpCode);
    }
  }, 30000);
};

export const stopBackgroundTracking = async () => {
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
  currentEmpCode = null;
};
