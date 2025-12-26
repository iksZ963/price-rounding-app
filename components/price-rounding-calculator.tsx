import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Input } from './ui/input';
import { TooltipWrapper } from './ui/tooltip';
import Svg, { Path } from 'react-native-svg';

function roundToNickel(amount: number): { rounded: number; direction: 'up' | 'down' | 'none' } {
  const cents = Math.round(amount * 100);
  const lastDigit = cents % 10;

  let roundedCents: number;
  let direction: 'up' | 'down' | 'none';

  if (lastDigit === 0 || lastDigit === 5) {
    roundedCents = cents;
    direction = 'none';
  } else if (lastDigit === 1 || lastDigit === 2 || lastDigit === 6 || lastDigit === 7) {
    roundedCents = cents - lastDigit + (lastDigit > 5 ? 5 : 0);
    direction = 'down';
  } else {
    roundedCents = cents - lastDigit + (lastDigit > 5 ? 10 : 5);
    direction = 'up';
  }

  return { rounded: roundedCents / 100, direction };
}

function findReachableNickel(
  startNickel: number,
  taxRate: number,
  direction: 'up' | 'down'
): { preTax: number; total: number; skipped: boolean } | null {
  const step = direction === 'up' ? 0.05 : -0.05;
  const maxAttempts = 20;

  for (let i = 0; i < maxAttempts; i++) {
    const targetNickel = startNickel + step * i;

    if (targetNickel <= 0) return null;

    const approxPreTax = targetNickel / (1 + taxRate / 100);

    for (let offset = -100; offset <= 100; offset++) {
      const candidatePreTax = Math.round(approxPreTax * 100 + offset) / 100;
      if (candidatePreTax <= 0) continue;

      const candidateTotal = candidatePreTax * (1 + taxRate / 100);
      const { rounded, direction: roundDirection } = roundToNickel(candidateTotal);

      if (roundDirection === 'none' && Math.abs(rounded - targetNickel) < 0.001) {
        return { preTax: candidatePreTax, total: targetNickel, skipped: i > 0 };
      }
    }
  }

  return null;
}

function calculateSuggestions(preTax: number, taxRate: number) {
  const total = preTax * (1 + taxRate / 100);
  const { rounded, direction } = roundToNickel(total);

  if (direction === 'none') {
    return { seller: null, customer: null };
  }

  let sellerStartNickel: number;
  let customerStartNickel: number;

  if (direction === 'down') {
    customerStartNickel = rounded;
    sellerStartNickel = rounded + 0.05;
  } else {
    sellerStartNickel = rounded;
    customerStartNickel = rounded - 0.05;
  }

  const sellerSuggestion = findReachableNickel(sellerStartNickel, taxRate, 'up');
  const customerSuggestion = findReachableNickel(customerStartNickel, taxRate, 'down');

  return {
    seller: sellerSuggestion,
    customer: customerSuggestion,
  };
}

