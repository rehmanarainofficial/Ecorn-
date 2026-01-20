import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const PayrollExpenseDetail = () => {
  return (
    <View style={styles.container}>
      <Text>Payroll Expense Detail Screen</Text>
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

export default PayrollExpenseDetail;
