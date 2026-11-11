// screens/CheckoutScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform, KeyboardAvoidingView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  CardField,
  useStripe,
  usePlatformPay,
  PlatformPay,
  isStripeNativeAvailable,
} from '../services/StripeBridge';
import { apiFetch, API_URL } from '../services/Api';

const COLORS = {
  bg: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E3E6EE',
  text: '#1B1F2A',
  muted: '#6B7280',
  primary: '#1AA1E6',
  primaryDark: '#0B5C8C',
  primarySoft: '#E4F1FB',
  field: '#F3F4F8',
  success: '#12B76A',
};

const PLANS = {
  annual: { label: 'Annual ($59.99/yr)', price: 59.99, perMonth: '$4.99', suffix: '/yr', cycle: 'yearly' },
  monthly: { label: 'Monthly ($9.99/mo)', price: 9.99, perMonth: '$9.99', suffix: '/mo', cycle: 'monthly' },
};

const FEATURES = [
  { icon: 'infinity', text: 'Unlimited AI 3D model generations' },
  { icon: 'cloud-sync-outline', text: 'Automatic multi-device cloud sync' },
  { icon: 'cube-scan', text: 'High-res USDZ, OBJ & GLTF mesh export' },
];

export default function CheckoutScreen({ navigation }) {
  const { confirmPayment } = useStripe();
  const { isPlatformPaySupported, confirmPlatformPayPayment } = usePlatformPay();

  const [plan, setPlan] = useState('annual');
  const [name, setName] = useState('');
  const [cardComplete, setCardComplete] = useState(false);
  const [saveCard, setSaveCard] = useState(true);
  const [loading, setLoading] = useState(false);
  const [platformPayReady, setPlatformPayReady] = useState(false);

  const selected = PLANS[plan];
  const total = selected.price.toFixed(2);

  /* ---------- Apple Pay / Google Pay available hai ya nahi ---------- */
  useEffect(() => {
    (async () => {
      try {
        const ok = await isPlatformPaySupported({
          googlePay: { testEnv: __DEV__ },
        });
        setPlatformPayReady(ok);
      } catch (e) {
        setPlatformPayReady(false);
      }
    })();
  }, []);

  /* ---------- Backend: subscription banao, clientSecret lo ---------- */
  const createSubscription = async () => {
  console.log('[Checkout] creating subscription, plan:', plan, 'url:', `${API_URL}/payments/create-subscription`);
  const data = await apiFetch('/payments/create-subscription', {
    method: 'POST',
    body: { plan },
  });
  console.log('[Checkout] backend response:', {
    subscriptionId: data.subscriptionId,
    hasClientSecret: !!data.clientSecret,
  });
  if (!data.clientSecret) {
    throw new Error(data.error || 'Could not start checkout');
  }
  return data.clientSecret;
};

  const onSuccess = () => {
    Alert.alert('Subscribed 🎉', 'PixiMesh Pro is now active.', [
      { text: 'Done', onPress: () => navigation.goBack() },
    ]);
  };

  /* ---------- Card payment ---------- */

  const handleCardPay = async () => {
  console.log('[Checkout] Subscribe pressed', { plan, nameFilled: !!name.trim(), cardComplete });
  if (!name.trim()) return Alert.alert('Missing name', 'Enter the cardholder name.');
  if (!isStripeNativeAvailable) return Alert.alert('Expo Go', 'Stripe payments require a native/EAS build. All other app features work in Expo Go.');
  if (!cardComplete) return Alert.alert('Card incomplete', 'Check your card details.');

  try {
    setLoading(true);
    const clientSecret = await createSubscription();

    console.log('[Checkout] confirming payment with Stripe...');
    const { error, paymentIntent } = await confirmPayment(clientSecret, {
      paymentMethodType: 'Card',
      paymentMethodData: { billingDetails: { name: name.trim() } },
    });

    if (error) {
      console.log('[Checkout] confirmPayment ERROR:', error.code, error.message);
      Alert.alert('Payment failed', error.message);
    } else {
      console.log('[Checkout] payment confirmed, status:', paymentIntent?.status);
      onSuccess();
    }
  } catch (e) {
    console.log('[Checkout] catch error:', e.message);
    Alert.alert('Error', e.message);
  } finally {
    setLoading(false);
  }
};
 
  /* ---------- Apple Pay (iOS) / Google Pay (Android) ---------- */
  const handlePlatformPay = async () => {
    try {
      const supported = await isPlatformPaySupported({
        googlePay: { testEnv: __DEV__ },
      });

      if (!supported) {
        return Alert.alert(
          'Not available',
          Platform.OS === 'ios'
            ? 'Add a card to Apple Wallet to use Apple Pay.'
            : 'Google Pay is not available. Add a card in Google Wallet and update Google Play Services.'
        );
      }

      setLoading(true);
      const clientSecret = await createSubscription();

      const { error } = await confirmPlatformPayPayment(clientSecret, {
        applePay: {
          cartItems: [
            {
              paymentType: PlatformPay.PaymentType.Immediate,
              label: `PixiMesh Pro (${plan})`,
              amount: total,
            },
          ],
          merchantCountryCode: 'US',
          currencyCode: 'USD',
        },
        googlePay: {
          testEnv: __DEV__,
          merchantName: 'PixiMesh',
          merchantCountryCode: 'US',
          currencyCode: 'USD',
        },
      });

      if (error) {
        if (error.code !== 'Canceled') Alert.alert('Payment failed', error.message);
      } else {
        onSuccess();
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.sslRow}>
            <Feather name="lock" size={11} color={COLORS.primaryDark} />
            <Text style={styles.sslText}>256-BIT SSL</Text>
          </View>
        </View>
        <View style={styles.stripeChip}>
          <Text style={styles.stripeVia}>via </Text>
          <Text style={styles.stripeName}>stripe</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets={true}
      >
        {/* Free trial banner */}
        <View style={styles.trialBanner}>
          <View style={styles.trialIcon}>
            <Feather name="check-circle" size={20} color={COLORS.primaryDark} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.trialTitleRow}>
              <Text style={styles.trialTitle}>1st 3D Model Rendered</Text>
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>FREE TRIAL</Text>
              </View>
            </View>
            <Text style={styles.trialSub}>
              Free trial complete. Upgrade to continue generating unlimited 3D models.
            </Text>
          </View>
        </View>

        {/* Plan card */}
        <View style={styles.planCard}>
          <View style={styles.planTop}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={styles.planNameRow}>
                <Text style={styles.planName}>PixiMesh Pro</Text>
                {plan === 'annual' && (
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveBadgeText}>SAVE 48%</Text>
                  </View>
                )}
              </View>
              <Text style={styles.planDesc}>High-fidelity optical 3D reconstruction</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.price}>
                {selected.perMonth}
                <Text style={styles.priceUnit}> /mo</Text>
              </Text>
              {plan === 'annual' && <Text style={styles.billed}>$59.99 billed{'\n'}annually</Text>}
            </View>
          </View>

          {/* Toggle */}
          <View style={styles.toggle}>
            {Object.keys(PLANS).map((key) => {
              const active = plan === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.toggleBtn, active && styles.toggleBtnActive]}
                  onPress={() => setPlan(key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
                    {PLANS[key].label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.divider} />

          {FEATURES.map((f) => (
            <View key={f.text} style={styles.featureRow}>
              <MaterialCommunityIcons name={f.icon} size={20} color={COLORS.primaryDark} />
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Express checkout: sirf tab dikhega jab Apple Pay / Google Pay available ho */}
        {platformPayReady && (
          <>
            <View style={styles.expressHeader}>
              <Text style={styles.sectionLabel}>EXPRESS CHECKOUT</Text>
              <Text style={styles.instant}>Instant Setup</Text>
            </View>

            <TouchableOpacity
              style={styles.payBtn}
              activeOpacity={0.85}
              onPress={handlePlatformPay}
              disabled={loading}
            >
              <Text style={styles.payBtnText}>Pay with </Text>
              <Ionicons
                name={Platform.OS === 'ios' ? 'logo-apple' : 'logo-google'}
                size={22}
                color="#fff"
              />
              {Platform.OS === 'android' && <Text style={styles.payBtnText}> Pay</Text>}
            </TouchableOpacity>

            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR PAY WITH CARD</Text>
              <View style={styles.orLine} />
            </View>
          </>
        )}

        {/* Card info */}
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Card Information</Text>
            <View style={styles.greenDot} />
          </View>
          <View style={styles.brands}>
            <View style={[styles.brandChip, { borderColor: '#C9E3F6', backgroundColor: COLORS.primarySoft }]}>
              <Text style={[styles.brandText, { color: COLORS.primaryDark }]}>VISA</Text>
            </View>
            <View style={[styles.brandChip, { borderColor: '#F7D9BF', backgroundColor: '#FFF4EA' }]}>
              <Text style={[styles.brandText, { color: '#C2540A' }]}>MC</Text>
            </View>
            <View style={[styles.brandChip, { borderColor: '#C9E3F6', backgroundColor: COLORS.primarySoft }]}>
              <Text style={[styles.brandText, { color: COLORS.primaryDark }]}>AMEX</Text>
            </View>
          </View>
        </View>

        <Text style={styles.fieldLabel}>CARDHOLDER NAME</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Name on card"
            placeholderTextColor={COLORS.muted}
            autoCapitalize="words"
          />
          <Feather name="user" size={18} color={COLORS.muted} />
        </View>

        <Text style={styles.fieldLabel}>CARD NUMBER, EXPIRY & CVC</Text>
        <CardField
          postalCodeEnabled={false}
          placeholders={{ number: '4242 4242 4242 4242', expiration: 'MM/YY', cvc: 'CVC' }}
          cardStyle={{
            backgroundColor: COLORS.field,
            textColor: COLORS.text,
            placeholderColor: '#9AA1AF',
            borderRadius: 26,
            fontSize: 15,
          }}
          style={styles.cardField}
          onCardChange={(d) => setCardComplete(d.complete)}
        />

        <TouchableOpacity style={styles.saveRow} onPress={() => setSaveCard(!saveCard)} activeOpacity={0.7}>
          <View style={[styles.checkbox, saveCard && styles.checkboxOn]}>
            {saveCard && <Feather name="check" size={14} color="#fff" />}
          </View>
          <Text style={styles.saveText}>
            Save card securely to Stripe for rapid 1-tap renewals and export requests.
          </Text>
        </TouchableOpacity>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              PixiMesh Pro ({plan === 'annual' ? 'Annual' : 'Monthly'} Subscription)
            </Text>
            <Text style={styles.summaryValue}>${total}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxes (calculated)</Text>
            <Text style={styles.summaryValue}>$0.00</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total due today</Text>
            <Text style={styles.totalValue}>${total}</Text>
          </View>
        </View>

        {/* Subscribe */}
        <TouchableOpacity
          style={[styles.subscribeBtn, loading && { opacity: 0.7 }]}
          activeOpacity={0.85}
          onPress={handleCardPay}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="lock" size={20} color="#fff" />
              <Text style={styles.subscribeText}>
                Subscribe with Stripe — ${total}
                {selected.suffix}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Trust row */}
        <View style={styles.trustRow}>
          <View style={styles.trustItem}>
            <Feather name="shield" size={14} color={COLORS.success} />
            <Text style={styles.trustText}>PCI DSS{'\n'}Level 1</Text>
          </View>
          <View style={styles.trustDot} />
          <Text style={styles.trustText}>Cancel anytime{'\n'}in 1 tap</Text>
          <View style={styles.trustDot} />
          <Text style={styles.trustText}>End-to-End{'\n'}Encrypted</Text>
        </View>

        <Text style={styles.legal}>
          By confirming your subscription, you authorize PixiMesh to charge your card ${total}{' '}
          {selected.cycle} until canceled in Settings. Your scan data remains private and local-first.
        </Text>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },

  /* header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F3F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  sslRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  sslText: { fontSize: 11, color: COLORS.muted, letterSpacing: 0.5 },
  stripeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF0FB',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#DDE1F5',
  },
  stripeVia: { fontSize: 12, color: COLORS.muted },
  stripeName: { fontSize: 13, fontWeight: '800', color: '#635BFF' },

  /* trial */
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    padding: 14,
    borderRadius: 28,
    backgroundColor: '#F1F3FB',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  trialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trialTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  trialTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  freeBadge: { backgroundColor: COLORS.primary, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  freeBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  trialSub: { fontSize: 13, color: COLORS.muted, marginTop: 2, lineHeight: 18 },

  /* plan */
  planCard: {
    marginTop: 24,
    padding: 18,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#BFE0F5',
    backgroundColor: '#fff',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  planTop: { flexDirection: 'row', justifyContent: 'space-between' },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  planName: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  saveBadge: { backgroundColor: COLORS.primarySoft, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  saveBadgeText: { color: COLORS.primaryDark, fontSize: 11, fontWeight: '700' },
  planDesc: { fontSize: 14, color: COLORS.muted, marginTop: 4 },
  price: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  priceUnit: { fontSize: 14, fontWeight: '400', color: COLORS.muted },
  billed: { fontSize: 12, color: COLORS.muted, textAlign: 'right', marginTop: 2, fontWeight: '600' },

  toggle: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: '#EEF0F6',
    borderRadius: 24,
    padding: 4,
  },
  toggleBtn: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 20 },
  toggleBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  toggleText: { fontSize: 14, color: COLORS.muted },
  toggleTextActive: { color: COLORS.text, fontWeight: '600' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  featureText: { fontSize: 14, color: COLORS.text, flex: 1 },

  /* express */
  expressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 12,
  },
  sectionLabel: { fontSize: 14, color: COLORS.muted, letterSpacing: 0.5 },
  instant: { fontSize: 12, fontWeight: '700', color: COLORS.primaryDark },
  payBtn: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  orRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 22, gap: 12 },
  orLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  orText: { fontSize: 12, color: COLORS.muted, fontWeight: '600', letterSpacing: 0.5 },

  /* card */
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 16,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { fontSize: 18, fontWeight: '500', color: COLORS.text },
  greenDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.success },
  brands: { flexDirection: 'row', gap: 6 },
  brandChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1 },
  brandText: { fontSize: 11, fontWeight: '800' },
  fieldLabel: { fontSize: 12, color: COLORS.muted, letterSpacing: 0.5, marginTop: 14, marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.field,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 20,
  },
  input: { flex: 1, fontSize: 16, color: COLORS.text },
  cardField: { width: '100%', height: 54 },

  saveRow: { flexDirection: 'row', gap: 10, marginTop: 20, alignItems: 'flex-start' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  saveText: { flex: 1, fontSize: 13, color: COLORS.muted, lineHeight: 19 },

  /* summary */
  summary: {
    marginTop: 24,
    padding: 18,
    borderRadius: 28,
    backgroundColor: '#F5F6FB',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 5 },
  summaryLabel: { fontSize: 13, color: COLORS.muted, flex: 1, paddingRight: 8 },
  summaryValue: { fontSize: 14, color: COLORS.text },
  summaryDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 8 },
  totalLabel: { fontSize: 17, fontWeight: '600', color: COLORS.text },
  totalValue: { fontSize: 18, fontWeight: '800', color: COLORS.primaryDark },

  /* subscribe */
  subscribeBtn: {
    marginTop: 26,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  subscribeText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  /* trust */
  trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginTop: 18 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trustText: { fontSize: 12, color: COLORS.muted, textAlign: 'center', fontWeight: '600' },
  trustDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.muted },
  legal: { fontSize: 12, color: COLORS.muted, textAlign: 'center', lineHeight: 18, marginTop: 14 },
});