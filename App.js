import React from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import FlightScreen from './src/screens/FlightScreen';

export default function App() {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <FlightScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
});
