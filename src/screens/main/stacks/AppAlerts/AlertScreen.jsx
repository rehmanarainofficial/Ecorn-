import React, {useEffect, useState} from 'react';
import {
  View,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import SimpleHeader from '../../../../components/SimpleHeader';
import AlertCards from '../../../../components/AlertCards';
import {APPCOLORS} from '../../../../utils/APPCOLORS';
import {useSelector} from 'react-redux';
import {BASEURL} from '../../../../utils/BaseUrl';

const AlertScreen = ({navigation}) => {
  const mobileAccessData = useSelector(state => state.Data.mobileAccessData);
  const userData = useSelector(state => state.Data.currentData);
  const [AllData, setAllData] = useState({});
  const [leaveApprovalCount, setLeaveApprovalCount] = useState(0);
  const [Loading, setLoading] = useState(false);
  const [Refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getAllData();
  }, [userData?.employee_id]);

  const formatToYYYYMMDD = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMonthRange = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return {
      fromDate: formatToYYYYMMDD(firstDay),
      toDate: formatToYYYYMMDD(lastDay),
    };
  };

  const extractLeaveApprovalList = data => {
    const userId = userData?.id;

    if (userId && Array.isArray(data?.[userId])) {
      return data[userId];
    }
    if (Array.isArray(data?.data)) {
      return data.data;
    }
    if (Array.isArray(data)) {
      return data;
    }

    return [];
  };

  const isPendingLeaveApproval = item => {
    return (
      item?.approve === undefined ||
      item.approve === null ||
      item.approve === '' ||
      item.approve === '0' ||
      item.approve === 0
    );
  };

  const getLeaveApprovalCount = async () => {
    if (!userData?.employee_id) {
      setLeaveApprovalCount(0);
      return;
    }

    const {fromDate, toDate} = getMonthRange();
    const formData = new FormData();
    formData.append('head_id', userData.employee_id);
    formData.append('employee_id', '');
    formData.append('from_date', fromDate);
    formData.append('to_date', toDate);

    try {
      const res = await axios.post(
        `${BASEURL}dept_leave_approval.php`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      const pendingLeaves = extractLeaveApprovalList(res.data).filter(
        isPendingLeaveApproval,
      );
      setLeaveApprovalCount(pendingLeaves.length);
    } catch (err) {
      console.log('Leave approval count error: ', err);
      setLeaveApprovalCount(0);
    }
  };

  const getAllData = async () => {
    setLoading(true);
    try {
      const [res] = await Promise.all([
        axios.get(`${BASEURL}dash_approval.php`),
        getLeaveApprovalCount(),
      ]);
      const newData = res.data?.approval_data || {};
      setAllData(newData);
    } catch (err) {
      console.log('API Error: ', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getAllData();
    setRefreshing(false);
  };

  // Modules Config
  const moduleGroups = [
    {
      title: 'Sales Alert',
      items: [
        {
          heading: 'Sale Quotation',
          key: 'quotation_approval',
          icon: 'file-alt',
          screen: 'SaleQuotationScreen',
        },
        {
          heading: 'Sale Order',
          key: 'so_approval',
          icon: 'shopping-cart',
          screen: 'SaleOrderScreen',
        },
        {
          heading: 'Delivery Note',
          key: 'delivery_approval',
          icon: 'truck',
          screen: 'SaleDeliveryScreen',
        },
      ],
      accessKey: 'sales_alerts',
    },
    {
      title: 'Purchase Alert',
      items: [
        {
          heading: 'Purchase Order',
          key: 'po_approval',
          icon: 'clipboard-list',
          screen: 'PurchaseOrderScreen',
        },
        {
          heading: 'GRN Approval',
          key: 'grn_approval',
          icon: 'check-square',
          screen: 'GrnApprovalScreen',
        },
      ],
      accessKey: 'purchase_alerts',
    },
    {
      title: 'Inventory Alert',
      items: [
        {
          heading: 'Location Transfer',
          key: 'location_transfer_app',
          icon: 'exchange-alt',
          screen: 'LocationTransferScreen',
        },
      ],
      accessKey: 'inventory_alerts',
    },
    {
      title: 'Account Approval',
      items: [
        {
          heading: 'Voucher Approval',
          key: 'voucher_approval',
          icon: 'file-invoice-dollar',
          screen: 'VoucherApprovalScreen',
        },
      ],
      accessKey: 'accounts_alerts',
    },
    {
      title: 'Job Card Approval',
      items: [
        {
          heading: 'Electrical Approval',
          key: 'electrocal_job_cards',
          icon: 'bolt',
          screen: 'ElectricalApprovalScreen',
        },
        {
          heading: 'Mechanical Approval',
          key: 'mechnical_job_cards',
          icon: 'cogs',
          screen: 'MechanicalApprovalScreen',
        },
      ],
      accessKey: 'job_card_alerts',
    },
  ];

  if (Loading && Object.keys(AllData).length === 0) {
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <ActivityIndicator size="large" color={APPCOLORS.Primary} />
      </View>
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: '#F3F4F6'}}>
      <SimpleHeader title="Approvals" />
      <ScrollView
        contentContainerStyle={{padding: 15}}
        refreshControl={
          <RefreshControl refreshing={Refreshing} onRefresh={onRefresh} />
        }>
        {moduleGroups.map((group, idx) => {
          // Check access for the entire section
          const isRestricted = mobileAccessData?.[0]?.[group.accessKey] === '1';

          const props = {
            AlertHeading: group.title,
          };

          group.items.forEach((item, i) => {
            const value = AllData[item.key] ?? 0;

            const commonProps = {
              heading: item.heading,
              value,
              icon: item.icon,
              onPress: () =>
                navigation.navigate('ApprovalListScreen', {
                  listKey: item.key,
                  title: item.heading,
                }),
              disabled: isRestricted,
            };

            if (i === 0) {
              props.HeadingOne = commonProps.heading;
              props.ValueOne = commonProps.value;
              props.IconOne = commonProps.icon;
              props.onValuePressOne = commonProps.onPress;
              props.disabledOne = commonProps.disabled;
            }
            if (i === 1) {
              props.HeadingTwo = commonProps.heading;
              props.ValueTwo = commonProps.value;
              props.IconTwo = commonProps.icon;
              props.onValuePressTwo = commonProps.onPress;
              props.disabledTwo = commonProps.disabled;
            }
            if (i === 2) {
              props.HeadingThree = commonProps.heading;
              props.ValueThree = commonProps.value;
              props.IconThree = commonProps.icon;
              props.onValuePressThree = commonProps.onPress;
              props.disabledThree = commonProps.disabled;
            }
          });

          return <AlertCards key={idx} {...props} />;
        })}

        <AlertCards
          AlertHeading="Leave Approval"
          HeadingOne="Department Approval"
          ValueOne={leaveApprovalCount}
          IconOne="calendar-check"
          onValuePressOne={() =>
            navigation.navigate('LeaveInquiry', {mode: 'department'})
          }
        />

        <AlertCards
          AlertHeading="Live Tracking"
          HeadingOne="Employee Live Tracking"
          IconOne="map-marker-alt"
          onValuePressOne={() =>
            navigation.navigate('LiveTrackingScreen')
          }
        />
      </ScrollView>
    </View>
  );
};

export default AlertScreen;
