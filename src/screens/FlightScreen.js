import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';

import Joystick from '../components/Joystick';
import HUD from '../components/HUD';
import {
  moveCoordinate,
  normalizeHeading,
  calculateBearing,
  calculateDistance,
  turnTowardHeading,
  lerpAltitude,
  altitudeToZoom,
  clampToJapan,
} from '../utils/flightUtils';
import { LANDMARKS, JAPAN_BOUNDS } from '../constants/landmarks';

const TICK_MS = 100;

// Speed tiers: [display km/h at full joystick, meters-per-tick at full joystick]
const SPEED_TIERS = [
  { label: 'LOW', kmh: 300, mpt: 8.3 },
  { label: 'MED', kmh: 900, mpt: 25 },
  { label: 'HIGH', kmh: 2700, mpt: 75 },
  { label: 'MAX', kmh: 8100, mpt: 225 },
];

// Auto-tour: speed used for transit
const AUTO_TOUR_MPT = 150;
const AUTO_TOUR_TURN_RATE = 4; // degrees per tick
const AUTO_TOUR_ALT_RATE = 80; // meters per tick
const ARRIVAL_DISTANCE = 8000; // meters — switch to orbit when within this range
const ORBIT_TICKS = 60; // ~6 seconds of orbiting

const INITIAL = {
  latitude: 35.6762,
  longitude: 139.6503,
  altitude: 3000,
  heading: 30,
  pitch: 58,
};

