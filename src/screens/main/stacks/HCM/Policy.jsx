import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Animatable from 'react-native-animatable';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import {BASEURL} from '../../../../utils/BaseUrl';
import SimpleHeader from '../../../../components/SimpleHeader';
import {APPCOLORS} from '../../../../utils/APPCOLORS';

const Policy = ({navigation}) => {
  // Data states
  const [policies, setPolicies] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch policies on mount
  useEffect(() => {
    fetchPolicies(false);
  }, []);

  const fetchPolicies = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoadingList(true);
    }

    try {
      const response = await axios.get(`${BASEURL}get_all_policies.php`);
      console.log('Get Policies Response:', response.data);
      if (response.data && (response.data.status === true || response.data.status === 'true')) {
        setPolicies(response.data.data || []);
      } else {
        setPolicies([]);
      }
    } catch (error) {
      console.log('Error fetching policies:', error);
      Toast.show({
        type: 'error',
        text1: 'Fetch Failed',
        text2: 'Failed to retrieve policies list.',
      });
    } finally {
      setLoadingList(false);
      setRefreshing(false);
    }
  };

  const viewPolicy = item => {
    navigation.navigate('PolicyViewer', {
      title: item.description,
      url: item.image_path,
    });
  };

  const renderPolicyCard = ({item}) => {
    // Check if the policy file is an image
    const isImage = /\.(jpg|jpeg|png|webp)$/i.test(item.image_name || '');

    return (
      <Animatable.View animation="fadeInUp" duration={400} style={styles.policyCard}>
        <View style={styles.cardHeader}>
          <Icon name="file-document-outline" size={24} color={APPCOLORS.Primary} />
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{item.description}</Text>
            <Text style={styles.cardDate}>{item.created_at}</Text>
          </View>
        </View>

        {isImage && item.image_path ? (
          <TouchableOpacity onPress={() => viewPolicy(item)} activeOpacity={0.9}>
            <Image source={{uri: item.image_path}} style={styles.policyImagePreview} resizeMode="cover" />
          </TouchableOpacity>
        ) : null}

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => viewPolicy(item)}>
            <Icon name="open-in-new" size={16} color="#ffffff" style={{marginRight: 6}} />
            <Text style={styles.viewButtonText}>View Policy</Text>
          </TouchableOpacity>
        </View>
      </Animatable.View>
    );
  };

  return (
    <View style={styles.container}>
      <SimpleHeader title="Company Policies" />
      
      {loadingList && !refreshing ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={APPCOLORS.Primary} />
          <Text style={styles.loadingText}>Retrieving policies...</Text>
        </View>
      ) : (
        <FlatList
          data={policies}
          renderItem={renderPolicyCard}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchPolicies(true)}
              colors={[APPCOLORS.Primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="file-remove-outline" size={50} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Policies Found</Text>
              <Text style={styles.emptySubtitle}>There are currently no active company policies.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default Policy;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APPCOLORS.BG_SCREEN || '#F3F4F6',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  policyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  cardDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  policyImagePreview: {
    height: 150,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    borderTopWidth: 1,
    borderColor: '#f3f4f6',
    paddingTop: 12,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APPCOLORS.Primary || '#1a1c22',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#4b5563',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
  },
});
