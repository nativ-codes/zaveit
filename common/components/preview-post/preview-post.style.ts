import { Colors } from '@/common/constants/colors';
import { Units } from '@/common/constants/units';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    borderRadius: Units.s16,
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: Units.s16,
  },
  image: {
    width: Units.s128,
    height: '100%',
  },
  content: {
    flex: 1,
    gap: Units.s4,
    padding: Units.s8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  url: {
    fontSize: 11,
    color: Colors.primary,
    marginBottom: Units.s4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Units.s4,
  },
  tag: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Units.s8,
    paddingHorizontal: Units.s8,
    paddingVertical: Units.s4
  },
  tagText: {
    fontSize: 11,
    color: Colors.text.secondary,
  }
}); 