export default function FlightScreen() {
  const mapRef = useRef(null);

  // Flight physics state (ref to avoid stale closures)
  const flightRef = useRef({ ...INITIAL });
  const joystickRef = useRef({ x: 0, y: 0 });

  // Auto-tour state (all refs to avoid stale closures in interval)
  const autoTourRef = useRef(false);
  const tourIndexRef = useRef(0);
  const tourPhaseRef = useRef('FLYING'); // 'FLYING' | 'ORBITING'
  const orbitTicksRef = useRef(0);

  // React state (UI display only)
  const [hudData, setHudData] = useState({ speed: 0, altitude: INITIAL.altitude, heading: INITIAL.heading });
  const [speedTierIdx, setSpeedTierIdx] = useState(1);
  const speedTierIdxRef = useRef(1);
  const [isAutoTour, setIsAutoTour] = useState(false);
  const [locationName, setLocationName] = useState('東京');
  const [showLandmarkMenu, setShowLandmarkMenu] = useState(false);

  const updateCamera = useCallback(() => {
    if (!mapRef.current) return;
    const f = flightRef.current;
    mapRef.current.animateCamera(
      {
        center: { latitude: f.latitude, longitude: f.longitude },
        pitch: f.pitch,
        heading: f.heading,
        altitude: f.altitude,
        zoom: altitudeToZoom(f.altitude),
      },
      { duration: TICK_MS * 0.95 }
    );
  }, []);

  const announceLandmark = useCallback((name) => {
    setLocationName(name);
  }, []);

  const flightTick = useCallback(() => {
    const f = flightRef.current;
    const j = joystickRef.current;
    const isAuto = autoTourRef.current;

    if (isAuto) {
      const target = LANDMARKS[tourIndexRef.current];
      const dist = calculateDistance(f.latitude, f.longitude, target.latitude, target.longitude);

      if (tourPhaseRef.current === 'FLYING') {
        const bearing = calculateBearing(f.latitude, f.longitude, target.latitude, target.longitude);
        const newHeading = turnTowardHeading(f.heading, bearing, AUTO_TOUR_TURN_RATE);
        const newAlt = lerpAltitude(f.altitude, target.altitude, AUTO_TOUR_ALT_RATE);
        const newPos = moveCoordinate(f.latitude, f.longitude, newHeading, AUTO_TOUR_MPT);
        const clamped = clampToJapan(newPos.latitude, newPos.longitude, JAPAN_BOUNDS);

        flightRef.current = {
          ...f,
          latitude: clamped.latitude,
          longitude: clamped.longitude,
          heading: newHeading,
          altitude: newAlt,
        };

        const speedKmh = AUTO_TOUR_MPT * 10 * 3.6;
        setHudData({ speed: Math.round(speedKmh), altitude: Math.round(newAlt), heading: Math.round(newHeading) });

        if (dist < ARRIVAL_DISTANCE) {
          tourPhaseRef.current = 'ORBITING';
          orbitTicksRef.current = 0;
          announceLandmark(target.name);
        }
      } else {
        // ORBITING: spin in place, gradually lower for a dramatic reveal
        const orbitHeading = normalizeHeading(f.heading + 3);
        const orbitAlt = Math.max(target.altitude * 0.6, f.altitude - 15);
        flightRef.current = { ...f, heading: orbitHeading, altitude: orbitAlt };

        setHudData({ speed: 0, altitude: Math.round(orbitAlt), heading: Math.round(orbitHeading) });
        orbitTicksRef.current += 1;

        if (orbitTicksRef.current >= ORBIT_TICKS) {
          // Move to next landmark
          tourIndexRef.current = (tourIndexRef.current + 1) % LANDMARKS.length;
          tourPhaseRef.current = 'FLYING';
          // Restore altitude to a good flying height
          flightRef.current = { ...flightRef.current, altitude: Math.max(flightRef.current.altitude, 3000) };
        }
      }
    } else {
      // Manual flight
      const forwardFactor = -j.y; // joystick up (-y) = forward
      const turnFactor = j.x;

      if (Math.abs(turnFactor) > 0.04 || Math.abs(forwardFactor) > 0.04) {
        const tier = SPEED_TIERS[speedTierIdxRef.current];
        const newHeading = normalizeHeading(f.heading + turnFactor * 4);
        const dist = forwardFactor * tier.mpt;
        const newPos = moveCoordinate(f.latitude, f.longitude, newHeading, dist);
        const clamped = clampToJapan(newPos.latitude, newPos.longitude, JAPAN_BOUNDS);

        flightRef.current = { ...f, latitude: clamped.latitude, longitude: clamped.longitude, heading: newHeading };

        const speedKmh = Math.abs(forwardFactor) * tier.kmh;
        setHudData({ speed: Math.round(speedKmh), altitude: Math.round(f.altitude), heading: Math.round(newHeading) });
      } else {
        setHudData((prev) => ({ ...prev, speed: 0, heading: Math.round(f.heading) }));
      }
    }

    updateCamera();
  }, [updateCamera, announceLandmark]);

  useEffect(() => {
    const id = setInterval(flightTick, TICK_MS);
    return () => clearInterval(id);
  }, [flightTick]);

  const handleJoystickMove = useCallback(({ x, y }) => {
    joystickRef.current = { x, y };
  }, []);

  const adjustAltitude = (delta) => {
    const newAlt = Math.max(150, Math.min(60000, flightRef.current.altitude + delta));
    flightRef.current = { ...flightRef.current, altitude: newAlt };
    setHudData((prev) => ({ ...prev, altitude: Math.round(newAlt) }));
    updateCamera();
  };

  const cycleSpeed = () => {
    setSpeedTierIdx((prev) => {
      const next = (prev + 1) % SPEED_TIERS.length;
      speedTierIdxRef.current = next;
      return next;
    });
  };

  const toggleAutoTour = () => {
    const next = !autoTourRef.current;
    autoTourRef.current = next;
    setIsAutoTour(next);
    if (next) {
      tourPhaseRef.current = 'FLYING';
      tourIndexRef.current = 0;
      announceLandmark(LANDMARKS[0].name);
    }
  };

  const flyToLandmark = (landmark) => {
    autoTourRef.current = false;
    setIsAutoTour(false);
    setShowLandmarkMenu(false);
    flightRef.current = {
      ...flightRef.current,
      latitude: landmark.latitude,
      longitude: landmark.longitude,
      altitude: landmark.altitude,
      heading: landmark.heading,
    };
    announceLandmark(landmark.name);
    updateCamera();
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        mapType="hybrid"
        initialCamera={{
          center: { latitude: INITIAL.latitude, longitude: INITIAL.longitude },
          pitch: INITIAL.pitch,
          heading: INITIAL.heading,
          altitude: INITIAL.altitude,
          zoom: altitudeToZoom(INITIAL.altitude),
        }}
        rotateEnabled={false}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
      />

      <HUD
        speed={hudData.speed}
        altitude={hudData.altitude}
        heading={hudData.heading}
        locationName={locationName}
        isAutoTour={isAutoTour}
      />

      {/* Bottom controls overlay */}
      <View style={styles.overlay} pointerEvents="box-none">
        {/* Joystick — bottom left */}
        <View style={styles.joystickWrap}>
          <Text style={styles.controlHint}>操縦桿</Text>
          <Joystick onMove={handleJoystickMove} disabled={isAutoTour} />
        </View>

        {/* Altitude control — bottom right */}
        <View style={styles.altWrap}>
          <TouchableOpacity style={styles.altBtn} onPress={() => adjustAltitude(800)}>
            <Text style={styles.altBtnIcon}>▲</Text>
            <Text style={styles.altBtnLabel}>上昇</Text>
          </TouchableOpacity>
          <View style={styles.altReadout}>
            <Text style={styles.altReadoutText}>{Math.round(hudData.altitude).toLocaleString()}</Text>
            <Text style={styles.altReadoutUnit}>m</Text>
          </View>
          <TouchableOpacity style={styles.altBtn} onPress={() => adjustAltitude(-800)}>
            <Text style={styles.altBtnIcon}>▼</Text>
            <Text style={styles.altBtnLabel}>降下</Text>
          </TouchableOpacity>
        </View>

        {/* Center bottom buttons */}
        <View style={styles.centerBtns}>
          {/* Speed */}
          <TouchableOpacity style={styles.pill} onPress={cycleSpeed}>
            <Text style={styles.pillLabel}>スピード</Text>
            <Text style={styles.pillValue}>{SPEED_TIERS[speedTierIdx].label}</Text>
          </TouchableOpacity>

          {/* Auto-tour */}
          <TouchableOpacity
            style={[styles.pill, styles.tourPill, isAutoTour && styles.tourPillActive]}
            onPress={toggleAutoTour}
          >
            <Text style={[styles.pillLabel, { color: '#FFD54F' }]}>自動ツアー</Text>
            <Text style={[styles.pillValue, { color: '#FFD54F' }]}>
              {isAutoTour ? '停止' : '開始'}
            </Text>
          </TouchableOpacity>

          {/* Landmark jump */}
          <TouchableOpacity style={styles.pill} onPress={() => setShowLandmarkMenu(true)}>
            <Text style={styles.pillLabel}>名所</Text>
            <Text style={styles.pillValue}>一覧 ›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Landmark selection modal */}
      <Modal
        visible={showLandmarkMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLandmarkMenu(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowLandmarkMenu(false)} />
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>✈ 名所一覧</Text>
          <Text style={styles.modalSubtitle}>タップしてその場所へ飛びます</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {LANDMARKS.map((lm) => (
              <TouchableOpacity
                key={lm.id}
                style={styles.landmarkRow}
                onPress={() => flyToLandmark(lm)}
              >
                <View>
                  <Text style={styles.landmarkName}>{lm.name}</Text>
                  <Text style={styles.landmarkMeta}>{lm.nameEn} · 高度 {lm.altitude.toLocaleString()}m</Text>
                </View>
                <Text style={styles.landmarkArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.modalClose} onPress={() => setShowLandmarkMenu(false)}>
            <Text style={styles.modalCloseText}>閉じる</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  map: { flex: 1 },

  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
  },

  /* Joystick */
  joystickWrap: {
    position: 'absolute',
    bottom: 36,
    left: 20,
    alignItems: 'center',
  },
  controlHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 4,
  },

  /* Altitude */
  altWrap: {
    position: 'absolute',
    bottom: 36,
    right: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0,10,25,0.65)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(79,195,247,0.3)',
    padding: 8,
  },
  altBtn: {
    width: 52,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(79,195,247,0.18)',
    borderRadius: 8,
    marginVertical: 2,
  },
  altBtnIcon: { color: '#4FC3F7', fontSize: 14, fontWeight: '700' },
  altBtnLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 9 },
  altReadout: { alignItems: 'center', paddingVertical: 4 },
  altReadoutText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  altReadoutUnit: { color: '#78909C', fontSize: 10 },

  /* Center pills */
  centerBtns: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 175,
  },
  pill: {
    backgroundColor: 'rgba(0,10,25,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(79,195,247,0.4)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 68,
  },
  pillLabel: { color: '#78909C', fontSize: 9, letterSpacing: 1 },
  pillValue: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginTop: 1 },
  tourPill: { borderColor: 'rgba(255,213,79,0.4)' },
  tourPillActive: { backgroundColor: 'rgba(255,213,79,0.15)', borderColor: '#FFD54F' },

  /* Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    backgroundColor: '#0A1628',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '75%',
    borderTopWidth: 1,
    borderColor: 'rgba(79,195,247,0.3)',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
    color: '#78909C',
    fontSize: 12,
    marginBottom: 16,
  },
  landmarkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  landmarkName: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  landmarkMeta: { color: '#78909C', fontSize: 11, marginTop: 2 },
  landmarkArrow: { color: '#4FC3F7', fontSize: 22 },
  modalClose: {
    marginTop: 20,
    backgroundColor: 'rgba(79,195,247,0.15)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(79,195,247,0.4)',
  },
  modalCloseText: { color: '#4FC3F7', fontSize: 15, fontWeight: '600' },
});
