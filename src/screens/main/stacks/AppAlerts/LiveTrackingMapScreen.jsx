import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import {WebView} from 'react-native-webview';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import SimpleHeader from '../../../../components/SimpleHeader';
import {APPCOLORS} from '../../../../utils/APPCOLORS';
import {BASEURL} from '../../../../utils/BaseUrl';

const LIVE_TRACKING_URL = `${BASEURL}get_live_tracking.php`;

const getEmpKey = emp => {
  if (!emp) return '';
  return String(emp.id || emp.EmployeeCode || emp.name || '');
};

const LiveTrackingMapScreen = ({route, navigation}) => {
  const {employee: initialEmployee, employees: initialEmployeesList} = route.params || {};

  const webViewRef = useRef(null);

  // View Mode state: 'single' if opened for a specific employee, else 'all'
  const [viewMode, setViewMode] = useState(initialEmployee ? 'single' : 'all');

  // Map Type state: 'hybrid' (Satellite + Streets), 'street' (Vector), 'satellite' (Pure Satellite)
  const [mapType, setMapType] = useState('hybrid');

  const [employeesList, setEmployeesList] = useState(
    Array.isArray(initialEmployeesList) && initialEmployeesList.length > 0
      ? initialEmployeesList
      : initialEmployee
      ? [initialEmployee]
      : [],
  );

  const [selectedEmp, setSelectedEmp] = useState(
    initialEmployee || (employeesList.length > 0 ? employeesList[0] : null),
  );

  const selectedEmpKeyRef = useRef(getEmpKey(selectedEmp));

  useEffect(() => {
    selectedEmpKeyRef.current = getEmpKey(selectedEmp);
  }, [selectedEmp]);

  const [initialLoading, setInitialLoading] = useState(true);

  const validEmployees = employeesList.filter(
    emp => emp.latitude && emp.longitude && !isNaN(parseFloat(emp.latitude)),
  );

  // Active employees to show based on viewMode
  const displayedEmployees =
    viewMode === 'single' && selectedEmp
      ? [selectedEmp].filter(e => e.latitude && e.longitude)
      : validEmployees;

  const defaultLat =
    displayedEmployees.length > 0
      ? parseFloat(displayedEmployees[0].latitude)
      : 31.5204;
  const defaultLon =
    displayedEmployees.length > 0
      ? parseFloat(displayedEmployees[0].longitude)
      : 74.3587;

  const getMapHtml = () => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
      
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
      
      <style>
        body, html, #map {
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100%;
          background-color: #0f172a;
        }
        .pin-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 46px;
          height: 46px;
          position: relative;
        }
        .pin-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background-color: ${APPCOLORS.Primary || '#1a1c22'};
          border: 2px solid #ffffff;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
          display: flex;
          justify-content: center;
          align-items: center;
          color: #ffffff;
          font-family: sans-serif;
          font-size: 11px;
          font-weight: bold;
          z-index: 2;
          transition: all 0.3s ease;
        }
        .pin-avatar.selected {
          background-color: #10B981;
          border-color: #ffffff;
          transform: scale(1.18);
          box-shadow: 0 0 16px rgba(16, 185, 129, 0.9);
        }
        .pin-pulse {
          position: absolute;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background-color: rgba(16, 185, 129, 0.45);
          animation: pulse 1.8s infinite ease-out;
          z-index: 1;
        }
        @keyframes pulse {
          0% { transform: scale(0.3); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .marker-cluster-small {
          background-color: rgba(26, 28, 34, 0.7);
        }
        .marker-cluster-small div {
          background-color: ${APPCOLORS.Primary || '#1a1c22'};
          color: #ffffff;
          font-weight: bold;
        }
        .marker-cluster-medium {
          background-color: rgba(16, 185, 129, 0.7);
        }
        .marker-cluster-medium div {
          background-color: #10B981;
          color: #ffffff;
          font-weight: bold;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 4px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.25);
        }
        .popup-title {
          font-size: 13px;
          font-weight: bold;
          color: #0f172a;
          margin-bottom: 2px;
        }
        .popup-subtitle {
          font-size: 11px;
          color: #64748b;
        }
        .popup-loc {
          font-size: 11px;
          color: #334155;
          margin-top: 4px;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([${defaultLat}, ${defaultLon}], ${viewMode === 'single' ? 16 : 14});
        
        // Define Tile Layers (Street, Satellite, Hybrid)
        var streetLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '© OpenStreetMap, © CARTO',
          maxZoom: 20
        });

        var satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles © Esri',
          maxZoom: 19
        });

        // Google Hybrid Satellite (High-Res Satellite + Street Names & Road overlay)
        var hybridLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
          attribution: '© Google Maps',
          maxZoom: 20
        });

        var currentLayer = ${
          mapType === 'street'
            ? 'streetLayer'
            : mapType === 'satellite'
            ? 'satelliteLayer'
            : 'hybridLayer'
        };
        currentLayer.addTo(map);

        function switchTileLayer(type) {
          map.removeLayer(currentLayer);
          if (type === 'street') {
            currentLayer = streetLayer;
          } else if (type === 'satellite') {
            currentLayer = satelliteLayer;
          } else {
            currentLayer = hybridLayer;
          }
          currentLayer.addTo(map);
        }

        var markersMap = {};
        var routeHistory = {};
        var polylinesMap = {};
        
        // Spiderfy Marker Cluster Group so overlapping pins fan out automatically
        var clusterGroup = L.markerClusterGroup({
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          maxClusterRadius: 35,
          spiderfyDistanceMultiplier: 1.5,
          zoomToBoundsOnClick: true
        }).addTo(map);

        function createCustomIcon(initials, isSelected) {
          var avatarClass = isSelected ? 'pin-avatar selected' : 'pin-avatar';
          return L.divIcon({
            className: 'custom-emp-icon',
            html: '<div class="pin-container"><div class="pin-pulse"></div><div class="' + avatarClass + '">' + initials + '</div></div>',
            iconSize: [46, 46],
            iconAnchor: [23, 23]
          });
        }

        function getInitials(name) {
          if (!name) return 'EMP';
          return name.split(' ').slice(0, 2).map(function(n){ return n[0]; }).join('').toUpperCase();
        }

        function updateOrAddMarkers(employeesData, fitBoundsOnLoad) {
          if (!Array.isArray(employeesData) || employeesData.length === 0) return;

          var hasValidCoords = false;
          var activeKey = "${getEmpKey(selectedEmp)}";

          employeesData.forEach(function(emp) {
            if (!emp.latitude || !emp.longitude || isNaN(parseFloat(emp.latitude))) return;

            var empKey = String(emp.id || emp.EmployeeCode || emp.name || '');
            if (!empKey) return;

            var lat = parseFloat(emp.latitude);
            var lon = parseFloat(emp.longitude);
            var initials = getInitials(emp.name);
            var isSelected = (empKey === activeKey);

            hasValidCoords = true;

            if (!routeHistory[empKey]) {
              routeHistory[empKey] = [];
            }
            var lastPos = routeHistory[empKey][routeHistory[empKey].length - 1];
            if (!lastPos || lastPos[0] !== lat || lastPos[1] !== lon) {
              routeHistory[empKey].push([lat, lon]);
            }

            if (routeHistory[empKey].length > 1) {
              if (polylinesMap[empKey]) {
                polylinesMap[empKey].setLatLngs(routeHistory[empKey]);
              } else {
                polylinesMap[empKey] = L.polyline(routeHistory[empKey], {
                  color: isSelected ? '#10B981' : '#F59E0B',
                  weight: 4,
                  opacity: 0.85,
                  dashArray: '6, 8'
                }).addTo(map);
              }
            }

            var popupHtml = '<div style="font-family: sans-serif; padding: 2px;">' +
              '<div class="popup-title">' + (emp.name || 'Employee') + '</div>' +
              '<div class="popup-subtitle">Code: ' + (emp.EmployeeCode || 'N/A') + ' | Time: ' + (emp.ActivityTime || 'N/A') + '</div>' +
              '<div class="popup-loc">📍 ' + (emp.current_location || 'No location address') + '</div>' +
              '</div>';

            if (markersMap[empKey]) {
              // Update marker position and icon in-place without clearing layers
              markersMap[empKey].setLatLng([lat, lon]);
              markersMap[empKey].setPopupContent(popupHtml);
              markersMap[empKey].empName = emp.name;
              var icon = createCustomIcon(initials, isSelected);
              markersMap[empKey].setIcon(icon);
              markersMap[empKey].setZIndexOffset(isSelected ? 1000 : 0);
            } else {
              var icon = createCustomIcon(initials, isSelected);
              var marker = L.marker([lat, lon], { icon: icon, zIndexOffset: isSelected ? 1000 : 0 }).bindPopup(popupHtml);
              marker.empName = emp.name;
              
              (function(key) {
                marker.on('click', function(e) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'SELECT_EMP',
                    employeeKey: key
                  }));
                });
              })(empKey);

              markersMap[empKey] = marker;
              clusterGroup.addLayer(marker);
            }
          });

          if (fitBoundsOnLoad && hasValidCoords) {
            try {
              if (employeesData.length === 1) {
                var singleLat = parseFloat(employeesData[0].latitude);
                var singleLon = parseFloat(employeesData[0].longitude);
                map.setView([singleLat, singleLon], 16, { animate: true });
                if (markersMap[activeKey]) {
                  markersMap[activeKey].openPopup();
                }
              } else if (clusterGroup.getLayers().length > 0) {
                map.fitBounds(clusterGroup.getBounds().pad(0.2));
              }
            } catch(e) {
              console.log('Error fitting bounds:', e);
            }
          }
        }

        var initialData = ${JSON.stringify(displayedEmployees)};
        updateOrAddMarkers(initialData, true);

        window.addEventListener('message', function(event) {
          try {
            var message = JSON.parse(event.data);
            if (message.type === 'CHANGE_MAP_TYPE') {
              switchTileLayer(message.mapType);
            } else if (message.type === 'UPDATE_ALL_COORDS') {
              updateOrAddMarkers(message.employees, false);
            } else if (message.type === 'FIT_ALL') {
              if (clusterGroup.getLayers().length > 0) {
                map.fitBounds(clusterGroup.getBounds().pad(0.2), { animate: true });
              }
            } else if (message.type === 'FOCUS_EMP') {
              var empKey = message.employeeKey;
              
              // Highlight active pin & update z-index
              Object.keys(markersMap).forEach(function(k) {
                var isAct = (k === empKey);
                if (markersMap[k]) {
                  var inits = getInitials(markersMap[k].empName || '');
                  markersMap[k].setIcon(createCustomIcon(inits, isAct));
                  markersMap[k].setZIndexOffset(isAct ? 1000 : 0);
                }
              });

              if (markersMap[empKey]) {
                // Open popup without zoom-out
                markersMap[empKey].openPopup();
              }
            }
          } catch (e) {
            console.error('Error handling WebView message:', e);
          }
        });
      </script>
    </body>
    </html>
  `;

  const viewModeRef = useRef(viewMode);
  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

  const fetchAllTrackingData = useCallback(async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const formData = new FormData();
      formData.append('emp_code', '');
      formData.append('date', todayStr);

      const response = await axios.post(LIVE_TRACKING_URL, formData, {
        headers: {'Content-Type': 'multipart/form-data'},
      });

      const res = response.data;

      let fetchedList = [];
      if (Array.isArray(res)) {
        fetchedList = res;
      } else if (res && Array.isArray(res.data)) {
        fetchedList = res.data;
      } else if (res && Array.isArray(res.tracking_data)) {
        fetchedList = res.tracking_data;
      } else if (res && typeof res === 'object') {
        const possibleArray = Object.values(res).find(val => Array.isArray(val));
        if (possibleArray) fetchedList = possibleArray;
      }

      if (fetchedList.length > 0) {
        setEmployeesList(fetchedList);

        const currentKey = selectedEmpKeyRef.current;
        let activeEmp = null;
        if (currentKey) {
          activeEmp = fetchedList.find(e => getEmpKey(e) === currentKey);
        }
        if (!activeEmp) {
          activeEmp = fetchedList[0];
        }
        setSelectedEmp(activeEmp);

        if (webViewRef.current) {
          const currentViewMode = viewModeRef.current;
          const activeList =
            currentViewMode === 'single' && activeEmp
              ? [activeEmp].filter(e => e.latitude && e.longitude)
              : fetchedList;

          webViewRef.current.postMessage(
            JSON.stringify({
              type: 'UPDATE_ALL_COORDS',
              employees: activeList,
            }),
          );
        }
      }
    } catch (error) {
      console.log('Error fetching tracking data:', error);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAllTrackingData();
      const interval = setInterval(fetchAllTrackingData, 10000);
      return () => clearInterval(interval);
    }, [fetchAllTrackingData]),
  );

  const handleWebViewMessage = event => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SELECT_EMP' && data.employeeKey) {
        const found = employeesList.find(
          e => getEmpKey(e) === String(data.employeeKey),
        );
        if (found) {
          setSelectedEmp(found);
          // Highlight pin without zooming out
          if (webViewRef.current) {
            webViewRef.current.postMessage(
              JSON.stringify({
                type: 'FOCUS_EMP',
                employeeKey: String(data.employeeKey),
              }),
            );
          }
        }
      }
    } catch (e) {
      console.log('Error handling message from WebView:', e);
    }
  };

  const handleSwitchMapType = type => {
    setMapType(type);
    if (webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'CHANGE_MAP_TYPE',
          mapType: type,
        }),
      );
    }
  };

  const handleToggleViewMode = () => {
    if (viewMode === 'single') {
      setViewMode('all');
      if (webViewRef.current) {
        webViewRef.current.postMessage(
          JSON.stringify({
            type: 'UPDATE_ALL_COORDS',
            employees: validEmployees,
          }),
        );
        setTimeout(() => {
          webViewRef.current?.postMessage(JSON.stringify({type: 'FIT_ALL'}));
        }, 300);
      }
    } else {
      setViewMode('single');
      if (selectedEmp && webViewRef.current) {
        webViewRef.current.postMessage(
          JSON.stringify({
            type: 'UPDATE_ALL_COORDS',
            employees: [selectedEmp],
          }),
        );
        setTimeout(() => {
          webViewRef.current?.postMessage(
            JSON.stringify({
              type: 'FOCUS_EMP',
              employeeKey: getEmpKey(selectedEmp),
            }),
          );
        }, 300);
      }
    }
  };

  const handleFocusEmployee = emp => {
    setSelectedEmp(emp);
    const empKey = getEmpKey(emp);

    if (viewMode === 'single') {
      if (webViewRef.current) {
        webViewRef.current.postMessage(
          JSON.stringify({
            type: 'UPDATE_ALL_COORDS',
            employees: [emp],
          }),
        );
      }
    }

    if (webViewRef.current && empKey) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'FOCUS_EMP',
          employeeKey: empKey,
        }),
      );
    }
  };

  const getInitials = name => {
    if (!name) return 'EMP';
    return name
      .split(' ')
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const selectedKey = getEmpKey(selectedEmp);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SimpleHeader title={viewMode === 'single' ? `Tracking: ${selectedEmp?.name || 'Employee'}` : 'Live Employee Map'} />

      {/* Map Viewport */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          source={{html: getMapHtml()}}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={handleWebViewMessage}
          onLoadEnd={() => setInitialLoading(false)}
        />

        {initialLoading && (
          <View style={styles.mapLoader}>
            <ActivityIndicator size="large" color={APPCOLORS.Primary} />
            <Text style={styles.loaderText}>Loading employee map pins...</Text>
          </View>
        )}

        {/* Map Type Switcher Floating Overlay (Left Side) */}
        <View style={styles.mapTypeControls}>
          <TouchableOpacity
            style={[
              styles.typeBtn,
              mapType === 'hybrid' && styles.typeBtnActive,
            ]}
            onPress={() => handleSwitchMapType('hybrid')}
            activeOpacity={0.8}>
            <Icon
              name="earth"
              size={14}
              color={mapType === 'hybrid' ? '#FFFFFF' : '#374151'}
            />
            <Text
              style={[
                styles.typeBtnText,
                mapType === 'hybrid' && {color: '#FFFFFF'},
              ]}>
              Hybrid
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeBtn,
              mapType === 'street' && styles.typeBtnActive,
              {marginLeft: 6},
            ]}
            onPress={() => handleSwitchMapType('street')}
            activeOpacity={0.8}>
            <Icon
              name="map-outline"
              size={14}
              color={mapType === 'street' ? '#FFFFFF' : '#374151'}
            />
            <Text
              style={[
                styles.typeBtnText,
                mapType === 'street' && {color: '#FFFFFF'},
              ]}>
              Street
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeBtn,
              mapType === 'satellite' && styles.typeBtnActive,
              {marginLeft: 6},
            ]}
            onPress={() => handleSwitchMapType('satellite')}
            activeOpacity={0.8}>
            <Icon
              name="planet-outline"
              size={14}
              color={mapType === 'satellite' ? '#FFFFFF' : '#374151'}
            />
            <Text
              style={[
                styles.typeBtnText,
                mapType === 'satellite' && {color: '#FFFFFF'},
              ]}>
              Satellite
            </Text>
          </TouchableOpacity>
        </View>

        {/* Floating Mode Controls Overlay (Right Side) */}
        <View style={styles.floatingControls}>
          <TouchableOpacity
            style={[
              styles.controlBtn,
              viewMode === 'all' && styles.controlBtnActive,
            ]}
            onPress={handleToggleViewMode}
            activeOpacity={0.8}>
            <Icon
              name={viewMode === 'single' ? 'people-outline' : 'person-outline'}
              size={16}
              color={viewMode === 'all' ? '#FFFFFF' : APPCOLORS.Primary}
            />
            <Text
              style={[
                styles.controlBtnText,
                viewMode === 'all' && {color: '#FFFFFF'},
              ]}>
              {viewMode === 'single'
                ? `Show All (${validEmployees.length})`
                : 'Single Mode'}
            </Text>
          </TouchableOpacity>

          {selectedEmp && (
            <TouchableOpacity
              style={[styles.controlBtn, {marginLeft: 6}]}
              onPress={() => handleFocusEmployee(selectedEmp)}
              activeOpacity={0.8}>
              <Icon name="locate-outline" size={16} color={APPCOLORS.Primary} />
              <Text style={styles.controlBtnText}>Focus</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Horizontal Employee Quick Selector Bar */}
      {validEmployees.length > 0 && (
        <View style={styles.selectorContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectorScroll}>
            {/* Show All Pill */}
            <TouchableOpacity
              style={[
                styles.empPill,
                {
                  backgroundColor: viewMode === 'all' ? APPCOLORS.Primary : '#F3F4F6',
                  borderColor: viewMode === 'all' ? APPCOLORS.Primary : '#D1D5DB',
                },
              ]}
              onPress={() => {
                if (viewMode !== 'all') handleToggleViewMode();
              }}>
              <Text
                style={[
                  styles.empPillText,
                  {color: viewMode === 'all' ? '#FFFFFF' : '#4B5563'},
                ]}>
                🌐 All ({validEmployees.length})
              </Text>
            </TouchableOpacity>

            {validEmployees.map(emp => {
              const empKey = getEmpKey(emp);
              const isSelected = selectedKey === empKey && viewMode === 'single';
              return (
                <TouchableOpacity
                  key={empKey}
                  style={[
                    styles.empPill,
                    {
                      backgroundColor: isSelected
                        ? APPCOLORS.Primary
                        : '#F3F4F6',
                      borderColor: isSelected
                        ? APPCOLORS.Primary
                        : '#D1D5DB',
                    },
                  ]}
                  onPress={() => {
                    if (viewMode !== 'single') {
                      setViewMode('single');
                    }
                    handleFocusEmployee(emp);
                  }}>
                  <Text
                    style={[
                      styles.empPillText,
                      {
                        color: isSelected ? '#FFFFFF' : '#4B5563',
                      },
                    ]}>
                    {emp.name ? emp.name.split(' ')[0] : 'Emp'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* HUD Employee Info Overlay */}
      {selectedEmp && (
        <View style={styles.hudCard}>
          <View style={styles.hudHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(selectedEmp.name)}
              </Text>
            </View>

            <View style={styles.driverMeta}>
              <Text style={styles.driverName} numberOfLines={1}>
                {selectedEmp.name || 'Unknown Employee'}
              </Text>
              {selectedEmp.father_name ? (
                <Text style={styles.driverSO}>
                  S/O: {selectedEmp.father_name}
                </Text>
              ) : null}
              <Text style={styles.driverCode}>
                Employee Code: {selectedEmp.EmployeeCode || 'N/A'}
              </Text>
            </View>

            <View style={styles.timeBadge}>
              <Icon
                name="time-outline"
                size={13}
                color={APPCOLORS.Primary}
                style={{marginRight: 4}}
              />
              <Text style={styles.timeText}>
                {selectedEmp.ActivityTime || 'N/A'}
              </Text>
            </View>
          </View>

          {/* Location Row */}
          <View style={styles.locRow}>
            <Icon
              name="location-outline"
              size={16}
              color={APPCOLORS.Primary}
              style={{marginTop: 2}}
            />
            <Text style={styles.locText} numberOfLines={2}>
              {selectedEmp.current_location || 'GPS location streaming...'}
            </Text>
          </View>

          {/* Coordinate Badges */}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeLabel}>LAT: </Text>
              <Text style={styles.badgeValue}>
                {parseFloat(selectedEmp.latitude || '0').toFixed(6)}
              </Text>
            </View>

            <View style={[styles.badge, {marginLeft: 8}]}>
              <Text style={styles.badgeLabel}>LON: </Text>
              <Text style={styles.badgeValue}>
                {parseFloat(selectedEmp.longitude || '0').toFixed(6)}
              </Text>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APPCOLORS.BG_SCREEN || '#F3F4F6',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  mapLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  mapTypeControls: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  typeBtnActive: {
    backgroundColor: APPCOLORS.Primary,
  },
  typeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    marginLeft: 4,
  },
  floatingControls: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  controlBtnActive: {
    backgroundColor: APPCOLORS.Primary,
  },
  controlBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 4,
  },
  selectorContainer: {
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  selectorScroll: {
    paddingHorizontal: 14,
  },
  empPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  empPillText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  hudCard: {
    margin: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    padding: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  hudHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: APPCOLORS.Primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: APPCOLORS.Primary,
  },
  driverMeta: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  driverSO: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  driverCode: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: APPCOLORS.Primary + '15',
    alignSelf: 'flex-start',
  },
  timeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: APPCOLORS.Primary,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
    marginBottom: 12,
  },
  locText: {
    flex: 1,
    marginLeft: 6,
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  badgeValue: {
    fontSize: 10,
    fontWeight: '700',
    color: '#111827',
  },
});

export default LiveTrackingMapScreen;
