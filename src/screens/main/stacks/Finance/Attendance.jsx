import {View, ScrollView, TouchableOpacity, Alert} from 'react-native';
import React from 'react';
import {useSelector} from 'react-redux';
import AppHeader from '../../../../components/AppHeader';
import AppText from '../../../../components/AppText';
import {APPCOLORS} from '../../../../utils/APPCOLORS';
import {responsiveHeight, responsiveWidth} from '../../../../utils/Responsive';

const Attendance = () => {
  const userData = useSelector(state => state.Data.currentData);

  // Get current date details
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentDate = now.getDate();

  // Helper to get total days in correct month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const totalDays = getDaysInMonth(currentYear, currentMonth);
  // Create array from 1 to totalDays
  const daysArray = Array.from({length: totalDays}, (_, i) => i + 1);

  const handleDayPress = day => {
    // Placeholder for attendance logic
    console.log(`Attendance marked for day: ${day}`);
    Alert.alert('Attendance', `Attendance marked for day ${day}`);
  };

  return (
    <View style={{flex: 1, backgroundColor: '#F3F4F6'}}>
      <AppHeader />

      <ScrollView contentContainerStyle={{paddingBottom: 20}}>
        {/* Employee Name Section */}
        <View
          style={{
            alignItems: 'center',
            marginTop: responsiveHeight(3),
            marginBottom: responsiveHeight(2),
          }}>
          <AppText
            title={`Employee: ${userData?.real_name || 'User'}`}
            titleSize={2.2}
            titleWeight={true}
            titleColor={APPCOLORS.BLACK}
          />
          <AppText
            title={`${now.toLocaleString('default', {
              month: 'long',
            })} ${currentYear}`}
            titleSize={1.8}
            titleColor={APPCOLORS.Secondary}
            style={{marginTop: 5}}
          />
        </View>

        {/* Calendar Grid */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'flex-start',
            paddingHorizontal: responsiveWidth(4),
          }}>
          {daysArray.map(day => {
            const isCurrentDay = day === currentDate;
            const isPast = day < currentDate;
            // Logic: Only current day is enabled. Past and Future are disabled.
            // Past buttons disabled. Future buttons disabled.
            const isDisabled = !isCurrentDay;

            return (
              <TouchableOpacity
                key={day}
                disabled={isDisabled}
                onPress={() => handleDayPress(day)}
                style={{
                  width: responsiveWidth(11.5), // Approx width to fit 7 in a row with margins
                  height: responsiveWidth(11.5),
                  margin: responsiveWidth(0.8),
                  borderRadius: responsiveWidth(10), // Circular
                  backgroundColor: isCurrentDay
                    ? APPCOLORS.Primary
                    : isPast
                    ? '#E0E0E0'
                    : '#F5F5F5',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: isCurrentDay ? 0 : 1,
                  borderColor: isPast ? '#D0D0D0' : '#EFEFEF',
                  opacity: isDisabled ? (isPast ? 0.6 : 0.4) : 1,
                  elevation: isCurrentDay ? 5 : 0, // Shadow for active
                }}>
                <AppText
                  title={day.toString()}
                  titleColor={
                    isCurrentDay ? APPCOLORS.WHITE : APPCOLORS.Secondary
                  }
                  titleSize={1.6}
                  titleWeight={isCurrentDay}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default Attendance;
