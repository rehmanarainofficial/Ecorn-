import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import Pdf from 'react-native-pdf';
import RNFetchBlob from 'react-native-blob-util';
import FileViewer from 'react-native-file-viewer';
import SimpleHeader from '../../../../components/SimpleHeader';

const PolicyViewer = ({route, navigation}) => {
  const {url} = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileExtension, setFileExtension] = useState('');
  const [localPath, setLocalPath] = useState(null);

  useEffect(() => {
    if (!url) {
      setError('Invalid policy URL');
      setLoading(false);
      return;
    }

    const ext = url.split('.').pop().toLowerCase();
    setFileExtension(ext);

    // If it's a docx/xlsx, download and open with FileViewer
    if (['docx', 'xlsx', 'doc', 'xls'].includes(ext)) {
      downloadAndOpenFile(url, ext);
    } else {
      setLoading(false);
    }
  }, [url]);

  const downloadAndOpenFile = async (fileUrl, ext) => {
    try {
      setLoading(true);
      setError(null);

      const cacheDir =
        Platform.OS === 'android'
          ? RNFetchBlob.fs.dirs.CacheDir
          : RNFetchBlob.fs.dirs.DocumentDir;

      const fileName = `policy_${Date.now()}.${ext}`;
      const cachePath = `${cacheDir}/${fileName}`;

      const downloadResponse = await RNFetchBlob.config({
        fileCache: true,
        path: cachePath,
      }).fetch('GET', fileUrl);

      const downloadPath = downloadResponse.path();
      const pathForViewer =
        Platform.OS === 'android' ? `file://${downloadPath}` : downloadPath;

      setLocalPath(pathForViewer);
      setLoading(false);

      FileViewer.open(downloadPath, {
        showOpenWithDialog: true,
        showAppsSuggestions: true,
      }).catch(err => {
        console.log('FileViewer open error:', err);
        setError('Cannot open file. Install supporting app.');
      });
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download document.');
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1a1c22" />
          <Text style={styles.loadingText}>Loading document...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
    const isPdf = fileExtension === 'pdf';

    if (isPdf) {
      return (
        <Pdf
          source={{uri: url, cache: true}}
          style={styles.pdf}
          trustAllCerts={false}
          onLoadComplete={numberOfPages => {
            console.log(`PDF loaded: ${numberOfPages} pages`);
          }}
          onError={err => {
            console.log('PDF loading error:', err);
            setError('Failed to display PDF.');
          }}
        />
      );
    }

    if (isImage) {
      return (
        <Image
          source={{uri: url}}
          style={styles.image}
          resizeMode="contain"
          onError={() => setError('Failed to display image.')}
        />
      );
    }

    // Document downloaded and opened externally
    if (['docx', 'xlsx', 'doc', 'xls'].includes(fileExtension) && localPath) {
      return (
        <View style={styles.center}>
          <Text style={styles.infoText}>Document opened in external viewer.</Text>
        </View>
      );
    }

    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Unsupported file format: .{fileExtension}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SimpleHeader title="View Policy" />
      <View style={styles.contentContainer}>{renderContent()}</View>
    </View>
  );
};

export default PolicyViewer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  contentContainer: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pdf: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  image: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  errorText: {
    fontSize: 15,
    color: '#ef4444',
    textAlign: 'center',
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
  },
});
