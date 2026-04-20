import React, { useRef, useState } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';

const SIZE = 130;
const KNOB = 52;
const MAX_DIST = (SIZE - KNOB) / 2;

export default function Joystick({ onMove, disabled }) {
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderMove: (_, g) => {
        const dist = Math.hypot(g.dx, g.dy);
        const scale = dist > MAX_DIST ? MAX_DIST / dist : 1;
        const cx = g.dx * scale;
        const cy = g.dy * scale;
        setKnob({ x: cx, y: cy });
        onMove?.({ x: cx / MAX_DIST, y: cy / MAX_DIST });
      },
      onPanResponderRelease: () => {
        setKnob({ x: 0, y: 0 });
        onMove?.({ x: 0, y: 0 });
      },
      onPanResponderTerminate: () => {
        setKnob({ x: 0, y: 0 });
        onMove?.({ x: 0, y: 0 });
      },
    })
  ).current;

  return (
    <View
      style={[styles.container, disabled && styles.disabled]}
      {...panResponder.panHandlers}
    >
      <View style={styles.ring} />
      <View style={styles.crossH} />
      <View style={styles.crossV} />
      <View
        style={[
          styles.knob,
          { transform: [{ translateX: knob.x }, { translateY: knob.y }] },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 2,
    borderColor: 'rgba(79, 195, 247, 0.5)',
    backgroundColor: 'rgba(0, 20, 40, 0.55)',
  },
  crossH: {
    position: 'absolute',
    width: SIZE - 20,
    height: 1,
    backgroundColor: 'rgba(79, 195, 247, 0.25)',
  },
  crossV: {
    position: 'absolute',
    width: 1,
    height: SIZE - 20,
    backgroundColor: 'rgba(79, 195, 247, 0.25)',
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: 'rgba(79, 195, 247, 0.85)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#4FC3F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  disabled: {
    opacity: 0.3,
  },
});
