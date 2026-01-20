import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const SellingExpenseDetail = () => {
  return (
    <View style={styles.container}>
      <Text>Selling & Marketing Expense Detail Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SellingExpenseDetail;
