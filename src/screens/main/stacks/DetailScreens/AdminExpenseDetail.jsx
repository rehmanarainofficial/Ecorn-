import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const AdminExpenseDetail = () => {
  return (
    <View style={styles.container}>
      <Text>Admin Expense Detail Screen</Text>
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

export default AdminExpenseDetail;
