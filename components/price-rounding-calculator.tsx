import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
    <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
      <View style={[styles.header, isDark ? styles.headerDark : styles.headerLight]}>
        <Text style={[styles.headerText, isDark ? styles.textWhite : styles.textDark]}>
          Penny Rounding Calculator
        </Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
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
            <Text style={[styles.inputSuffix, isDark ? styles.textGray : styles.textGrayLight]}>%</Text>
          </View>
        </View>

        <View style={styles.preTaxSection}>
          <Text style={[styles.label, styles.labelTiny]}>PRE-TAX AMOUNT</Text>
          <View style={styles.preTaxInputWrapper}>
            <Text style={[styles.dollarSign, isDark ? styles.textGrayDark : styles.textGrayLight]}>$</Text>
            <Input
              keyboardType="decimal-pad"
              placeholder="0.00"
              value={price}
              onChangeText={setPrice}
              style={[styles.preTaxInput, isDark ? styles.textWhite : styles.textDark]}
            />
          </View>
        </View>

        <View style={[styles.breakdown, isDark ? styles.breakdownDark : styles.breakdownLight]}>
          <View style={styles.breakdownLeft}>
            <Text style={[styles.breakdownLabel, styles.labelTiny]}>
              TAX ({(Number.parseFloat(taxRate) || 0).toFixed(2)}%)
            </Text>
            <Text style={[styles.breakdownValue, isDark ? styles.textWhite : styles.textDark]}>
              +${calculations.taxAmount.toFixed(2)}
            </Text>
          </View>

          <TooltipWrapper
            content={
              <View>
                <Text style={styles.tooltipTitle}>Swedish Rounding Rules</Text>
                <View style={styles.tooltipContent}>
                  <Text style={styles.tooltipText}>
                    <Text style={styles.tooltipRed}>Round Down:</Text> ends in 1, 2, 6, 7
                  </Text>
                  <Text style={styles.tooltipText}>
                    <Text style={styles.tooltipGreen}>Round Up:</Text> ends in 3, 4, 8, 9
                  </Text>
                  <Text style={[styles.tooltipText, styles.tooltipFooter]}>
                    Ends in 0 or 5 stay exact
                  </Text>
                </View>
              </View>
            }
          >
            <View style={[styles.divider, isDark ? styles.dividerDark : styles.dividerLight]} />
          </TooltipWrapper>

          <View style={styles.breakdownRight}>
            <Text style={[styles.breakdownLabel, styles.labelTiny]}>SUBTOTAL</Text>
            <Text style={[styles.breakdownTotal, isDark ? styles.textWhite : styles.textDark]}>
              ${calculations.total.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.dividerSection}>
          <View style={[styles.dividerLine, isDark ? styles.dividerDark : styles.dividerLight]} />
          <Text style={[styles.dividerText, styles.labelTiny]}>ROUNDED PRICES</Text>
          <View style={[styles.dividerLine, isDark ? styles.dividerDark : styles.dividerLight]} />
        </View>

        {calculations.subtotal > 0 && calculations.direction === 'none' && (
          <View style={[styles.successCard, isDark ? styles.successCardDark : styles.successCardLight]}>
            <View style={styles.successIcon}>
              <CheckIcon />
            </View>
            <Text style={[styles.successTitle, isDark ? styles.successTitleDark : styles.successTitleLight]}>
              Perfect!
            </Text>
            <Text style={[styles.successSubtitle, isDark ? styles.successSubtitleDark : styles.successSubtitleLight]}>
              No rounding needed
            </Text>
          </View>
        )}

        {!(calculations.subtotal > 0 && calculations.direction === 'none') && (
          <View style={styles.cardsContainer}>
            <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
              <View style={styles.cardAccentGreen} />
              <View style={styles.cardHeader}>
                <View style={styles.cardIconWrapper}>
                  <View style={[styles.iconBg, styles.iconBgGreen]}>
                    <StoreIcon size={16} color="#10b981" />
                  </View>
                  <Text style={[styles.cardLabel, styles.labelSmall]}>SELLER</Text>
                </View>
                {calculations.sellerSuggestion?.skipped && (
                  <TooltipWrapper
                    content={
                      <Text style={styles.tooltipSimple}>Next reachable nickel</Text>
                    }
                  >
                    <Pressable>
                      <AlertCircleIcon size={16} color="#f59e0b" />
                    </Pressable>
                  </TooltipWrapper>
                )}
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardValueSection}>
                  <Text style={[styles.cardSubLabel, styles.labelTiny]}>SET PRE-TAX TO</Text>
                  <View style={styles.cardPriceWrapper}>
                    <Text style={styles.cardDollarGreen}>$</Text>
                    <Text style={[styles.cardPrice, isDark ? styles.textWhite : styles.textDark]}>
                      {calculations.sellerSuggestion?.preTax.toFixed(2) ?? '0.00'}
                    </Text>
                  </View>
                </View>
                <View style={[styles.cardTotal, isDark ? styles.cardTotalDark : styles.cardTotalLight]}>
                  <Text style={[styles.cardSubLabel, styles.labelTiny]}>AFTER-TAX TOTAL</Text>
                  <Text style={styles.cardTotalValueGreen}>
                    ${calculations.sellerSuggestion?.total.toFixed(2) ?? '0.00'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
              <View style={styles.cardAccentBlue} />
              <View style={styles.cardHeader}>
                <View style={styles.cardIconWrapper}>
                  <View style={[styles.iconBg, styles.iconBgBlue]}>
                    <UsersIcon size={16} color="#3b82f6" />
                  </View>
                  <Text style={[styles.cardLabel, styles.labelSmall]}>CUSTOMER</Text>
                </View>
                {calculations.customerSuggestion?.skipped && (
                  <TooltipWrapper
                    content={
                      <Text style={styles.tooltipSimple}>Previous reachable nickel</Text>
                    }
                  >
                    <Pressable>
                      <AlertCircleIcon size={16} color="#f59e0b" />
                    </Pressable>
                  </TooltipWrapper>
                )}
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardValueSection}>
                  <Text style={[styles.cardSubLabel, styles.labelTiny]}>SET PRE-TAX TO</Text>
                  <View style={styles.cardPriceWrapper}>
                    <Text style={styles.cardDollarBlue}>$</Text>
                    <Text style={[styles.cardPrice, isDark ? styles.textWhite : styles.textDark]}>
                      {calculations.customerSuggestion?.preTax.toFixed(2) ?? '0.00'}
                    </Text>
                  </View>
                </View>
                <View style={[styles.cardTotal, isDark ? styles.cardTotalDark : styles.cardTotalLight]}>
                  <Text style={[styles.cardSubLabel, styles.labelTiny]}>AFTER-TAX TOTAL</Text>
                  <Text style={styles.cardTotalValueBlue}>
                    ${calculations.customerSuggestion?.total.toFixed(2) ?? '0.00'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  containerLight: {
    backgroundColor: '#ffffff',
  },
  containerDark: {
    backgroundColor: '#18181b',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLight: {
    backgroundColor: '#ffffff',
    borderBottomColor: '#f4f4f5',
  },
  headerDark: {
    backgroundColor: '#18181b',
    borderBottomColor: '#27272a',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 12,
  },
  section: {
    marginBottom: 8,
  },
  label: {
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
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
    height: 40,
    fontSize: 16,
    paddingRight: 48,
  },
  inputSuffix: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -10,
    fontSize: 16,
    fontWeight: '600',
  },
  preTaxSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  preTaxInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
  },
  dollarSign: {
    fontSize: 32,
    fontWeight: '600',
  },
  preTaxInput: {
    flex: 1,
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: 0,
    backgroundColor: 'transparent',
    padding: 0,
    height: 60,
  },
  breakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  breakdownLight: {
    backgroundColor: '#fafafa',
    borderColor: '#f4f4f5',
  },
  breakdownDark: {
    backgroundColor: 'rgba(39, 39, 42, 0.5)',
    borderColor: '#27272a',
  },
  breakdownLeft: {
    flexDirection: 'column',
  },
  breakdownLabel: {
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    width: 1,
    height: 40,
  },
  dividerLight: {
    backgroundColor: '#e4e4e7',
  },
  dividerDark: {
    backgroundColor: '#3f3f46',
  },
  breakdownRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  breakdownTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  dividerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    opacity: 0.6,
    marginBottom: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    letterSpacing: 1.5,
  },
  successCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 8,
  },
  successCardLight: {
    backgroundColor: '#ecfdf5',
    borderColor: '#d1fae5',
  },
  successCardDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#064e3b',
  },
  successIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  successTitleLight: {
    color: '#047857',
  },
  successTitleDark: {
    color: '#34d399',
  },
  successSubtitle: {
    fontSize: 14,
  },
  successSubtitleLight: {
    color: '#059669',
  },
  successSubtitleDark: {
    color: '#10b981',
  },
  cardsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  cardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#f4f4f5',
  },
  cardDark: {
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
  },
  cardAccentGreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 6,
    height: '100%',
    backgroundColor: '#10b981',
  },
  cardAccentBlue: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 6,
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBg: {
    padding: 6,
    borderRadius: 12,
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
    marginBottom: 8,
  },
  cardSubLabel: {
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  cardPriceWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  cardDollarGreen: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  cardDollarBlue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  cardPrice: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  cardTotal: {
    paddingTop: 8,
    borderTopWidth: 1,
  },
  cardTotalLight: {
    borderTopColor: '#f4f4f5',
  },
  cardTotalDark: {
    borderTopColor: '#3f3f46',
  },
  cardTotalValueGreen: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
  },
  cardTotalValueBlue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  textDark: {
    color: '#18181b',
  },
  textWhite: {
    color: '#ffffff',
  },
  textGray: {
    color: '#71717a',
  },
  textGrayLight: {
    color: '#a1a1aa',
  },
  textGrayDark: {
    color: '#52525b',
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
