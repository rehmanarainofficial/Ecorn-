import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  ActivityIndicator,
  Platform,
  Image,
  Text,
  StyleSheet,
} from 'react-native';
import Pdf from 'react-native-pdf';
import RNFetchBlob from 'react-native-blob-util';
import FileViewer from 'react-native-file-viewer';
import SimpleHeader from '../../../../components/SimpleHeader';
import {BASEURL} from '../../../../utils/BaseUrl';

const FileViewerScreen = ({route, navigation}) => {
  const {type, trans_no} = route.params;
  const [localPath, setLocalPath] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const filePathRef = useRef(null);

  useEffect(() => {
    fetchAndCacheFile();

    return () => {
      if (filePathRef.current) {
        RNFetchBlob.fs.unlink(filePathRef.current).catch(() => {});
      }
    };
  }, []);

  const detectFileTypeFromHeaders = async response => {
    const contentType =
      response.headers['Content-Type'] || response.headers['content-type'];

    if (contentType) {
      if (contentType.includes('pdf')) return 'pdf';
      if (contentType.includes('jpeg') || contentType.includes('jpg'))
        return 'jpg';
      if (contentType.includes('png')) return 'png';
      if (contentType.includes('gif')) return 'gif';
      if (
        contentType.includes('msword') ||
        contentType.includes('officedocument.wordprocessingml')
      )
        return 'docx';
      if (
        contentType.includes('excel') ||
        contentType.includes('spreadsheetml')
      )
        return 'xlsx';
    }

    return 'jpg';
  };

  const detectFileTypeFast = async filePath => {
    try {
      const base64Data = await RNFetchBlob.fs.readFile(filePath, 'base64', 20);

      if (base64Data.startsWith('/9j/')) return 'jpg';
      if (base64Data.startsWith('iVBORw')) return 'png';
      if (base64Data.startsWith('JVBERi') || base64Data.includes('%PDF'))
        return 'pdf';
      if (base64Data.startsWith('R0lGOD')) return 'gif';
      if (base64Data.startsWith('UEsDB') || base64Data.startsWith('PK'))
        return 'docx';

      return 'jpg';
    } catch (error) {
      return 'jpg';
    }
  };

  const fetchAndCacheFile = async () => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('type', type);
      formData.append('trans_no', trans_no);

      const startTime = Date.now();
      const response = await fetch(`${BASEURL}dattachment_view.php`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data?.url) {
        throw new Error('No file URL found');
      }
      let detectedType = await detectFileTypeFromHeaders(response);

      const cacheDir =
        Platform.OS === 'android'
          ? RNFetchBlob.fs.dirs.CacheDir
          : RNFetchBlob.fs.dirs.DocumentDir;

      const fileName = `cache_${trans_no}_${Date.now()}`;
      const fileExtension = detectedType === 'pdf' ? 'pdf' : 'img';
      const cachePath = `${cacheDir}/${fileName}.${fileExtension}`;

      const downloadResponse = await RNFetchBlob.config({
        fileCache: true,
        path: cachePath,
      }).fetch('GET', data.url, {
        'Cache-Control': 'max-age=3600',
      });

      const downloadPath = downloadResponse.path();
      filePathRef.current = downloadPath;

      const fileStats = await RNFetchBlob.fs.stat(downloadPath);
      if (fileStats.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      if (detectedType === 'jpg') {
        detectedType = await detectFileTypeFast(downloadPath);
      }

      setFileType(detectedType);
      setLocalPath(
        Platform.OS === 'android' ? `file://${downloadPath}` : downloadPath,
      );

      const endTime = Date.now();
      console.log(
        `File loaded in ${
          endTime - startTime
        }ms, Type: ${detectedType}, Size: ${fileStats.size} bytes`,
      );
    } catch (error) {
      console.error('File loading error:', error);
      console.log('Error details:', JSON.stringify(error, null, 2));
      console.log('API URL:', `${BASEURL}dattachment_view.php`);
      console.log('Params - type:', type, 'trans_no:', trans_no);
      setError(`Failed to load file: ${error.message || 'Network Error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle retry
  const handleRetry = () => {
    setError(null);
    fetchAndCacheFile();
  };

  // Render loading state
  if (loading) {
    return (
      <View style={{flex: 1, backgroundColor: '#F3F4F6'}}>
        <SimpleHeader title="View File" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading file...</Text>
        </View>
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View style={{flex: 1, backgroundColor: '#F3F4F6'}}>
        <SimpleHeader title="View File" />
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryButton} onPress={handleRetry}>
            Tap to Retry
          </Text>
        </View>
      </View>
    );
  }

  // Render PDF
  if (fileType === 'pdf') {
    return (
      <View style={{flex: 1, backgroundColor: '#F3F4F6'}}>
        <SimpleHeader title="PDF Viewer" />
        <Pdf
          source={{uri: localPath, cache: true}}
          style={{flex: 1, backgroundColor: '#F3F4F6'}}
          onLoadComplete={(numberOfPages, filePath) => {
            console.log(`PDF loaded: ${numberOfPages} pages`);
          }}
          onError={error => {
            console.log('PDF render error:', error);
            setError('Failed to load PDF');
          }}
          onPageChanged={(page, numberOfPages) => {
            console.log(`Current page: ${page}/${numberOfPages}`);
          }}
          trustAllCerts={false}
        />
      </View>
    );
  }

  // Render Image (JPG, PNG, GIF)
  if (['jpg', 'png', 'gif'].includes(fileType)) {
    return (
      <View style={{flex: 1, backgroundColor: '#000'}}>
        <SimpleHeader title="Image Viewer" />
        <Image
          source={{uri: localPath}}
          style={{flex: 1, resizeMode: 'contain'}}
          progressiveRenderingEnabled={true}
          fadeDuration={300}
          onLoad={() => console.log('Image loaded successfully')}
          onError={() => setError('Failed to load image')}
        />
      </View>
    );
  }

  // Handle Office documents
  if (['docx', 'xlsx'].includes(fileType)) {
    useEffect(() => {
      if (localPath && fileType) {
        FileViewer.open(localPath, {
          showOpenWithDialog: true,
          showAppsSuggestions: true,
          onDismiss: () => {
            console.log('File viewer dismissed');
          },
        }).catch(error => {
          console.log('File viewer error:', error);
          setError('Cannot open file. Install supporting app.');
        });
      }
    }, [localPath, fileType]);

    return (
      <View style={{flex: 1, backgroundColor: '#F3F4F6'}}>
        <SimpleHeader title="Document Viewer" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Opening document...</Text>
        </View>
      </View>
    );
  }

  // Default/unsupported format
  return (
    <View style={{flex: 1, backgroundColor: '#F3F4F6'}}>
      <SimpleHeader title="File Viewer" />
      <View style={styles.center}>
        <Text style={styles.errorText}>Unsupported file format</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    fontSize: 16,
    color: '#1976d2',
    textDecorationLine: 'underline',
    marginTop: 10,
  },
});

export default FileViewerScreen;
