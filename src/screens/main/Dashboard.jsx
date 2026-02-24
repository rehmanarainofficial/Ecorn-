import {
  View,
  FlatList,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {APPCOLORS} from '../../utils/APPCOLORS';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from '../../utils/Responsive';
import PlatformGradient from '../../components/PlatformGradient';
import DashboardTabs from '../../components/DashboardTabs';
import AppText from '../../components/AppText';

import AppHeader from '../../components/AppHeader';
import {AppImages} from '../../assets/images/AppImages';
import Modal from 'react-native-modal';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {BASEURL} from '../../utils/BaseUrl';
import axios from 'axios';
import moment from 'moment';
import GetMobileAccessData from '../../global/GetMobileAccessData';
import {useDispatch, useSelector} from 'react-redux';
import {setUserAccess, setMobileAccess} from '../../redux/AuthSlice';
import {formatNumber} from '../../utils/NumberUtils';

const Dashboard = ({navigation}) => {
  const [visible, setVisible] = useState(false);
  const userData = useSelector(state => state.Data.currentData);
  const mobileAccessData = useSelector(state => state.Data.mobileAccessData);
  const [AllData, setAllData] = useState();
  const [Type, setType] = useState();
  const [firstLoad, setFirstLoad] = useState(true);
  const [showMore, setShowMore] = useState(false);

  const [loader, setLoader] = useState(false);
  const dispatch = useDispatch();

  console.log('mobileAccessData', mobileAccessData);

  // Main cards (first 8)
  const mainCards = [
    {
      id: 1,
      name: 'Dashboard',
      icon: 'grid',
      onPress: () => navigation.navigate('Detail'),
      disabled: mobileAccessData?.[0]?.dashboard === '1',
    },
    {
      id: 2,
      name: 'Approval',
      icon: 'check-circle',
      onPress: () => navigation.navigate('AlertScreen', {type: 'customer'}),
      disabled: mobileAccessData?.[0]?.approval === '1',
    },
    {
      id: 3,
      name: 'Sales',
      icon: 'shopping-cart',
      onPress: () => navigation.navigate('SalesScreen'),
      disabled: mobileAccessData?.[0]?.sales === '1',
    },
    {
      id: 4,
      name: 'Purchase',
      icon: 'shopping-bag',
      onPress: () => navigation.navigate('PurchaseScreen'),
      disabled: mobileAccessData?.[0]?.purchase === '1',
    },
    {
      id: 5,
      name: 'Inventory',
      icon: 'box',
      onPress: () => navigation.navigate('InventoryScreen'),
      disabled: mobileAccessData?.[0]?.inventory === '1',
    },
    {
      id: 6,
      name: 'HCM',
      icon: 'users',
      onPress: () => navigation.navigate('HCMScreen'),
      disabled: mobileAccessData?.[0]?.hcm === '1',
    },
    {
      id: 7,
      name: 'Manufactur..',
      icon: 'settings',
      onPress: () => navigation.navigate('ManufacturingScreen'),
      disabled: mobileAccessData?.[0]?.manufacturing === '1',
    },
    {
      id: 8,
      name: 'CRM',
      icon: 'briefcase',
      onPress: () => navigation.navigate('CrmScreen'),
      disabled: mobileAccessData?.[0]?.crm === '1',
    },
  ];

  // More cards (shown after clicking More)
  const moreCards = [
    {
      id: 9,
      name: 'Finance',
      icon: 'dollar-sign',
      onPress: () => navigation.navigate('FinanceScreen'),
      disabled: mobileAccessData?.[0]?.finance === '1',
    },
    {
      id: 10,
      name: 'Attach Docs',
      icon: 'file-plus',
      onPress: () => navigation.navigate('AttachDocumentScreen'),
      disabled: mobileAccessData?.[0]?.attach_doc === '1',
    },
  ];

  // More button card
  const moreButton = {
    id: 'more',
    name: showMore ? 'Less' : 'More',
    icon: showMore ? 'chevron-up' : 'more-horizontal',
    onPress: () => setShowMore(!showMore),
    isMoreButton: true,
  };

  // Combine cards based on showMore state
  const getDisplayCards = () => {
    if (showMore) {
      return [...mainCards, ...moreCards, moreButton];
    }
    return [...mainCards, moreButton];
  };

  useEffect(() => {
    if (firstLoad) {
      getMoneyData();
      getUserAccess();
      setFirstLoad(false);
    }
  }, [firstLoad]);

  const getMoneyData = async () => {
    setLoader(true);

    const currentDate = new Date();
    const todayDate = moment(currentDate).format('YYYY-MM-DD');

    try {
      const params = new URLSearchParams();
      params.append('current_date', todayDate);
      params.append('pre_month_date', '2025-04-19');

      const {data} = await axios.post(
        `${BASEURL}dashboard_view.php`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      setAllData(data);
      setLoader(false);
    } catch (error) {
      console.error('[DEBUG] API Error:', error);
      setLoader(false);
    }
  };

  const getUserAccess = async () => {
    try {
      // Fetch Mobile Access based on role_id
      if (userData?.role_id) {
        const mobileRes = await GetMobileAccessData(userData.role_id);
        if (mobileRes.status === 'true') {
          dispatch(setMobileAccess(mobileRes.data));
          dispatch(setUserAccess(mobileRes.data));
        }
      }
    } catch (error) {
      console.error('Error fetching access data:', error);
    }
  };

  return (
    <View style={{flex: 1, backgroundColor: APPCOLORS.LIGHTGRAY}}>
      <AppHeader
        title={'Dashboard'}
        onPress={res => {
          setVisible(true), setType(res);
        }}
      />
      {loader && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}>
          <ActivityIndicator size="large" color={APPCOLORS.WHITE} />
        </View>
      )}

      <ScrollView
        contentContainerStyle={{paddingBottom: 20}}
        showsVerticalScrollIndicator={false}>
        <Modal isVisible={visible}>
          <View
            style={{
              height: responsiveHeight(70),
              width: responsiveWidth(90),
              backgroundColor: APPCOLORS.WHITE,
              borderRadius: 20,
              padding: 20,
            }}>
            <PlatformGradient
              colors={['#1D4452', '#4199B8']}
              style={{
                padding: 20,
                flexDirection: 'row',
                justifyContent: 'space-between',
                borderRadius: 25,
                alignItems: 'center',
              }}>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <AntDesign
                  name={'close'}
                  color={APPCOLORS.WHITE}
                  size={responsiveFontSize(2)}
                />
              </TouchableOpacity>

              <AppText
                title={
                  Type == 'bell'
                    ? 'Outstanding Receipt'
                    : Type == 'mail'
                    ? 'Outstanding Payment'
                    : Type == 'chat'
                    ? 'Outstanding Cheque'
                    : null
                }
                titleColor={APPCOLORS.WHITE}
                titleSize={2}
                titleWeight
              />

              <View />
            </PlatformGradient>

            <FlatList
              data={
                Type == 'bell'
                  ? AllData?.data_outstanding_receipt
                  : Type == 'mail'
                  ? AllData?.data_outstanding_payments
                  : Type == 'chat'
                  ? AllData?.data_outstanding_cheque
                  : null
              }
              contentContainerStyle={{
                gap: 10,
                marginTop: 10,
                paddingBottom: 100,
              }}
              renderItem={({item}) => {
                return (
                  <View
                    style={{
                      padding: 20,
                      width: responsiveWidth(80),
                      backgroundColor: APPCOLORS.DARKLIGHTBLUE,
                      borderRadius: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                    <View>
                      <AppText
                        title={'Name'}
                        titleColor={APPCOLORS.WHITE}
                        titleWeight
                        titleSize={2}
                        titleSizeWeight={40}
                      />
                      <AppText
                        title={item?.name}
                        titleColor={APPCOLORS.WHITE}
                        titleWeight
                        titleSize={1.7}
                        titleSizeWeight={40}
                      />
                    </View>

                    <View>
                      <AppText
                        title={'Amount'}
                        titleColor={APPCOLORS.WHITE}
                        titleWeight
                        titleSize={2}
                      />
                      <AppText
                        title={formatNumber(item?.total)}
                        titleColor={APPCOLORS.WHITE}
                        titleWeight
                        titleSize={1.8}
                      />
                    </View>
                  </View>
                );
              }}
            />
            <View></View>
          </View>
        </Modal>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
            justifyContent: 'center',
            marginTop: 20,
          }}>
          {getDisplayCards().map(item => (
            <DashboardTabs
              key={item.id}
              icon={item.icon}
              name={item.name}
              onPress={item.onPress}
              isMoreButton={item.isMoreButton}
              disabled={item.disabled}
            />
          ))}
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            width: responsiveWidth(90),
            alignSelf: 'center',
            gap: 5,
            marginTop: 20,
          }}>
          <Image
            source={AppImages.speak}
            style={{
              height: responsiveHeight(2),
              width: responsiveHeight(2),
              resizeMode: 'contain',
            }}
          />
          <AppText
            title="Announcement"
            titleSize={2.5}
            titleColor={APPCOLORS.BLACK}
            titleWeight
          />
        </View>

        <FlatList
          data={mainCards}
          horizontal
          contentContainerStyle={{gap: 20, paddingLeft: 10, marginTop: 10}}
          renderItem={({item}) => {
            return (
              <PlatformGradient
                colors={[APPCOLORS.Primary, APPCOLORS.Secondary]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={{
                  height: responsiveHeight(18),
                  width: responsiveWidth(80),
                  backgroundColor: APPCOLORS.BarColor,
                  borderRadius: 10,
                  padding: 20,
                  gap: 20,
                }}>
                <AppText
                  title="🎉 New Feature Release"
                  titleColor={APPCOLORS.WHITE}
                  titleSize={2}
                  titleWeight
                />
                <View style={{width: responsiveWidth(60)}}>
                  <AppText
                    title='Inventory tracking has been enhanced! Check it out under the "Warehouse" module.'
                    titleColor={APPCOLORS.WHITE}
                    titleSize={1.7}
                  />
                </View>
              </PlatformGradient>
            );
          }}
        />
      </ScrollView>
    </View>
  );
};

export default Dashboard;