const StoreIcon = ({ size = 16, color = '#10b981' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 22V12h6v10"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const UsersIcon = ({ size = 16, color = '#3b82f6' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const AlertCircleIcon = ({ size = 16, color = '#f59e0b' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 8v4M12 16h.01"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CheckIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 13l4 4L19 7"
      stroke="#ffffff"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function PriceRoundingCalculator() {
  const [price, setPrice] = useState('');
  const [taxRate, setTaxRate] = useState('');

  const calculations = useMemo(() => {
    const priceNum = Number.parseFloat(price) || 0;
    const taxRateNum = Number.parseFloat(taxRate) || 0;
    const taxAmount = priceNum * (taxRateNum / 100);
    const total = priceNum + taxAmount;
    const { rounded, direction } = roundToNickel(total);
    const difference = rounded - total;

    const suggestions = priceNum > 0 ? calculateSuggestions(priceNum, taxRateNum) : { seller: null, customer: null };

    return {
      subtotal: priceNum,
      taxAmount,
      total,
      rounded,
      direction,
      difference,
      sellerSuggestion: suggestions.seller,
      customerSuggestion: suggestions.customer,
    };
  }, [price, taxRate]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Penny Rounding Calculator</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.label, styles.labelSmall]}>TAX RATE</Text>
          <View style={styles.inputWrapper}>
            <Input
              keyboardType="decimal-pad"
              placeholder="0"
              value={taxRate}
              onChangeText={setTaxRate}
              style={styles.taxInput}
            />
            <Text style={styles.inputSuffix}>%</Text>
          </View>
        </View>

        <View style={styles.preTaxSection}>
          <Text style={[styles.label, styles.labelTiny]}>PRE-TAX AMOUNT</Text>
          <View style={styles.preTaxInputWrapper}>
            <Text style={styles.dollarSign}>$</Text>
            <Input
              keyboardType="decimal-pad"
              placeholder="0.00"
              value={price}
              onChangeText={setPrice}
              style={styles.preTaxInput}
            />
          </View>
        </View>

        <View style={styles.breakdown}>
          <View style={styles.breakdownLeft}>
            <Text style={[styles.breakdownLabel, styles.labelTiny]}>
              TAX ({(Number.parseFloat(taxRate) || 0).toFixed(2)}%)
            </Text>
            <Text style={styles.breakdownValue}>
              +${calculations.taxAmount.toFixed(2)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.breakdownRight}>
            <Text style={[styles.breakdownLabel, styles.labelTiny]}>SUBTOTAL</Text>
            <Text style={styles.breakdownTotal}>
              ${calculations.total.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.dividerSection}>
          <View style={styles.dividerLine} />
          <Text style={[styles.dividerText, styles.labelTiny]}>ROUNDED PRICES</Text>
          <View style={styles.dividerLine} />
        </View>

        {calculations.subtotal > 0 && calculations.direction === 'none' && (
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <CheckIcon />
            </View>
            <Text style={styles.successTitle}>Perfect!</Text>
            <Text style={styles.successSubtitle}>No rounding needed</Text>
          </View>
        )}

        {!(calculations.subtotal > 0 && calculations.direction === 'none') && (
          <View style={styles.cardsContainer}>
            <View style={styles.card}>
              <View style={styles.cardAccentGreen} />
              <View style={styles.cardHeader}>
                <View style={styles.cardIconWrapper}>
                  <View style={[styles.iconBg, styles.iconBgGreen]}>
                    <StoreIcon size={14} color="#10b981" />
                  </View>
                  <Text style={[styles.cardLabel, styles.labelSmall]}>SELLER</Text>
                </View>
                {calculations.sellerSuggestion?.skipped && (
                  <TooltipWrapper
                    content={
                      <Text style={styles.tooltipSimple}>Next reachable nickel</Text>
                    }
                  >
                    <Pressable hitSlop={8}>
                      <AlertCircleIcon size={14} color="#f59e0b" />
                    </Pressable>
                  </TooltipWrapper>
                )}
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardValueSection}>
                  <Text style={[styles.cardSubLabel, styles.labelTiny]}>SET PRE-TAX TO</Text>
                  <View style={styles.cardPriceWrapper}>
                    <Text style={styles.cardDollarGreen}>$</Text>
                    <Text style={styles.cardPrice}>
                      {calculations.sellerSuggestion?.preTax.toFixed(2) ?? '0.00'}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardTotal}>
                  <Text style={[styles.cardSubLabel, styles.labelTiny]}>AFTER-TAX TOTAL</Text>
                  <Text style={styles.cardTotalValueGreen}>
                    ${calculations.sellerSuggestion?.total.toFixed(2) ?? '0.00'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardAccentBlue} />
              <View style={styles.cardHeader}>
                <View style={styles.cardIconWrapper}>
                  <View style={[styles.iconBg, styles.iconBgBlue]}>
                    <UsersIcon size={14} color="#3b82f6" />
                  </View>
                  <Text style={[styles.cardLabel, styles.labelSmall]}>CUSTOMER</Text>
                </View>
                {calculations.customerSuggestion?.skipped && (
                  <TooltipWrapper
                    content={
                      <Text style={styles.tooltipSimple}>Previous reachable nickel</Text>
                    }
                  >
                    <Pressable hitSlop={8}>
                      <AlertCircleIcon size={14} color="#f59e0b" />
                    </Pressable>
                  </TooltipWrapper>
                )}
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardValueSection}>
                  <Text style={[styles.cardSubLabel, styles.labelTiny]}>SET PRE-TAX TO</Text>
                  <View style={styles.cardPriceWrapper}>
                    <Text style={styles.cardDollarBlue}>$</Text>
                    <Text style={styles.cardPrice}>
                      {calculations.customerSuggestion?.preTax.toFixed(2) ?? '0.00'}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardTotal}>
                  <Text style={[styles.cardSubLabel, styles.labelTiny]}>AFTER-TAX TOTAL</Text>
                  <Text style={styles.cardTotalValueBlue}>
                    ${calculations.customerSuggestion?.total.toFixed(2) ?? '0.00'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
    backgroundColor: '#ffffff',
    borderBottomColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: -0.5,
    color: '#18181b',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  section: {
    marginBottom: 6,
  },
  label: {
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 3,
  },
  labelTiny: {
    fontSize: 9,
    color: '#71717a',
  },
  labelSmall: {
    fontSize: 10,
    color: '#71717a',
  },
  inputWrapper: {
    position: 'relative',
  },
  taxInput: {
    height: 32,
    fontSize: 14,
    paddingRight: 40,
  },
  inputSuffix: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -8,
    fontSize: 14,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  preTaxSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    marginBottom: 6,
  },
  preTaxInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: '100%',
  },
  dollarSign: {
    fontSize: 24,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  preTaxInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: 0,
    backgroundColor: 'transparent',
    padding: 0,
    height: 48,
    color: '#18181b',
  },
  breakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
    backgroundColor: '#fafafa',
    borderColor: '#f4f4f5',
  },
  breakdownLeft: {
    flexDirection: 'column',
  },
  breakdownLabel: {
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#18181b',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: '#e4e4e7',
  },
  breakdownRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  breakdownTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: -0.5,
    color: '#18181b',
  },
  dividerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    opacity: 0.6,
    marginBottom: 6,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e4e4e7',
  },
  dividerText: {
    letterSpacing: 1.5,
  },
  successCard: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: '#ecfdf5',
    borderColor: '#d1fae5',
  },
  successIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#047857',
  },
  successSubtitle: {
    fontSize: 12,
    color: '#059669',
  },
  cardsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  card: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    borderColor: '#f4f4f5',
  },
  cardAccentGreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 5,
    height: '100%',
    backgroundColor: '#10b981',
  },
  cardAccentBlue: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 5,
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardIconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  iconBg: {
    padding: 5,
    borderRadius: 10,
  },
  iconBgGreen: {
    backgroundColor: '#d1fae5',
  },
  iconBgBlue: {
    backgroundColor: '#dbeafe',
  },
  cardLabel: {
    letterSpacing: 1,
  },
  cardBody: {
    flexDirection: 'column',
  },
  cardValueSection: {
    marginBottom: 6,
  },
  cardSubLabel: {
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  cardPriceWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  cardDollarGreen: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#10b981',
  },
  cardDollarBlue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  cardPrice: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -1,
    color: '#18181b',
  },
  cardTotal: {
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f4f4f5',
  },
  cardTotalValueGreen: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#10b981',
  },
  cardTotalValueBlue: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  tooltipTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 12,
    color: '#ffffff',
  },
  tooltipContent: {
    gap: 6,
  },
  tooltipText: {
    fontSize: 10,
    color: '#ffffff',
  },
  tooltipRed: {
    color: '#f87171',
    fontWeight: '600',
  },
  tooltipGreen: {
    color: '#4ade80',
    fontWeight: '600',
  },
  tooltipFooter: {
    color: '#a1a1aa',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#3f3f46',
  },
  tooltipSimple: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
});
