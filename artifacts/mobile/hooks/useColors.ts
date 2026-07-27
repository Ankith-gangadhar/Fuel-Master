import { useColorScheme } from 'react-native';
import colors from '@/constants/colors';

type ColorTokens = typeof colors.dark;

export function useColors(): ColorTokens {
  const scheme = useColorScheme();
  if (scheme === 'light') {
    return colors.light as ColorTokens;
  }
  return colors.dark;
}
