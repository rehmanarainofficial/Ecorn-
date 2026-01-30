import React, {useState} from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  View,
  ActivityIndicator,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import PlatformGradient from '../../../../components/PlatformGradient';
import AppText from '../../../../components/AppText';
import {APPCOLORS} from '../../../../utils/APPCOLORS';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import {generateAndDownloadPDF} from '../../../../components/PDFGenerator';
import {BASEURL} from '../../../../utils/BaseUrl';
import {formatDateString} from '../../../../utils/DateUtils';
import {formatNumber} from '../../../../utils/NumberUtils';

const ApprovalCard = ({
  reference,
  ord_date,
  name,
  total,
  onApprove,
  onUnapprove,
  trans_no,
  type,
  navigation,
  screenType,
  serialNo,
  location_name,
  isApproved = false,
  index,
}) => {
  const [viewLoading, setViewLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [unapproveLoading, setUnapproveLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [glViewLoading, setGlViewLoading] = useState(false);

  const isVoucherScreen = screenType === 'voucher_approval';

  const isJobCardScreen =
    screenType === 'electrocal_job_cards' ||
    screenType === 'mechnical_job_cards';

  // ✅ Check if this is Location Transfer screen
  const isLocationTransferScreen = screenType === 'location_transfer_app';

  const formatAmount = amount => {
    return formatNumber(amount);
  };

  const handleGLView = async () => {
    if (!isVoucherScreen) return;

    setGlViewLoading(true);
    try {
      const formData = new FormData();
      formData.append('trans_no', trans_no);
      formData.append('type', type);

      const res = await fetch(`${BASEURL}view_gl.php`, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      const responseData = await res.json();
      navigation.navigate('GLViewScreen', {
        glData: responseData,
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
        navigation.navigate('ManufacturingView', {
          trans_no: trans_no,
        });
      } else if (isLocationTransferScreen) {
        const formData = new FormData();
        formData.append('trans_no', trans_no);
        formData.append('type', type);

        const res = await fetch(`${BASEURL}view_data.php`, {
          method: 'POST',
          body: formData,
          headers: {
            Accept: 'application/json',
          },
        });
        const responseData = await res.json();

        navigation.navigate('ViewDetailsScreen', {
          viewData: responseData,
          screenType: screenType,
        });
      } else {
        // For other screens (Quotation, Order, PO, etc.)
        const formData = new FormData();
        formData.append('trans_no', trans_no);
        formData.append('type', type);

        const res = await fetch(`${BASEURL}view_data.php`, {
          method: 'POST',
          body: formData,
          headers: {
            Accept: 'application/json',
          },
        });
        const responseData = await res.json();

        navigation.navigate('ViewDetailsScreen', {
          viewData: responseData,
          screenType: screenType,
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
      if (onApprove) {
        await onApprove();
      } else {
        console.log('onApprove is undefined!');
      }
    } catch (error) {
      console.log('handleApprovePress error:', error);
    } finally {
      setApproveLoading(false);
    }
  };

  const handleUnapprovePress = async () => {
    setUnapproveLoading(true);
    try {
      if (onUnapprove) {
        await onUnapprove();
      }
    } finally {
      setUnapproveLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloadLoading(true);
    try {
      const formData = new FormData();
      formData.append('trans_no', trans_no);
      formData.append('type', type);

      const res = await fetch(`${BASEURL}view_data.php`, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      const responseData = await res.json();
      await generateAndDownloadPDF(responseData, reference);
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
    <Animatable.View
      animation="fadeInUp"
      duration={600}
      delay={index ? index * 100 : 200}
      useNativeDriver
      style={styles.cardWrapper}>
      <PlatformGradient
        colors={[APPCOLORS.Primary, APPCOLORS.Secondary]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.card}>
        {/* Top row: Reference and Serial No */}
        <View style={styles.topRow}>
          <AppText
            title={reference}
            titleSize={2}
            titleColor={APPCOLORS.WHITE}
            titleWeight
          />
          {serialNo && (
            <View style={styles.serialBadge}>
              <AppText
                title={`${serialNo}`}
                titleSize={1.8}
                titleColor={APPCOLORS.WHITE}
                titleWeight
              />
            </View>
          )}
        </View>

        {/* Details */}
        <View style={styles.detailsContainer}>
          {isJobCardScreen ? (
            <>
              <AppText
                title={`Reference: ${reference}`}
                titleSize={2}
                titleColor={APPCOLORS.WHITE}
              />
              <AppText
                title={`Cost Center: ${name}`}
                titleSize={2}
                titleColor={APPCOLORS.WHITE}
              />
              <AppText
                title={`Date: ${formatDateString(ord_date)}`}
                titleSize={2}
                titleColor={APPCOLORS.WHITE}
              />
            </>
          ) : screenType === 'quotation_approval' ? (
            <>
              <AppText
                title={`Date: ${formatDateString(ord_date)}`}
                titleSize={2}
                titleColor={APPCOLORS.WHITE}
              />
              <AppText
                title={name}
                titleSize={2}
                titleColor={APPCOLORS.WHITE}
              />
              <AppText
                title={`Total: ${formatNumber(total)}`}
                titleSize={2}
                titleColor={APPCOLORS.WHITE}
                titleWeight
              />
            </>
          ) : (
            <>
              <AppText
                title={name}
                titleSize={2}
                titleColor={APPCOLORS.WHITE}
              />
              {location_name ? (
                <AppText
                  title={`Cost Center: ${location_name}`}
                  titleSize={2}
                  titleColor={APPCOLORS.WHITE}
                />
              ) : null}
              <AppText
                title={`Date: ${formatDateString(ord_date)}`}
                titleSize={2}
                titleColor={APPCOLORS.WHITE}
              />
              <AppText
                title={`Total: ${formatNumber(total)}`}
                titleSize={2}
                titleColor={APPCOLORS.WHITE}
                titleWeight
              />
            </>
          )}
        </View>

        {/* Row 1: View + PDF */}
        <View style={styles.buttonsRow}>
          {/* View Button */}
          <TouchableOpacity
            onPress={handleView}
            disabled={viewLoading}
            style={[styles.buttonWrapper, styles.halfButton]}>
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
            style={[styles.buttonWrapper, styles.halfButton]}>
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
        </View>

        {/* Row 2: Approve/Unapprove (+ GL View for Voucher) */}
        <View style={[styles.buttonsRow, {marginTop: 8}]}>
          {/* Approve Button - Only show if not already approved */}
          {!isApproved && (
            <TouchableOpacity
              onPress={handleApprovePress}
              disabled={approveLoading}
              style={[
                styles.buttonWrapper,
                isVoucherScreen ? styles.halfButton : styles.fullButton,
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
                    title="Approve"
                    titleSize={1.8}
                    titleColor={APPCOLORS.WHITE}
                    titleWeight
                  />
                )}
              </PlatformGradient>
            </TouchableOpacity>
          )}

          {/* Unapprove Button - Only show if already approved */}
          {isApproved && (
            <TouchableOpacity
              onPress={handleUnapprovePress}
              disabled={unapproveLoading}
              style={[
                styles.buttonWrapper,
                isVoucherScreen ? styles.halfButton : styles.fullButton,
              ]}>
              <PlatformGradient
                colors={[APPCOLORS.Secondary, APPCOLORS.Primary]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.button}>
                {unapproveLoading ? (
                  <ActivityIndicator size="small" color={APPCOLORS.WHITE} />
                ) : (
                  <AppText
                    title="Un-approve"
                    titleSize={1.8}
                    titleColor={APPCOLORS.WHITE}
                    titleWeight
                  />
                )}
              </PlatformGradient>
            </TouchableOpacity>
          )}

          {/* GL View Button - Only show for Voucher screen */}
          {isVoucherScreen && (
            <TouchableOpacity
              onPress={handleGLView}
              disabled={glViewLoading}
              style={[styles.buttonWrapper, styles.halfButton]}>
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
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    marginVertical: 4,
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
  serialBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
  halfButton: {
    flex: 1,
  },
  fullButton: {
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
