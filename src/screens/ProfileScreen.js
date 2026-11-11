import React, { useState, useCallback, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ProfileService } from '../services/ProfileService';
import { AuthService } from '../services/AuthService';

const PREF_BIOMETRIC_KEY = '@piximesh_pref_biometric';
const PREF_AUTOBACKUP_KEY = '@piximesh_pref_autobackup';

const COLORS = {
  bg: '#EEF2F8',
  card: '#FFFFFF',
  border: '#DDE3EF',
  text: '#1A1F36',
  muted: '#6B7280',
  primary: '#1AA1E6',
  primaryDark: '#0B5C8C',
  primarySoft: '#E4F1FB',
  primaryMid: '#1486C2',
  danger: '#E53E3E',
  success: '#10B981',
  warning: '#F59E0B',
  purple: '#7C3AED',
  purpleSoft: '#EDE9FE',
  sectionBg: '#F3F6FC',
  headerBg: '#0B5C8C',
  statsIconBg: '#E4F1FB',
};

const formatStorage = (kb) => {
  if (!kb || kb <= 0) return '0 MB';
  if (kb >= 1024 * 1024) return `${(kb / 1024 / 1024).toFixed(2)} GB`;
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${Math.round(kb)} KB`;
};

const initialsOf = (name, email) => {
  const source = (name && name.trim()) || email || '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
};

/* ---------- Reusable components ---------- */

const SectionHeader = ({ title, icon }) => (
  <View style={styles.sectionHeader}>
    {icon && <Ionicons name={icon} size={14} color={COLORS.primaryDark} style={{ marginRight: 6 }} />}
    <Text style={styles.sectionHeaderText}>{title}</Text>
  </View>
);

const Row = ({ icon, iconLib: Icon = Feather, iconColor = COLORS.primary, iconBg = COLORS.primarySoft, label, subLabel, value, badge, onPress, right, last }) => (
  <TouchableOpacity
    activeOpacity={onPress ? 0.6 : 1}
    onPress={onPress}
    style={[styles.row, !last && styles.rowBorder]}
  >
    <View style={[styles.rowIconCircle, { backgroundColor: iconBg }]}>
      <Icon name={icon} size={17} color={iconColor} />
    </View>
    <View style={styles.rowTextWrap}>
      <Text style={styles.rowLabel}>{label}</Text>
      {!!subLabel && <Text style={styles.rowSub}>{subLabel}</Text>}
    </View>
    {!!value && <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>}
    {!!badge && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    )}
    {right ? right : <Feather name="chevron-right" size={16} color="#C5CCD8" />}
  </TouchableOpacity>
);

const ToggleRow = ({ icon, iconLib, iconColor, iconBg, label, subLabel, value, onValueChange, last }) => (
  <Row
    icon={icon}
    iconLib={iconLib}
    iconColor={iconColor}
    iconBg={iconBg}
    label={label}
    subLabel={subLabel}
    last={last}
    right={
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#D1D5DB', true: COLORS.primary }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#D1D5DB"
      />
    }
  />
);

const StatCard = ({ icon, iconColor, iconBg, value, label }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconCircle, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={20} color={iconColor} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

/* ---------- Screen ---------- */

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwModalVisible, setPwModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [biometric, setBiometric] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [bioVal, backupVal] = await Promise.all([
          AsyncStorage.getItem(PREF_BIOMETRIC_KEY),
          AsyncStorage.getItem(PREF_AUTOBACKUP_KEY),
        ]);
        if (bioVal !== null) setBiometric(bioVal === 'true');
        if (backupVal !== null) setAutoBackup(backupVal === 'true');
      } catch {
        /* ignore preference read errors */
      }
    })();
  }, []);

  const handleToggleBiometric = async (val) => {
    setBiometric(val);
    await AsyncStorage.setItem(PREF_BIOMETRIC_KEY, String(val)).catch(() => {});
  };

  const handleToggleAutoBackup = async (val) => {
    setAutoBackup(val);
    await AsyncStorage.setItem(PREF_AUTOBACKUP_KEY, String(val)).catch(() => {});
  };

  const loadProfile = useCallback(async () => {
    try {
      setError(null);
      const data = await ProfileService.getProfile();
      setProfile(data);
    } catch (err) {
      console.error('[Profile] load failed:', err?.message);
      setError(err.message || 'Could not load your profile.');
      if (err.status === 401) {
        await AuthService.logout();
        navigation.replace('Auth');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const user = profile?.user || {};
  const stats = profile?.stats || {};
  const usedKb = stats.storageKb || 0;
  const limitKb = stats.storageLimitKb || 512 * 1024;
  const usedPct = Math.min(100, Math.round((usedKb / limitKb) * 100));
  const isPro = !!user.isPro;

  const openEditModal = () => {
    setEditName(user.name || '');
    setEditEmail(user.email || '');
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim().toLowerCase();
    if (!trimmedName) {
      return Alert.alert('Required', 'Name cannot be empty.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return Alert.alert('Invalid Email', 'Please enter a valid email address.');
    }
    try {
      setSavingProfile(true);
      const updatedUser = await ProfileService.updateProfile({
        name: trimmedName,
        email: trimmedEmail,
      });
      setProfile((p) => ({ ...(p || {}), user: { ...(p?.user || {}), ...updatedUser } }));
      setEditModalVisible(false);
      Alert.alert('Profile Updated', 'Your account details have been saved.');
    } catch (err) {
      Alert.alert('Could not save', err.message || 'Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const openPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPwModalVisible(true);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      return Alert.alert('Required', 'Please fill in all password fields.');
    }
    if (newPassword.length < 6) {
      return Alert.alert('Weak Password', 'New password must be at least 6 characters.');
    }
    if (newPassword !== confirmNewPassword) {
      return Alert.alert('Mismatch', 'New passwords do not match.');
    }
    try {
      setSavingPassword(true);
      await AuthService.changePassword(currentPassword, newPassword);
      setPwModalVisible(false);
      Alert.alert('Password Updated', 'Your password has been changed securely.');
    } catch (err) {
      Alert.alert('Could not update password', err.message || 'Please try again.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of PixiMesh?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await AuthService.logout();
          navigation.replace('Auth');
        },
      },
    ]);
  };

  /* ---- Hero header (always rendered) ---- */
  const renderHero = () => (
    <View style={styles.heroSection}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <View style={styles.brandIconWrap}>
            <Feather name="box" size={18} color="#fff" />
          </View>
          <Text style={styles.brandText}>PixiMesh</Text>
        </View>
        <View style={styles.topActions}>
          <TouchableOpacity style={styles.topBtn} onPress={openEditModal} disabled={!user.email}>
            <Feather name="edit-2" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topBtn} onPress={onRefresh} disabled={loading}>
            <Feather name="refresh-cw" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Avatar + name */}
      <View style={styles.heroBody}>
        {loading && !profile ? (
          <View style={styles.avatarRing}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : (
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initialsOf(user.name, user.email)}</Text>
            </View>
            <View style={styles.onlineDot} />
          </View>
        )}

        <View style={styles.heroMeta}>
          {loading && !profile ? (
            <>
              <View style={[styles.skeleton, { width: 160, height: 20, marginBottom: 8 }]} />
              <View style={[styles.skeleton, { width: 120, height: 14 }]} />
            </>
          ) : (
            <>
              <View style={styles.nameRow}>
                <Text style={styles.heroName} numberOfLines={1}>{user.name || 'PixiMesh User'}</Text>
                {isPro && (
                  <MaterialCommunityIcons name="check-decagram" size={18} color="#FFD700" style={{ marginLeft: 6 }} />
                )}
              </View>
              <Text style={styles.heroEmail} numberOfLines={1}>{user.email}</Text>
              <View style={[styles.planPill, isPro && styles.planPillPro]}>
                <MaterialCommunityIcons
                  name={isPro ? 'star-four-points' : 'account-outline'}
                  size={11}
                  color={isPro ? '#FFD700' : '#93C5FD'}
                />
                <Text style={[styles.planPillText, isPro && { color: '#FFD700' }]}>
                  {isPro ? 'PixiMesh Pro' : 'Free Plan'}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {renderHero()}

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {error && !profile ? (
          /* Error card */
          <View style={[styles.card, { padding: 32, alignItems: 'center' }]}>
            <Ionicons name="cloud-offline-outline" size={48} color={COLORS.muted} />
            <Text style={styles.errorTitle}>Could not load profile</Text>
            <Text style={styles.errorSub}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadProfile}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Stats row */}
            <View style={styles.statsRow}>
              <StatCard
                icon="cube-outline"
                iconColor={COLORS.primary}
                iconBg={COLORS.primarySoft}
                value={String(stats.models ?? 0)}
                label="3D Models"
              />
              <StatCard
                icon="download-outline"
                iconColor={COLORS.purple}
                iconBg={COLORS.purpleSoft}
                value={String(stats.exports ?? 0)}
                label="Exports"
              />
              <StatCard
                icon="server-outline"
                iconColor={COLORS.warning}
                iconBg="#FEF3C7"
                value={formatStorage(usedKb)}
                label="Storage"
              />
            </View>

            {/* Storage bar */}
            <View style={styles.card}>
              <View style={styles.storageHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="pie-chart-outline" size={16} color={COLORS.primaryDark} />
                  <Text style={styles.storageTitleText}>Storage Pool</Text>
                </View>
                <Text style={styles.storageValueText}>
                  {formatStorage(usedKb)} / {formatStorage(limitKb)}
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${usedPct}%`,
                      backgroundColor: usedPct > 90 ? COLORS.danger : usedPct > 70 ? COLORS.warning : COLORS.primary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.storagePct}>{usedPct}% used</Text>
            </View>

            {/* Plan card */}
            <View style={[styles.card, styles.planCard]}>
              <View style={styles.planTop}>
                <View style={styles.planTitleGroup}>
                  <View style={styles.planIconWrap}>
                    <MaterialCommunityIcons
                      name={isPro ? 'star-four-points' : 'lightning-bolt-outline'}
                      size={18}
                      color={isPro ? '#FFD700' : '#fff'}
                    />
                  </View>
                  <View>
                    <Text style={styles.planName}>PixiMesh {isPro ? 'Pro' : 'Free'}</Text>
                    <Text style={styles.planSub}>
                      {isPro
                        ? `${user.plan === 'annual' ? 'Annual' : 'Monthly'} · Unlimited models`
                        : '1 free model included'}
                    </Text>
                  </View>
                </View>
                <View style={[styles.planBadge, !isPro && { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                  <Text style={styles.planBadgeText}>{isPro ? '✓ Active' : 'Free'}</Text>
                </View>
              </View>

              {!isPro && (
                <Text style={styles.planUpgradeNote}>
                  Upgrade to Pro for unlimited models, priority generation &amp; more.
                </Text>
              )}

              <TouchableOpacity
                style={styles.planBtn}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Checkout')}
              >
                <Text style={styles.planBtnText}>{isPro ? 'Manage Plan' : '⚡ Upgrade to Pro'}</Text>
                <Feather name="arrow-right" size={15} color={isPro ? COLORS.primaryDark : COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Account & Security */}
            <View style={styles.card}>
              <SectionHeader title="ACCOUNT & SECURITY" icon="shield-checkmark-outline" />
              <Row
                icon="user"
                iconColor={COLORS.primary}
                iconBg={COLORS.primarySoft}
                label="Display Name"
                value={user.name || '—'}
                onPress={openEditModal}
              />
              <Row
                icon="mail"
                iconColor={COLORS.purple}
                iconBg={COLORS.purpleSoft}
                label="Email Address"
                value={user.email || '—'}
                onPress={openEditModal}
              />
              <Row
                icon="lock"
                iconColor={COLORS.warning}
                iconBg="#FEF3C7"
                label="Password"
                subLabel="Tap to update your password"
                onPress={openPasswordModal}
              />
              <ToggleRow
                icon="smile"
                iconColor={COLORS.success}
                iconBg="#D1FAE5"
                label="Biometric Unlock"
                subLabel="Face ID / Touch ID for quick access"
                value={biometric}
                onValueChange={handleToggleBiometric}
                last
              />
            </View>

            {/* Cloud & Sync */}
            <View style={styles.card}>
              <SectionHeader title="CLOUD & SYNC" icon="cloud-outline" />
              <ToggleRow
                icon="cloud"
                iconColor={COLORS.primary}
                iconBg={COLORS.primarySoft}
                label="Auto-backup Model Metadata"
                subLabel="Model names & stats sync to your account"
                value={autoBackup}
                onValueChange={handleToggleAutoBackup}
                last
              />
            </View>

            {/* Support */}
            <View style={styles.card}>
              <SectionHeader title="SUPPORT" icon="help-circle-outline" />
              <Row
                icon="help-circle"
                iconColor={COLORS.primary}
                iconBg={COLORS.primarySoft}
                label="Help & Support"
                onPress={() =>
                  Alert.alert(
                    'PixiMesh Help',
                    'Frame your object inside the scanner box and tap capture. PixiMesh uses AI image-to-3D reconstruction (no LiDAR required) and saves GLB models to your library.'
                  )
                }
              />
              <Row
                icon="shield"
                iconColor={COLORS.muted}
                iconBg="#F3F4F8"
                label="Privacy Policy"
                onPress={() =>
                  Alert.alert(
                    'Privacy Policy',
                    'Your 3D GLB files are stored locally on your device. Only your account info and model metadata (names & sizes) sync securely to the PixiMesh backend.'
                  )
                }
                last
              />
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logout} onPress={handleLogout} activeOpacity={0.7}>
              <View style={styles.logoutInner}>
                <Feather name="log-out" size={18} color={COLORS.danger} />
                <Text style={styles.logoutText}>Log Out</Text>
              </View>
            </TouchableOpacity>

            <Text style={styles.version}>PixiMesh v1.0.0</Text>
          </>
        )}
      </ScrollView>

      {/* Edit profile modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !savingProfile && setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <ScrollView keyboardShouldPersistTaps="handled" bounces={false} showsVerticalScrollIndicator={false}>
              <View style={styles.modalHandle} />
              <View style={styles.modalTitleRow}>
                <View style={styles.modalTitleIcon}>
                  <Feather name="edit-2" size={16} color={COLORS.primary} />
                </View>
                <Text style={styles.modalTitle}>Edit Profile</Text>
              </View>

              <Text style={styles.modalLabel}>DISPLAY NAME</Text>
              <View style={[styles.modalInputWrap, { marginBottom: 16 }]}>
                <Feather name="user" size={16} color={COLORS.muted} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.modalInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="e.g. Areeha Fareed"
                  placeholderTextColor="#B0B7C5"
                  autoCapitalize="words"
                  returnKeyType="next"
                  autoFocus
                />
              </View>

              <Text style={styles.modalLabel}>EMAIL ADDRESS</Text>
              <View style={styles.modalInputWrap}>
                <Feather name="mail" size={16} color={COLORS.muted} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.modalInput}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="#B0B7C5"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleSaveProfile}
                />
              </View>

              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setEditModalVisible(false)}
                  disabled={savingProfile}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSaveBtn, savingProfile && { opacity: 0.7 }]}
                  onPress={handleSaveProfile}
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.modalSaveText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Change password modal */}
      <Modal
        visible={pwModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !savingPassword && setPwModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <ScrollView keyboardShouldPersistTaps="handled" bounces={false} showsVerticalScrollIndicator={false}>
              <View style={styles.modalHandle} />
              <View style={styles.modalTitleRow}>
                <View style={[styles.modalTitleIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Feather name="lock" size={16} color={COLORS.warning} />
                </View>
                <Text style={styles.modalTitle}>Change Password</Text>
              </View>

              <Text style={styles.modalLabel}>CURRENT PASSWORD</Text>
              <View style={[styles.modalInputWrap, { marginBottom: 14 }]}>
                <Feather name="lock" size={16} color={COLORS.muted} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.modalInput}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  placeholderTextColor="#B0B7C5"
                  secureTextEntry
                  returnKeyType="next"
                  autoFocus
                />
              </View>

              <Text style={styles.modalLabel}>NEW PASSWORD</Text>
              <View style={[styles.modalInputWrap, { marginBottom: 14 }]}>
                <Feather name="key" size={16} color={COLORS.muted} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.modalInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="At least 6 characters"
                  placeholderTextColor="#B0B7C5"
                  secureTextEntry
                  returnKeyType="next"
                />
              </View>

              <Text style={styles.modalLabel}>CONFIRM NEW PASSWORD</Text>
              <View style={styles.modalInputWrap}>
                <Feather name="check-circle" size={16} color={COLORS.muted} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.modalInput}
                  value={confirmNewPassword}
                  onChangeText={setConfirmNewPassword}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#B0B7C5"
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleChangePassword}
                />
              </View>

              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setPwModalVisible(false)}
                  disabled={savingPassword}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSaveBtn, savingPassword && { opacity: 0.7 }]}
                  onPress={handleChangePassword}
                  disabled={savingPassword}
                >
                  {savingPassword ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.modalSaveText}>Update Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.headerBg },

  /* Hero section */
  heroSection: {
    backgroundColor: COLORS.headerBg,
    paddingBottom: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  topActions: { flexDirection: 'row', gap: 8 },
  topBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroBody: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  avatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#1AA1E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: '#fff' },
  onlineDot: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.success,
    borderWidth: 2.5,
    borderColor: COLORS.headerBg,
  },
  heroMeta: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  heroName: { fontSize: 22, fontWeight: '800', color: '#fff', flexShrink: 1 },
  heroEmail: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
  planPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  planPillPro: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderColor: 'rgba(255,215,0,0.4)',
  },
  planPillText: { fontSize: 11, color: '#93C5FD', fontWeight: '600' },

  /* Skeleton */
  skeleton: { borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)' },

  /* Scroll content */
  scroll: { backgroundColor: COLORS.bg, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },

  /* Stats row */
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 10, color: COLORS.muted, marginTop: 2, fontWeight: '500', textAlign: 'center' },

  /* Storage bar */
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  storageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  storageTitleText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  storageValueText: { fontSize: 13, fontWeight: '700', color: COLORS.primaryDark },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F4',
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
  storagePct: {
    fontSize: 12,
    color: COLORS.muted,
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 14,
  },

  /* Plan card */
  planCard: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryMid,
    padding: 18,
  },
  planTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  planTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  planIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planName: { fontSize: 17, fontWeight: '800', color: '#fff' },
  planSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  planBadge: {
    backgroundColor: 'rgba(16,185,129,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.4)',
  },
  planBadgeText: { color: '#6EE7B7', fontSize: 12, fontWeight: '700' },
  planUpgradeNote: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 18,
    marginBottom: 12,
  },
  planBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 30,
  },
  planBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.primaryDark },

  /* Section header */
  sectionHeader: {
    backgroundColor: COLORS.sectionBg,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderText: { fontSize: 11, fontWeight: '700', color: COLORS.primaryDark, letterSpacing: 0.7 },

  /* Rows */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    minHeight: 56,
    backgroundColor: COLORS.card,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowTextWrap: { flex: 1 },
  rowLabel: { fontSize: 15, color: COLORS.text, fontWeight: '500' },
  rowSub: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  rowValue: { fontSize: 13, color: COLORS.muted, marginRight: 8, maxWidth: 130 },
  badge: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  badgeText: { fontSize: 11, color: COLORS.primaryDark, fontWeight: '600' },

  /* Error */
  errorTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginTop: 12 },
  errorSub: { fontSize: 13, color: COLORS.muted, marginTop: 4, textAlign: 'center' },
  retryBtn: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 11,
    borderRadius: 24,
  },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  /* Logout */
  logout: { marginTop: 6, marginBottom: 2 },
  logoutInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 14,
  },
  logoutText: { color: COLORS.danger, fontSize: 16, fontWeight: '600' },
  version: { textAlign: 'center', fontSize: 12, color: COLORS.muted, marginTop: 16 },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10,20,40,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  modalTitleIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  modalLabel: { fontSize: 11, fontWeight: '700', color: COLORS.muted, letterSpacing: 0.6, marginBottom: 8 },
  modalInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F6FC',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalInput: { flex: 1, fontSize: 15, color: COLORS.text },
  modalButtonRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  modalCancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F6FC',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalCancelText: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  modalSaveBtn: {
    flex: 2,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  modalSaveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
