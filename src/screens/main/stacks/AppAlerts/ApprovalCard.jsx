import React, {useState} from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  View,
  ActivityIndicator,
} from 'react-native';
import Animated, {FadeInUp} from 'react-native-reanimated';
import PlatformGradient from '../../../../components/PlatformGradient';
import AppText from '../../../../components/AppText';
import {APPCOLORS} from '../../../../utils/APPCOLORS';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import {generateAndDownloadPDF} from '../../../../components/PDFGenerator';
import {BASEURL} from '../../../../utils/BaseUrl';

const ApprovalCard = ({
  reference,
  ord_date,
  name,
  total,
  onApprove,
  trans_no,
  type,
  navigation,
  screenType,
}) => {
  const [viewLoading, setViewLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [glViewLoading, setGlViewLoading] = useState(false);

  const isVoucherScreen = screenType === 'voucher_approval';

  const isJobCardScreen =
    screenType === 'electrocal_job_cards' ||
    screenType === 'mechnical_job_cards';

  // ✅ Check if this is Location Transfer screen
  const isLocationTransferScreen = screenType === 'location_transfer_app';

  const handleGLView = async () => {
    if (!isVoucherScreen) return;

    setGlViewLoading(true);
    try {
      const formData = new FormData();
      formData.append('trans_no', trans_no);
      formData.append('type', type);

      const response = await axios.post(`${BASEURL}view_gl.php`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      navigation.navigate('GLViewScreen', {
        glData: response.data,
        reference: reference,
        transNo: trans_no,
      });
    } catch (error) {
      console.log('GL View API Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch GL details',
      });
    } finally {
      setGlViewLoading(false);
    }
  };

  const handleView = async () => {
    setViewLoading(true);
    try {
      if (isJobCardScreen) {
        // For Electrical/Mechanical Job Cards
        navigation.navigate('ManufacturingView', {
          trans_no: trans_no,
        });
      } else if (isLocationTransferScreen) {
        // ✅ For Location Transfer - Use a specific view or same as others
        const formData = new FormData();
        formData.append('trans_no', trans_no);
        formData.append('type', type);

        const response = await axios.post(`${BASEURL}view_data.php`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        navigation.navigate('ViewDetailsScreen', {
          viewData: response.data,
        });
      } else {
        // For other screens (Quotation, Order, PO, etc.)
        const formData = new FormData();
        formData.append('trans_no', trans_no);
        formData.append('type', type);

        const response = await axios.post(`${BASEURL}view_data.php`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        navigation.navigate('ViewDetailsScreen', {
          viewData: response.data,
        });
      }
    } catch (error) {
      console.log('View API Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch details',
      });
    } finally {
      setViewLoading(false);
    }
  };

  const handleApprovePress = async () => {
    setApproveLoading(true);
    try {
      await onApprove();
    } finally {
      setApproveLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloadLoading(true);
    try {
      const formData = new FormData();
      formData.append('trans_no', trans_no);
      formData.append('type', type);

      const response = await axios.post(`${BASEURL}view_data.php`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = response.data;
      await generateAndDownloadPDF(data, reference);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Download Failed',
        text2: 'Failed to download PDF',
      });
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <PlatformGradient
      colors={[APPCOLORS.Primary, APPCOLORS.Secondary]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.screen}>
      <ScrollView contentContainerStyle={{padding: 15}}>
        <Animated.View
          entering={FadeInUp.delay(200)}
          style={styles.cardWrapper}>
          <PlatformGradient
            colors={[APPCOLORS.Primary, APPCOLORS.Secondary]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.card}>
            {/* Top row: Reference */}
            <View style={styles.topRow}>
              <AppText
                title={reference}
                titleSize={2}
                titleColor={APPCOLORS.WHITE}
                titleWeight
              />
            </View>

            {/* Details */}
            <View style={styles.detailsContainer}>
              <AppText
                title={`Date: ${ord_date}`}
                titleSize={2}
                titleColor={APPCOLORS.WHITE}
              />
              <AppText
                title={name}
                titleSize={2}
                titleColor={APPCOLORS.WHITE}
              />
              <AppText
                title={`Total: ${total}`}
                titleSize={2}
                titleColor={APPCOLORS.WHITE}
                titleWeight
              />
            </View>

            {/* Buttons Row */}
            <View style={styles.buttonsRow}>
              {/* Approve Button */}
              <TouchableOpacity
                onPress={handleApprovePress}
                disabled={approveLoading}
                style={[
                  styles.buttonWrapper,
                  isVoucherScreen ? styles.fourButton : styles.threeButton,
                ]}>
                <PlatformGradient
                  colors={[APPCOLORS.Secondary, APPCOLORS.Primary]}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.button}>
                  {approveLoading ? (
                    <ActivityIndicator size="small" color={APPCOLORS.WHITE} />
                  ) : (
                    <AppText
                      title="Appr.."
                      titleSize={1.8}
                      titleColor={APPCOLORS.WHITE}
                      titleWeight
                    />
                  )}
                </PlatformGradient>
              </TouchableOpacity>

              {/* View Button */}
              <TouchableOpacity
                onPress={handleView}
                disabled={viewLoading}
                style={[
                  styles.buttonWrapper,
                  isVoucherScreen ? styles.fourButton : styles.threeButton,
                ]}>
                <PlatformGradient
                  colors={[APPCOLORS.Secondary, APPCOLORS.Primary]}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.button}>
                  {viewLoading ? (
                    <ActivityIndicator size="small" color={APPCOLORS.WHITE} />
                  ) : (
                    <AppText
                      title="View"
                      titleSize={1.8}
                      titleColor={APPCOLORS.WHITE}
                      titleWeight
                    />
                  )}
                </PlatformGradient>
              </TouchableOpacity>

              {/* PDF Button */}
              <TouchableOpacity
                onPress={handleDownloadPDF}
                disabled={downloadLoading}
                style={[
                  styles.buttonWrapper,
                  isVoucherScreen ? styles.fourButton : styles.threeButton,
                ]}>
                <PlatformGradient
                  colors={[APPCOLORS.Secondary, APPCOLORS.Primary]}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.button}>
                  {downloadLoading ? (
                    <ActivityIndicator size="small" color={APPCOLORS.WHITE} />
                  ) : (
                    <AppText
                      title="PDF"
                      titleSize={1.8}
                      titleColor={APPCOLORS.WHITE}
                      titleWeight
                    />
                  )}
                </PlatformGradient>
              </TouchableOpacity>

              {/* GL View Button - Only show for Voucher screen */}
              {isVoucherScreen && (
                <TouchableOpacity
                  onPress={handleGLView}
                  disabled={glViewLoading}
                  style={styles.fourButton}>
                  <PlatformGradient
                    colors={[APPCOLORS.Secondary, APPCOLORS.Primary]}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.button}>
                    {glViewLoading ? (
                      <ActivityIndicator size="small" color={APPCOLORS.WHITE} />
                    ) : (
                      <AppText
                        title="GL View"
                        titleSize={1.8}
                        titleColor={APPCOLORS.WHITE}
                        titleWeight
                      />
                    )}
                  </PlatformGradient>
                </TouchableOpacity>
              )}
            </View>
          </PlatformGradient>
        </Animated.View>
      </ScrollView>
    </PlatformGradient>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    borderRadius: 20,
    marginVertical: 5,
    marginHorizontal: 5,
  },
  cardWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
  },
  card: {
    padding: 20,
    borderRadius: 20,
    shadowColor: APPCOLORS.BLACK,
    shadowOpacity: 0.3,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailsContainer: {
    marginBottom: 15,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  buttonWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: 36,
  },
  threeButton: {
    flex: 1,
  },
  fourButton: {
    flex: 1,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
});

export default ApprovalCard;
