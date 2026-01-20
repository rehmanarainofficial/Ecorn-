import React from 'react';
import {View, ScrollView, Animated, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SimpleHeader from '../../../../components/SimpleHeader';
import AppText from '../../../../components/AppText';
import {APPCOLORS} from '../../../../utils/APPCOLORS';
import PlatformGradient from '../../../../components/PlatformGradient';

const ViewDetailsScreen = ({route}) => {
  const {viewData} = route.params;
  const header = viewData?.data_header?.[0];
  const details = viewData?.data_detail || [];

  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Check if no data is available
  const hasData = header || details.length > 0;

  if (!hasData) {
    return (
      <View style={styles.container}>
        <SimpleHeader title="View Details" />
        <View style={styles.noDataContainer}>
          <Animated.View
            style={[
              styles.noDataContent,
              {
                opacity: fadeAnim,
                transform: [{translateY: slideAnim}],
              },
            ]}>
            <Icon name="database-off" size={80} color={APPCOLORS.WHITE} />
            <AppText
              title="No Data Available"
              titleSize={3}
              titleColor={APPCOLORS.WHITE}
              titleWeight
              style={styles.noDataTitle}
            />
            <AppText
              title="There are no details available to display."
              titleSize={2}
              titleColor={APPCOLORS.WHITE}
              style={styles.noDataSubtitle}
            />
            <AppText
              title="Please check if the transaction exists or try again later."
              titleSize={1.8}
              titleColor={APPCOLORS.WHITE}
              style={styles.noDataMessage}
            />
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SimpleHeader title="View Details" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header Information Card */}
        {header && (
          <Animated.View
            style={[
              styles.cardWrapper,
              {
                opacity: fadeAnim,
                transform: [{translateY: slideAnim}],
              },
            ]}>
            <PlatformGradient
              colors={[APPCOLORS.Primary, APPCOLORS.Secondary]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.card}>
              {/* Use Type as Heading */}
              <AppText
                title={header.type || 'Header Information'}
                titleSize={3}
                titleColor={APPCOLORS.WHITE}
                titleWeight
                style={styles.cardTitle}
              />

              <View style={styles.detailsGrid}>
                <View style={styles.detailRow}>
                  <AppText
                    title="Reference:"
                    titleSize={2}
                    titleColor={APPCOLORS.WHITE}
                  />
                  <AppText
                    title={header.reference || 'N/A'}
                    titleSize={2}
                    titleColor={APPCOLORS.WHITE}
                  />
                </View>

                <View style={styles.detailRow}>
                  <AppText
                    title="Date:"
                    titleSize={2}
                    titleColor={APPCOLORS.WHITE}
                  />
                  <AppText
                    title={header.trans_date || 'N/A'}
                    titleSize={2}
                    titleColor={APPCOLORS.WHITE}
                  />
                </View>

                <View style={styles.detailRow}>
                  <AppText
                    title="Due Date:"
                    titleSize={2}
                    titleColor={APPCOLORS.WHITE}
                  />
                  <AppText
                    title={header.due_date || 'N/A'}
                    titleSize={2}
                    titleColor={APPCOLORS.WHITE}
                  />
                </View>

                <View style={styles.detailRow}>
                  <AppText
                    title="Customer:"
                    titleSize={2}
                    titleColor={APPCOLORS.WHITE}
                  />
                  <AppText
                    title={header.name || 'N/A'}
                    titleSize={2}
                    titleColor={APPCOLORS.WHITE}
                  />
                </View>

                <View style={styles.detailRow}>
                  <AppText
                    title="Location:"
                    titleSize={2}
                    titleColor={APPCOLORS.WHITE}
                  />
                  <AppText
                    title={header.location_name || 'N/A'}
                    titleSize={2}
                    titleColor={APPCOLORS.WHITE}
                  />
                </View>

                <View style={styles.detailRow}>
                  <AppText
                    title="Salesman:"
                    titleSize={2}
                    titleColor={APPCOLORS.WHITE}
                  />
                  <AppText
                    title={header.salesman || 'N/A'}
                    titleSize={2}
                    titleColor={APPCOLORS.WHITE}
                  />
                </View>

                <View style={styles.detailRow}>
                  <AppText
                    title="Payment Terms:"
                    titleSize={2}
                    titleColor={APPCOLORS.WHITE}
                  />
                  <AppText
                    title={header.payment_terms || 'N/A'}
                    titleSize={2}
                    titleColor={APPCOLORS.WHITE}
                  />
                </View>

                <View style={[styles.detailRow, styles.totalRow]}>
                  <AppText
                    title="Total:"
                    titleSize={2}
                    titleColor={APPCOLORS.WHITE}
                    titleWeight
                  />
                  <AppText
                    title={header.total || '0'}
                    titleSize={2}
                    titleColor={APPCOLORS.WHITE}
                    titleWeight
                  />
                </View>
              </View>

              {/* Comments Section */}
              {header.comments && (
                <View style={styles.section}>
                  <View style={styles.divider} />
                  <AppText
                    title="Comments:"
                    titleSize={2}
                    titleColor={APPCOLORS.WHITE}
                    titleWeight
                  />
                  <AppText
                    title={header.comments}
                    titleSize={2}
                    titleColor={APPCOLORS.WHITE}
                    style={styles.commentsText}
                  />
                </View>
              )}

              {/* Terms & Conditions Section */}
              {header.term_cond && (
                <View style={styles.section}>
                  <View style={styles.divider} />
                  <AppText
                    title="Terms & Conditions:"
                    titleSize={2}
                    titleColor={APPCOLORS.WHITE}
                    titleWeight
                  />
                  <AppText
                    title={header.term_cond}
                    titleSize={2}
                    titleColor={APPCOLORS.WHITE}
                    style={styles.termsText}
                  />
                </View>
              )}
            </PlatformGradient>
          </Animated.View>
        )}

        {/* Items Details Card */}
        {details.length > 0 && (
          <Animated.View
            style={[
              styles.cardWrapper,
              {
                opacity: fadeAnim,
                transform: [{translateY: slideAnim}],
              },
            ]}>
            <PlatformGradient
              colors={[APPCOLORS.Primary, APPCOLORS.Secondary]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.card}>
              <AppText
                title={`Items (${details.length})`}
                titleSize={3}
                titleColor={APPCOLORS.WHITE}
                titleWeight
                style={styles.cardTitle}
              />

              {details.map((item, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.itemCard,
                    {
                      opacity: fadeAnim,
                      transform: [
                        {
                          translateY: Animated.multiply(slideAnim, 0.5),
                        },
                      ],
                    },
                  ]}>
                  <PlatformGradient
                    colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                    style={styles.itemGradient}>
                    <View style={styles.itemDetails}>
                      <View style={styles.detailRow}>
                        <AppText
                          title="Stock ID:"
                          titleSize={2}
                          titleColor={APPCOLORS.WHITE}
                        />
                        <AppText
                          title={item.stock_id || 'N/A'}
                          titleSize={2}
                          titleColor={APPCOLORS.WHITE}
                        />
                      </View>

                      {/* Combined Qty and Unit Price in one row */}
                      <View style={styles.combinedRow}>
                        <View style={styles.combinedItem}>
                          <AppText
                            title="Qty:"
                            titleSize={2}
                            titleColor={APPCOLORS.WHITE}
                          />
                          <AppText
                            title={item.quantity || '0'}
                            titleSize={2}
                            titleColor={APPCOLORS.WHITE}
                          />
                        </View>
                        <View style={styles.combinedItem}>
                          <AppText
                            title="Unit Price:"
                            titleSize={2}
                            titleColor={APPCOLORS.WHITE}
                          />
                          <AppText
                            title={item.unit_price || '0'}
                            titleSize={2}
                            titleColor={APPCOLORS.WHITE}
                          />
                        </View>
                      </View>

                      {/* Long Description */}
                      {item.long_description && (
                        <View style={styles.longDescSection}>
                          <AppText
                            title="Description:"
                            titleSize={2}
                            titleColor={APPCOLORS.WHITE}
                            titleWeight
                          />
                          <AppText
                            title={item.long_description}
                            titleSize={2}
                            titleColor={APPCOLORS.WHITE}
                            style={styles.longDescText}
                          />
                        </View>
                      )}
                    </View>
                  </PlatformGradient>
                </Animated.View>
              ))}
            </PlatformGradient>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APPCOLORS.Secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
  },
  // No Data Styles
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataTitle: {
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  noDataSubtitle: {
    marginBottom: 10,
    textAlign: 'center',
    opacity: 0.9,
  },
  noDataMessage: {
    textAlign: 'center',
    opacity: 0.8,
    paddingHorizontal: 20,
  },
  // Existing Styles
  cardWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: APPCOLORS.BLACK,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  card: {
    padding: 20,
    borderRadius: 20,
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: 15,
  },
  detailsGrid: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalRow: {
    marginTop: 5,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 12,
  },
  section: {
    marginTop: 5,
  },
  commentsText: {
    marginTop: 4,
    fontStyle: 'italic',
  },
  termsText: {
    marginTop: 4,
    lineHeight: 18,
  },
  itemCard: {
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemGradient: {
    padding: 15,
    borderRadius: 12,
  },
  itemDetails: {
    gap: 6,
  },
  combinedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  combinedItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  longDescSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  longDescText: {
    marginTop: 4,
    lineHeight: 16,
  },
});

export default ViewDetailsScreen;
