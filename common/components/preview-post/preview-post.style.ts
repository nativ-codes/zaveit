import { Colors } from '@/common/constants/colors';
import { Units } from '@/common/constants/units';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surface.primary,
    borderRadius: Units.s20,
    alignItems: 'center'
  },
  image: {
    borderTopLeftRadius: Units.s20,
    borderBottomLeftRadius: Units.s20,
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
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: Units.s4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Units.s4,
  },
  tag: {
    backgroundColor: Colors.background.primary,
    borderRadius: Units.s8,
    paddingHorizontal: Units.s8,
    paddingVertical: Units.s4
  },
  tagText: {
    fontSize: 11,
    color: Colors.text.secondary,
  }
}); 