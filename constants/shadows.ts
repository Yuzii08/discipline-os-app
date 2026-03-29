import { ViewStyle, StyleSheet } from 'react-native';
import { Colors } from './theme';

// Simulate complex Claymorphism shadows in React Native using borders for highlights 
// and single drop-shadows for the depth, or layered elevation where possible.

export const Shadows = StyleSheet.create({
  clayOuter: {
    backgroundColor: Colors.bg.surface,
    // Soft top-left highlight
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    // Soft drop shadow
    shadowColor: Colors.text.primary || '#3D405B',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  clayInset: {
    backgroundColor: Colors.bg.card2, // Slightly darker surface when pressed
    // Deep inner shadow simulated by dark top-left borders
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopColor: 'rgba(61, 64, 91, 0.1)',
    borderLeftColor: 'rgba(61, 64, 91, 0.1)',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderBottomColor: '#FFFFFF',
    borderRightColor: '#FFFFFF',
    
    // Minimal outer shadow
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  // Soft floating badge style for headers
  consistencyBadge: {
    backgroundColor: Colors.bg.surface,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    shadowColor: Colors.text.primary || '#3D405B',
    shadowOffset: { width: 4, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  }
});
