import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { headingToCompass } from '../utils/flightUtils';

export default function HUD({ speed, altitude, heading, locationName, isAutoTour }) {
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const prevLocation = useRef('');

  useEffect(() => {
    if (locationName && locationName !== prevLocation.current) {
      prevLocation.current = locationName;
      Animated.sequence([
        Animated.timing(bannerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.delay(2500),
        Animated.timing(bannerOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();
    }
  }, [locationName]);

  const normalizedHeading = ((heading % 360) + 360) % 360;
  const compass = headingToCompass(normalizedHeading);

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>SPD</Text>
          <Text style={styles.metricValue}>{Math.round(speed)}</Text>
          <Text style={styles.metricUnit}>km/h</Text>
        </View>

        <View style={styles.centerTop}>
          <Text style={styles.appTitle}>✈ JAPAN FLIGHT</Text>
          {isAutoTour && (
            <View style={styles.autoTourBadge}>
              <Text style={styles.autoTourBadgeText}>AUTO TOUR</Text>
            </View>
          )}
        </View>

        <View style={styles.metric}>
          <Text style={styles.metricLabel}>ALT</Text>
          <Text style={styles.metricValue}>{Math.round(altitude)}</Text>
          <Text style={styles.metricUnit}>m</Text>
        </View>
      </View>

      {/* Compass (top right) */}
      <View style={styles.compassWrap}>
        <View style={styles.compassRing}>
          <View
            style={[
              styles.compassNeedle,
              { transform: [{ rotate: `${normalizedHeading}deg` }] },
            ]}
          >
            <View style={styles.needleNorth} />
            <View style={styles.needleSouth} />
          </View>
        </View>
        <Text style={styles.compassDir}>{compass}</Text>
        <Text style={styles.compassDeg}>{Math.round(normalizedHeading)}°</Text>
      </View>

      {/* Location banner */}
      <Animated.View style={[styles.locationBanner, { opacity: bannerOpacity }]}>
        <Text style={styles.locationName}>{locationName}</Text>
      </Animated.View>

      {/* Crosshair center */}
      <View style={styles.crosshair} pointerEvents="none">
        <View style={styles.crossH} />
        <View style={styles.crossV} />
        <View style={styles.crossDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,10,25,0.65)',
  },
  metric: {
    alignItems: 'center',
    minWidth: 72,
  },
  metricLabel: {
    color: '#4FC3F7',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  metricUnit: {
    color: '#78909C',
    fontSize: 10,
  },
  centerTop: {
    flex: 1,
    alignItems: 'center',
  },
  appTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
  },
  autoTourBadge: {
    marginTop: 4,
    backgroundColor: 'rgba(255,213,79,0.25)',
    borderWidth: 1,
    borderColor: '#FFD54F',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  autoTourBadgeText: {
    color: '#FFD54F',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
  },
  compassWrap: {
    position: 'absolute',
    top: 130,
    right: 16,
    alignItems: 'center',
  },
  compassRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: 'rgba(79,195,247,0.6)',
    backgroundColor: 'rgba(0,10,25,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  compassNeedle: {
    width: 4,
    height: 36,
    alignItems: 'center',
  },
  needleNorth: {
    flex: 1,
    width: 4,
    backgroundColor: '#F44336',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  needleSouth: {
    flex: 1,
    width: 4,
    backgroundColor: '#ECEFF1',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  compassDir: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  compassDeg: {
    color: '#78909C',
    fontSize: 10,
  },
  locationBanner: {
    position: 'absolute',
    top: 130,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  locationName: {
    color: '#FFD54F',
    fontSize: 20,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
  },
  crosshair: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crossH: {
    position: 'absolute',
    width: 24,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  crossV: {
    position: 'absolute',
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  crossDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
});
