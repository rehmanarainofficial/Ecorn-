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
  const [AllData, setAllData] = useState({});
  const [Loading, setLoading] = useState(false);
  const [Refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getAllData();
  }, []);

  const getAllData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASEURL}dash_approval.php`);
      const newData = res.data?.approval_data || {};
      setAllData(newData);
    } catch (err) {
      console.log('API Error: ', err);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getAllData();
    setRefreshing(false);
  };

  // 🔑 Modules Config
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
              disabled: isRestricted, // Section level restriction
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
      </ScrollView>
    </View>
  );
};

export default AlertScreen;
