import React from 'react';
import {View, ScrollView, Animated} from 'react-native';
import SimpleHeader from '../../../../components/SimpleHeader';
import AppText from '../../../../components/AppText';
import {APPCOLORS} from '../../../../utils/APPCOLORS';
import PlatformGradient from '../../../../components/PlatformGradient';

const GLViewScreen = ({route}) => {
  const {glData} = route.params;
  const header = glData.data_header?.[0];
  const details = glData.data_detail || [];

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

  // Format amount display
  const formatAmount = amount => {
    if (!amount || amount === '0') return '-';
    const num = parseFloat(amount);
    return num.toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Calculate totals
  const calculateTotals = () => {
    let totalDebit = 0;
    let totalCredit = 0;

    details.forEach(entry => {
      if (entry.debit && parseFloat(entry.debit) > 0) {
        totalDebit += parseFloat(entry.debit);
      }
      if (entry.credit && parseFloat(entry.credit) !== 0) {
        totalCredit += Math.abs(parseFloat(entry.credit));
      }
    });

    return {totalDebit, totalCredit};
  };

  const {totalDebit, totalCredit} = calculateTotals();

  // Shorten long account names
  const shortenAccountName = name => {
    if (!name) return 'N/A';
    if (name.length > 40) {
      return name.substring(0, 40) + '...';
    }
    return name;
  };

  return (
    <View style={styles.container}>
      <SimpleHeader title="General Ledger View" />
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
              <AppText
                title="Transaction Information"
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
                    title="Transaction No:"
                    titleSize={2}
                    titleColor={APPCOLORS.WHITE}
                  />
                  <AppText
                    title={header.trans_no || 'N/A'}
                    titleSize={2}
                    titleColor={APPCOLORS.WHITE}
                  />
                </View>

                <View style={styles.detailRow}>
                  <AppText
                    title="Type:"
                    titleSize={2}
                    titleColor={APPCOLORS.WHITE}
                  />
                  <AppText
                    title={header.type || 'N/A'}
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
                    title={header.cheque_date || header.trans_date || 'N/A'}
                    titleSize={2}
                    titleColor={APPCOLORS.WHITE}
                  />
                </View>

                <View style={styles.detailRow}>
                  <AppText
                    title="Company:"
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
                    title="Prepared By:"
                    titleSize={2}
                    titleColor={APPCOLORS.WHITE}
                  />
                  <AppText
                    title={header.real_name || 'Administrator'}
                    titleSize={2}
                    titleColor={APPCOLORS.WHITE}
                  />
                </View>

                {/* Conditional Cheque No Display */}
                {header.cheque_no && (
                  <View style={styles.detailRow}>
                    <AppText
                      title="Cheque No:"
                      titleSize={2}
                      titleColor={APPCOLORS.WHITE}
                    />
                    <AppText
                      title={header.cheque_no}
                      titleSize={2}
                      titleColor={APPCOLORS.WHITE}
                    />
                  </View>
                )}

                {/* Conditional Cheque Date Display */}
                {header.cheque_date && (
                  <View style={styles.detailRow}>
                    <AppText
                      title="Cheque Date:"
                      titleSize={2}
                      titleColor={APPCOLORS.WHITE}
                    />
                    <AppText
                      title={header.cheque_date}
                      titleSize={2}
                      titleColor={APPCOLORS.WHITE}
                    />
                  </View>
                )}
              </View>
            </PlatformGradient>
          </Animated.View>
        )}

        {/* GL Entries Card */}
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
                title={`GL Entries (${details.length})`}
                titleSize={3}
                titleColor={APPCOLORS.WHITE}
                titleWeight
                style={styles.cardTitle}
              />

              {details.map((entry, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.entryCard,
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
                    style={styles.entryGradient}>
                    <View style={styles.entryDetails}>
                      <View style={styles.detailRow}>
                        <AppText
                          title="Account Code:"
                          titleSize={2}
                          titleColor={APPCOLORS.WHITE}
                        />
                        <AppText
                          title={entry.account || 'N/A'}
                          titleSize={2}
                          titleColor={APPCOLORS.WHITE}
                        />
                      </View>
                      <View style={styles.detailRow}>
                        <View style={{flex: 1}}>
                          <AppText
                            title={shortenAccountName(entry.account_name)}
                            titleSize={2}
                            titleColor={APPCOLORS.WHITE}
                            style={styles.accountName}
                          />
                        </View>
                      </View>
                      {/* Amounts Row */}
                      <View style={styles.amountsRow}>
                        {entry.debit && parseFloat(entry.debit) > 0 && (
                          <View style={styles.amountItem}>
                            <AppText
                              title="Debit:"
                              titleSize={2}
                              titleColor={APPCOLORS.WHITE}
                              titleWeight
                            />
                            <AppText
                              title={formatAmount(entry.debit)}
                              titleSize={2}
                              titleColor={APPCOLORS.WHITE}
                              titleWeight
                            />
                          </View>
                        )}

                        {entry.credit && parseFloat(entry.credit) !== 0 && (
                          <View style={styles.amountItem}>
                            <AppText
                              title="Credit:"
                              titleSize={2}
                              titleColor={APPCOLORS.WHITE}
                              titleWeight
                            />
                            <AppText
                              title={formatAmount(entry.credit)}
                              titleSize={2}
                              titleColor={APPCOLORS.WHITE}
                              titleWeight
                            />
                          </View>
                        )}
                      </View>

                      {/* Memo */}
                      {entry.memo_ &&
                        entry.memo_ !== '0' &&
                        entry.memo_.trim() !== '' && (
                          <View style={styles.memoSection}>
                            <AppText
                              title="Memo:"
                              titleSize={2}
                              titleColor={APPCOLORS.WHITE}
                              titleWeight
                            />
                            <AppText
                              title={entry.memo_}
                              titleSize={2}
                              titleColor={APPCOLORS.WHITE}
                              style={styles.memoText}
                            />
                          </View>
                        )}

                      {/* Cheque No in detail if available */}
                      {entry.cheque && (
                        <View style={styles.detailRow}>
                          <AppText
                            title="Cheque No:"
                            titleSize={2}
                            titleColor={APPCOLORS.WHITE}
                          />
                          <AppText
                            title={entry.cheque}
                            titleSize={2}
                            titleColor={APPCOLORS.WHITE}
                          />
                        </View>
                      )}
                    </View>
                  </PlatformGradient>
                </Animated.View>
              ))}

              {/* Totals Section */}
              <View style={styles.totalsSection}>
                <View style={styles.totalItem}>
                  <AppText
                    title="Total Debit:"
                    titleSize={2.2}
                    titleColor={APPCOLORS.WHITE}
                    titleWeight
                  />
                  <AppText
                    title={formatAmount(totalDebit)}
                    titleSize={2.2}
                    titleColor={APPCOLORS.WHITE}
                    titleWeight
                  />
                </View>
                <View style={styles.totalItem}>
                  <AppText
                    title="Total Credit:"
                    titleSize={2.2}
                    titleColor={APPCOLORS.WHITE}
                    titleWeight
                  />
                  <AppText
                    title={formatAmount(totalCredit)}
                    titleSize={2.2}
                    titleColor={APPCOLORS.WHITE}
                    titleWeight
                  />
                </View>
              </View>
            </PlatformGradient>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = {
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
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  entryGradient: {
    padding: 15,
    borderRadius: 12,
  },
  entryNumber: {
    textAlign: 'center',
    marginBottom: 10,
  },
  entryDetails: {
    gap: 8,
  },
  accountName: {
    flex: 1,
    textAlign: 'right',
    flexWrap: 'wrap',
  },
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  amountItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  memoSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  memoText: {
    marginTop: 4,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  totalsSection: {
    marginTop: 15,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: 12,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
};

export default GLViewScreen;
