import {View, Text, TouchableOpacity, FlatList} from 'react-native';
import React from 'react';

import Ionicons from 'react-native-vector-icons/Ionicons';
import {APPCOLORS} from '../../../utils/APPCOLORS';
import {formatNumber} from '../../../utils/NumberUtils';

const Incentive = ({navigation, route}) => {
  const {TargetIncentive} = route.params;
  const formattedTarget = formatNumber(TargetIncentive[0]?.monthly_sale);
  console.log('formattedTarget', TargetIncentive);
  return (
    <View style={{flex: 1, backgroundColor: APPCOLORS.WHITE, padding: 20}}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Ionicons name={'chevron-back'} color={APPCOLORS.BLACK} size={30} />
      </TouchableOpacity>

      <View style={{marginTop: 20}}>
        <Text
          style={{
            alignSelf: 'center',
            color: APPCOLORS.BLACK,
            fontSize: 20,
            marginBottom: 5,
            fontWeight: 'bold',
          }}>
          Total Monthly Sale
        </Text>
        <Text
          style={{
            alignSelf: 'center',
            color: APPCOLORS.BLACK,
            fontSize: 20,
            marginBottom: 30,
          }}>
          Rs {formattedTarget}
        </Text>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}>
          <Text
            style={{
              color: APPCOLORS.BLACK,
              fontSize: 14,
              textAlign: 'center',
              flex: 1,
              fontWeight: 'bold',
              backgroundColor: 'lightblue',
            }}>
            Total {'\n'} Sales
          </Text>
          <Text
            style={{
              color: APPCOLORS.BLACK,
              fontSize: 14,
              textAlign: 'center',
              flex: 1,
              fontWeight: 'bold',
              backgroundColor: 'lightblue',
            }}>
            Commission {'\n'} Rate
          </Text>
          <Text
            style={{
              color: APPCOLORS.BLACK,
              fontSize: 14,
              textAlign: 'center',
              flex: 1,
              fontWeight: 'bold',
              backgroundColor: 'lightblue',
            }}>
            Total {'\n'} Commission
          </Text>
        </View>

        {/* List Items */}
        <FlatList
          data={TargetIncentive}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item}) => {
            return (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginVertical: 5,
                }}>
                <Text
                  style={{
                    flex: 1,
                    color: APPCOLORS.BLACK,
                    textAlign: 'center',
                    backgroundColor: 'lightgray',
                  }}>
                  Rs{formatNumber(item.min_value)} - Rs
                  {formatNumber(item.max_value)}
                </Text>
                <Text
                  style={{
                    flex: 1,
                    color: APPCOLORS.BLACK,
                    textAlign: 'center',
                    backgroundColor: 'lightgray',
                  }}>
                  {item.percentage}%
                </Text>
                <Text
                  style={{
                    flex: 1,
                    color: APPCOLORS.BLACK,
                    textAlign: 'center',
                    backgroundColor: 'lightgray',
                  }}>
                  Rs{formatNumber(item.min_com)} - Rs
                  {formatNumber(item.max_com)}
                </Text>
              </View>
            );
          }}
        />
      </View>
    </View>
  );
};

export default Incentive;
