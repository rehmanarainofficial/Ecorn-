import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, FlatList} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SimpleHeader from '../../../../components/SimpleHeader';
import * as Animatable from 'react-native-animatable';

const buttons = [
  {
    name: 'Add New Assets',
    icon: 'plus-box',
    screen: 'AddFixAsset',
  },
  {
    name: 'Search Assets',
    icon: 'magnify',
    screen: 'SearchFixAsset',
  },
];

export default function FixAssetScreen({navigation}) {
  const renderButton = ({item, index}) => {
    return (
      <Animatable.View
        animation="fadeInUp"
        delay={index * 120}
        useNativeDriver
        style={styles.buttonWrapper}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate(item.screen)}
          style={styles.buttonContainer}>
          <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            iterationDelay={4000}
            style={styles.iconContainer}>
            <Icon name={item.icon} size={22} color="#FFFFFF" />
          </Animatable.View>
          <View style={{flex: 1}}>
            <Text style={styles.buttonText}>{item.name}</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  return (
    <View style={styles.container}>
      <SimpleHeader title="Fix Assets" />
      <FlatList
        data={buttons}
        renderItem={renderButton}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{paddingVertical: 20}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  buttonWrapper: {
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#1a1c22',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 12,
  },
  iconContainer: {
    padding: 10,
    marginRight: 12,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
