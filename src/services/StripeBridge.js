// services/StripeBridge.js
// Guards @stripe/stripe-react-native so the app can run in Expo Go (where the
// native StripeSdk TurboModule is not bundled) while keeping full Stripe support
// in EAS / native builds.
import React from 'react';
import { View, Text, TurboModuleRegistry } from 'react-native';

export const isStripeNativeAvailable = Boolean(TurboModuleRegistry.get('StripeSdk'));

let stripePkg = null;
if (isStripeNativeAvailable) {
  try {
    stripePkg = require('@stripe/stripe-react-native');
  } catch {
    stripePkg = null;
  }
}

export const StripeProvider = ({ children, ...props }) => {
  if (stripePkg?.StripeProvider) {
    const RealProvider = stripePkg.StripeProvider;
    return <RealProvider {...props}>{children}</RealProvider>;
  }
  return children;
};

export const CardField = (props) => {
  if (stripePkg?.CardField) {
    const RealCardField = stripePkg.CardField;
    return <RealCardField {...props} />;
  }
  return (
    <View
      style={[
        props.style,
        {
          backgroundColor: '#F3F4F8',
          borderRadius: 26,
          justifyContent: 'center',
          paddingHorizontal: 16,
          borderWidth: 1,
          borderColor: '#E3E6EE',
        },
      ]}
    >
      <Text style={{ color: '#6B7280', fontSize: 13 }}>
        Stripe card field requires a native/EAS build (unavailable in Expo Go).
      </Text>
    </View>
  );
};

const fallbackUseStripe = () => ({
  confirmPayment: async () => ({
    error: { message: 'Stripe payments require a native/EAS build (unavailable in Expo Go).' },
  }),
});

const fallbackUsePlatformPay = () => ({
  isPlatformPaySupported: async () => false,
  confirmPlatformPayPayment: async () => ({
    error: { message: 'Apple Pay / Google Pay requires a native/EAS build.' },
  }),
});

export const useStripe = stripePkg?.useStripe || fallbackUseStripe;
export const usePlatformPay = stripePkg?.usePlatformPay || fallbackUsePlatformPay;
export const PlatformPay = stripePkg?.PlatformPay || { PaymentType: { Immediate: 'Immediate' } };
