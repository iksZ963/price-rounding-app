import { View, StyleSheet } from 'react-native';
import PriceRoundingCalculator from '../components/price-rounding-calculator';

export default function Index() {
  return (
    <View style={styles.container}>
      <PriceRoundingCalculator />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
});
