import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView , Alert, ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthService } from '../services/AuthService';

const passwordStrength = (pw) => {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
};

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['#E0E0E0', '#FF3B30', '#FF9500', '#FFCC00', '#34C759'];

export default function AuthScreen({ navigation }) {
  const [isSignIn, setIsSignIn] = useState(true); 
  const [showPassword, setShowPassword] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Agar pehle se login hai to seedha app me le jao
  useEffect(() => {
    (async () => {
      try {
        if (await AuthService.hasSession()) {
          navigation.replace('Onboarding');
        }
      } catch {
        /* ignore */
      } finally {
        setCheckingSession(false);
      }
    })();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      return Alert.alert('Missing details', 'Enter your email and password.');
    }
    try {
      setLoading(true);
      await AuthService.login(email, password);
      navigation.replace('Onboarding');
    } catch (err) {
      Alert.alert('Sign in failed', err.message || 'Invalid Credentials!');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!fullName.trim()) return Alert.alert('Missing name', 'Please enter your full name.');
    if (!email.trim()) return Alert.alert('Missing email', 'Please enter your email address.');
    if (password.length < 6) return Alert.alert('Weak password', 'Password must be at least 6 characters.');
    if (password !== confirmPassword) return Alert.alert('Password mismatch', 'Passwords do not match.');
    if (!agreedToTerms) return Alert.alert('Terms required', 'Please agree to the Terms of Service.');

    try {
      setLoading(true);
      await AuthService.signup(fullName, email, password);
      Alert.alert('Welcome to PixiMesh 🎉', 'Your account was created successfully!', [
        { text: 'Continue', onPress: () => navigation.replace('Onboarding') },
      ]);
    } catch (err) {
      const message = err.status === 409
        ? 'An account with this email already exists. Try signing in instead.'
        : err.message || 'Could not create your account.';
      Alert.alert('Sign up failed', message, [
        { text: 'Sign In Instead', onPress: () => setIsSignIn(true) },
        { text: 'OK' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#00A3FF" />
      </SafeAreaView>
    );
  }

  const strength = passwordStrength(password);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContainer, { paddingBottom: 60 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets={true}
        >
          
          {/* Header Section */}
          <View style={styles.headerContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="cube-outline" size={28} color="#00A3FF" />
              <View style={styles.logoDot} />
            </View>
            <Text style={styles.logoText}>PixiMesh</Text>
            <Text style={styles.subtitleText}>
              {isSignIn ? "Welcome to 3D scanning made simple" : "Create your account to start 3D scanning"}
            </Text>
          </View>

          {/* Toggle Tab */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tabButton, isSignIn && styles.activeTab]} 
              onPress={() => setIsSignIn(true)}
            >
              <Text style={[styles.tabText, isSignIn && styles.activeTabText]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, !isSignIn && styles.activeTab]} 
              onPress={() => setIsSignIn(false)}
            >
              <Text style={[styles.tabText, !isSignIn && styles.activeTabText]}>Create Account</Text>
            </TouchableOpacity>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            {!isSignIn && (
              <>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#555" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input} 
                    placeholder="e.g. Areeha Fareed" 
                    placeholderTextColor="#999"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>
              </>
            )}

            <Text style={styles.inputLabel}>Email address</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="email-outline" size={20} color="#555" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="designer@spatial.studio" 
                placeholderTextColor="#999" 
                keyboardType="email-address" 
                autoCapitalize="none" 
                value={email} 
                onChangeText={setEmail} 
              />
            </View>

            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#555" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="••••••••••••" 
                placeholderTextColor="#999" 
                secureTextEntry={!showPassword} 
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#555" style={styles.inputIconRight} />
              </TouchableOpacity>
            </View>

            {!isSignIn && (
              <>
                <View style={styles.strengthContainer}>
                  <Text style={styles.strengthText}>Security Strength</Text>
                  <Text style={[styles.strengthValue, { color: STRENGTH_COLORS[strength] }]}>
                    {STRENGTH_LABELS[strength] || '—'}
                  </Text>
                </View>
                <View style={styles.strengthBars}>
                  {[1, 2, 3, 4].map((i) => (
                    <View
                      key={i}
                      style={[styles.bar, strength >= i && { backgroundColor: STRENGTH_COLORS[strength] }]}
                    />
                  ))}
                </View>

                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#555" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input} 
                    placeholder="••••••••••••" 
                    placeholderTextColor="#999" 
                    secureTextEntry={!showPassword} 
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  {confirmPassword.length > 0 && (
                    <Ionicons
                      name={confirmPassword === password ? "checkmark-circle" : "close-circle-outline"}
                      size={20}
                      color={confirmPassword === password ? "#34C759" : "#FF3B30"}
                      style={styles.inputIconRight}
                    />
                  )}
                </View>
                
                <TouchableOpacity style={styles.checkboxContainer} onPress={() => setAgreedToTerms(!agreedToTerms)}>
                  <Ionicons name={agreedToTerms ? "checkbox" : "square-outline"} size={20} color={agreedToTerms ? "#00A3FF" : "#999"} />
                  <Text style={styles.checkboxText}>I agree to the <Text style={styles.linkTextDark}>Terms of Service</Text> & <Text style={styles.linkTextDark}>Privacy Policy</Text></Text>
                </TouchableOpacity>
              </>
            )}

            {isSignIn && (
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    'Reset Password',
                    'Please sign in with your current password and update it anytime from Profile → Account & Security → Password.'
                  )
                }
              >
                <Text style={styles.forgotPassword}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[styles.primaryButton, loading && { opacity: 0.7 }]} 
              onPress={isSignIn ? handleLogin : handleSignup}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isSignIn ? "Login" : "Create Account"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Social Logins */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>Or {isSignIn ? "continue" : "sign up"} with</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              activeOpacity={0.85}
              onPress={() => Alert.alert('Apple Sign In', 'Please use email and password sign in for now.')}
            >
              <Ionicons name="logo-apple" size={20} color="#000" />
              <Text style={styles.socialText}>Apple</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              activeOpacity={0.85}
              onPress={() => Alert.alert('Google Sign In', 'Please use email and password sign in for now.')}
            >
              <Ionicons name="logo-google" size={20} color="#DB4437" />
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Section */}
          {isSignIn ? (
            <View style={styles.footer}>
              <Text style={styles.footerText}>By proceeding, you agree to our <Text style={styles.linkTextDark}>Terms of Service</Text> and acknowledge our <Text style={styles.linkTextDark}>Privacy Policy</Text>.</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.footerLogin} onPress={() => setIsSignIn(true)}>
              <Text style={styles.footerText}>Already have an account? <Text style={styles.linkTextBlue}>Sign In</Text></Text>
            </TouchableOpacity>
          )}

          <View style={styles.versionPill}>
            <View style={styles.versionDot} />
            <Text style={styles.versionText}>AI Image-to-3D Engine v1.0</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  center: { justifyContent: 'center', alignItems: 'center' },
  scrollContainer: { padding: 24, alignItems: 'center', flexGrow: 1 },
  headerContainer: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  logoCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F0F5FF', justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#E5EFFF' },
  logoDot: { position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#00A3FF' },
  logoText: { fontSize: 24, fontWeight: 'bold', color: '#111', marginBottom: 8 },
  subtitleText: { fontSize: 14, color: '#666', textAlign: 'center' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#F0F2F8', borderRadius: 30, padding: 4, width: '100%', marginBottom: 24 },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 30 },
  activeTab: { backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, color: '#666', fontWeight: '600' },
  activeTabText: { color: '#111' },
  formContainer: { width: '100%' },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#111', marginBottom: 8, marginTop: 12 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F9', borderRadius: 24, paddingHorizontal: 16, height: 50 },
  inputIcon: { marginRight: 10 },
  inputIconRight: { marginLeft: 10 },
  input: { flex: 1, fontSize: 14, color: '#333' },
  strengthContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 },
  strengthText: { fontSize: 12, color: '#111', fontWeight: '600' },
  strengthValue: { fontSize: 12, fontWeight: '600' },
  strengthBars: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  bar: { height: 4, flex: 1, marginHorizontal: 2, borderRadius: 2, backgroundColor: '#E0E0E0' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 16 },
  checkboxText: { fontSize: 12, color: '#666', marginLeft: 8, flex: 1 },
  forgotPassword: { color: '#00A3FF', fontSize: 12, fontWeight: '600', textAlign: 'right', marginTop: 16, marginBottom: 24 },
  primaryButton: { backgroundColor: '#00A3FF', borderRadius: 30, height: 50, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, shadowColor: '#00A3FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginRight: 8 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 24 },
  divider: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  dividerText: { color: '#999', fontSize: 12, marginHorizontal: 12 },
  socialContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 30 },
  socialButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 30, height: 50, marginHorizontal: 6 },
  socialText: { fontSize: 14, fontWeight: '600', color: '#111', marginLeft: 8 },
  footer: { marginTop: 'auto', marginBottom: 20 },
  footerLogin: { marginTop: 20, marginBottom: 20 },
  footerText: { fontSize: 12, color: '#888', textAlign: 'center', lineHeight: 18 },
  linkTextDark: { color: '#111', fontWeight: '600' },
  linkTextBlue: { color: '#00A3FF', fontWeight: 'bold' },
  versionPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F5FF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E5EFFF' },
  versionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00A3FF', marginRight: 8 },
  versionText: { fontSize: 10, color: '#555', fontWeight: '600' }
});
