import axios from 'axios';
import {BASEURL} from '../utils/BaseUrl';

export const AUTO_CHECKOUT_TARGET_HOUR = 18;
export const AUTO_CHECKOUT_TARGET_MINUTE = 0;

export const getAsiaKarachiDateTime = () => {
  const now = new Date();
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const getPart = type => parts.find(p => p.type === type)?.value || '00';

    const year = getPart('year');
    const month = getPart('month');
    const day = getPart('day');
    const hour = parseInt(getPart('hour'), 10);
    const minute = parseInt(getPart('minute'), 10);
    const second = parseInt(getPart('second'), 10);

    const dateStr = `${year}-${month}-${day}`;
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(
      2,
      '0',
    )}:${String(second).padStart(2, '0')}`;

    const isTriggerTime =
      hour > AUTO_CHECKOUT_TARGET_HOUR ||
      (hour === AUTO_CHECKOUT_TARGET_HOUR &&
        minute >= AUTO_CHECKOUT_TARGET_MINUTE);

    return {
      dateStr,
      timeStr,
      year: parseInt(year, 10),
      month: parseInt(month, 10),
      day: parseInt(day, 10),
      hour,
      minute,
      second,
      isAfterTriggerTime: isTriggerTime,
    };
  } catch (e) {
    const offset = 5 * 60;
    const localOffset = now.getTimezoneOffset();
    const karachiDate = new Date(
      now.getTime() + (offset + localOffset) * 60 * 1000,
    );
    const year = karachiDate.getFullYear();
    const month = String(karachiDate.getMonth() + 1).padStart(2, '0');
    const day = String(karachiDate.getDate()).padStart(2, '0');
    const hour = karachiDate.getHours();
    const minute = karachiDate.getMinutes();
    const second = karachiDate.getSeconds();
    const dateStr = `${year}-${month}-${day}`;
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(
      2,
      '0',
    )}:${String(second).padStart(2, '0')}`;

    const isTriggerTime =
      hour > AUTO_CHECKOUT_TARGET_HOUR ||
      (hour === AUTO_CHECKOUT_TARGET_HOUR &&
        minute >= AUTO_CHECKOUT_TARGET_MINUTE);

    return {
      dateStr,
      timeStr,
      year,
      month: parseInt(month, 10),
      day: parseInt(day, 10),
      hour,
      minute,
      second,
      isAfterTriggerTime: isTriggerTime,
    };
  }
};

let isCheckingOut = false;

export const checkAndAutoCheckout = async empCode => {
  if (!empCode || isCheckingOut) return {checkedOut: false};

  const {dateStr, timeStr, isAfterTriggerTime} = getAsiaKarachiDateTime();

  if (!isAfterTriggerTime) {
    return {checkedOut: false, reason: 'Before auto-checkout time'};
  }

  isCheckingOut = true;
  try {
    const formData = new FormData();
    formData.append('emp_code', String(empCode));
    formData.append('date', dateStr);

    const response = await axios.post(
      `${BASEURL}get_attendence_detail.php`,
      formData,
      {
        headers: {'Content-Type': 'multipart/form-data'},
        timeout: 10000,
      },
    );

    if (
      response.data &&
      (response.data.status === 'true' || response.data.status === true)
    ) {
      const records = response.data.data || [];
      const pendingCheckouts = records.filter(
        item => item.status !== '1' && item.status !== 1,
      );

      if (pendingCheckouts.length > 0) {
        const checkoutActivityTime =
          AUTO_CHECKOUT_TARGET_HOUR === 18 ? '18:00:00' : timeStr;

        for (const item of pendingCheckouts) {
          const outFormData = new FormData();
          outFormData.append('code', String(empCode));
          outFormData.append('ActivityDate', dateStr);
          outFormData.append('ActivityTime', checkoutActivityTime);
          outFormData.append('status', '1');
          outFormData.append('in_out', '1');
          outFormData.append('id', String(item.id || '0'));

          try {
            await fetch(`${BASEURL}user_attendance_post.php`, {
              method: 'POST',
              body: outFormData,
              headers: {
                Accept: 'application/json',
              },
            });
          } catch (postErr) {
            console.log('Auto Checkout Failed ID:', item.id, postErr);
          }
        }
        return {checkedOut: true, count: pendingCheckouts.length};
      }
    }
    return {checkedOut: false, reason: 'No pending checkouts'};
  } catch (error) {
    console.log('Error during auto-checkout check:', error);
    return {checkedOut: false, error};
  } finally {
    isCheckingOut = false;
  }
};
