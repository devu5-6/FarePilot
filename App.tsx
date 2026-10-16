import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Navigation,
  ShieldAlert,
  Zap,
  TrendingUp,
  Clock,
  MapPin,
  Settings,
  Activity,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
} from 'lucide-react-native';
import { SmartPickupService } from './src/services/SmartPickupBridge';
import { DriverSettings, PermissionStatus, TripOffer } from './src/types/trip';

const { width } = Dimensions.get('window');

export default function App() {
  const [activeTab, setActiveTab] = useState<'copilot' | 'settings' | 'history'>('copilot');

  const [permissions, setPermissions] = useState<PermissionStatus>({
    overlayGranted: false,
    accessibilityGranted: false,
    isCoPilotActive: true,
  });

  const [settings, setSettings] = useState<DriverSettings>({
    minRatePerKm: 18.0,
    minRatePerHour: 280.0,
    autoDismissSeconds: 8,
    isCoPilotActive: true,
  });

  const [latestTrip, setLatestTrip] = useState<TripOffer | null>(null);
  const [tripHistory, setTripHistory] = useState<TripOffer[]>([]);

  useEffect(() => {
    checkPermissions();

    const sub = SmartPickupService.subscribeToTrips((trip) => {
      setLatestTrip(trip);
      setTripHistory((prev) => [trip, ...prev.slice(0, 19)]);
    });

    return () => {
      sub.remove();
    };
  }, []);

  const checkPermissions = async () => {
    const res = await SmartPickupService.checkPermissions();
    setPermissions(res);
  };

  const handleToggleCoPilot = (val: boolean) => {
    const updated = { ...settings, isCoPilotActive: val };
    setSettings(updated);
    SmartPickupService.updateSettings(updated);
  };

  const handleUpdateKm = (delta: number) => {
    const newVal = Math.max(10, Math.min(50, settings.minRatePerKm + delta));
    const updated = { ...settings, minRatePerKm: newVal };
    setSettings(updated);
    SmartPickupService.updateSettings(updated);
  };

  const handleUpdateHr = (delta: number) => {
    const newVal = Math.max(100, Math.min(800, settings.minRatePerHour + delta));
    const updated = { ...settings, minRatePerHour: newVal };
    setSettings(updated);
    SmartPickupService.updateSettings(updated);
  };

  const handleSimulate = (platform: string, fare: number, dist: number, time: number) => {
    SmartPickupService.simulateTrip(platform, fare, dist, time);
    // If testing on Web or mock environment, generate locally as well
    if (Platform.OS !== 'android') {
      const ratePerKm = Math.round((fare / dist) * 10) / 10;
      const ratePerHour = Math.round(fare / (time / 60));
      const grade =
        ratePerKm >= settings.minRatePerKm * 1.2
          ? 'EXCELLENT'
          : ratePerKm >= settings.minRatePerKm
          ? 'GOOD'
          : ratePerKm >= settings.minRatePerKm * 0.8
          ? 'AVERAGE'
          : 'POOR';
      const gradeColors = {
        EXCELLENT: '#10B981',
        GOOD: '#06B6D4',
        AVERAGE: '#F59E0B',
        POOR: '#EF4444',
      };

      const mock: TripOffer = {
        id: Date.now().toString(),
        platform: platform as any,
        fare,
        totalKm: dist,
        durationMin: time,
        ratePerKm,
        ratePerHour,
        grade: grade as any,
        gradeColor: gradeColors[grade],
        timestamp: Date.now(),
      };
      setLatestTrip(mock);
      setTripHistory((prev) => [mock, ...prev.slice(0, 19)]);
    }
  };

  // Stats calculation
  const totalAnalyzed = tripHistory.length;
  const profitableTrips = tripHistory.filter(
    (t) => t.grade === 'EXCELLENT' || t.grade === 'GOOD'
  ).length;
  const avgRatePerKm =
    totalAnalyzed > 0
      ? (
          tripHistory.reduce((acc, curr) => acc + curr.ratePerKm, 0) /
          totalAnalyzed
        ).toFixed(1)
      : '0.0';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Top App Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={['#3B82F6', '#8B5CF6']}
              style={styles.logoBadge}
            >
              <Navigation size={18} color="#FFFFFF" />
            </LinearGradient>
            <View>
              <Text style={styles.brandTitle}>SMART PICKUP</Text>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: settings.isCoPilotActive
                        ? '#10B981'
                        : '#64748B',
                    },
                  ]}
                />
                <Text style={styles.statusText}>
                  {settings.isCoPilotActive ? 'Co-Pilot Active' : 'Monitoring Paused'}
                </Text>
              </View>
            </View>
          </View>

          <Switch
            value={settings.isCoPilotActive}
            onValueChange={handleToggleCoPilot}
            trackColor={{ false: '#334155', true: '#3B82F6' }}
            thumbColor={settings.isCoPilotActive ? '#FFFFFF' : '#94A3B8'}
          />
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'copilot' && styles.tabButtonActive]}
            onPress={() => setActiveTab('copilot')}
          >
            <Activity size={16} color={activeTab === 'copilot' ? '#60A5FA' : '#94A3B8'} />
            <Text
              style={[styles.tabText, activeTab === 'copilot' && styles.tabTextActive]}
            >
              Co-Pilot
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'settings' && styles.tabButtonActive]}
            onPress={() => setActiveTab('settings')}
          >
            <Sliders size={16} color={activeTab === 'settings' ? '#60A5FA' : '#94A3B8'} />
            <Text
              style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}
            >
              Targets
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
            onPress={() => setActiveTab('history')}
          >
            <Clock size={16} color={activeTab === 'history' ? '#60A5FA' : '#94A3B8'} />
            <Text
              style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}
            >
              History ({tripHistory.length})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Permission Alert Banners */}
          {(!permissions.overlayGranted || !permissions.accessibilityGranted) && (
            <View style={styles.permissionSection}>
              {!permissions.overlayGranted && (
                <View style={styles.permissionCard}>
                  <ShieldAlert size={20} color="#F59E0B" />
                  <View style={styles.permissionInfo}>
                    <Text style={styles.permissionTitle}>Display Over Other Apps</Text>
                    <Text style={styles.permissionDesc}>
                      Required to show HUD evaluation pills over Uber & Rapido
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.enableBtn}
                    onPress={SmartPickupService.openOverlaySettings}
                  >
                    <Text style={styles.enableBtnText}>Enable</Text>
                  </TouchableOpacity>
                </View>
              )}

              {!permissions.accessibilityGranted && (
                <View style={styles.permissionCard}>
                  <Zap size={20} color="#3B82F6" />
                  <View style={styles.permissionInfo}>
                    <Text style={styles.permissionTitle}>Accessibility Service</Text>
                    <Text style={styles.permissionDesc}>
                      Required to read incoming trip fare and distance
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.enableBtn}
                    onPress={SmartPickupService.openAccessibilitySettings}
                  >
                    <Text style={styles.enableBtnText}>Enable</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {activeTab === 'copilot' && (
            <>
              {/* Test HUD Simulator Strip */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>LIVE HUD SIMULATOR</Text>
                  <Text style={styles.cardSubtitle}>Test Floating Overlay Now</Text>
                </View>
                <Text style={styles.helperText}>
                  Tap any preset below to trigger the floating HUD overlay right on your screen:
                </Text>

                <View style={styles.simButtonsRow}>
                  <TouchableOpacity
                    style={[styles.simButton, { borderColor: '#10B981' }]}
                    onPress={() => handleSimulate('Uber Driver', 185.0, 6.2, 16)}
                  >
                    <Text style={[styles.simButtonBadge, { color: '#10B981' }]}>HIGH PROFIT</Text>
                    <Text style={styles.simButtonMain}>₹185 • 6.2 km</Text>
                    <Text style={styles.simButtonRate}>₹29.8/km</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.simButton, { borderColor: '#F59E0B' }]}
                    onPress={() => handleSimulate('Rapido', 95.0, 5.0, 14)}
                  >
                    <Text style={[styles.simButtonBadge, { color: '#F59E0B' }]}>AVERAGE</Text>
                    <Text style={styles.simButtonMain}>₹95 • 5.0 km</Text>
                    <Text style={styles.simButtonRate}>₹19.0/km</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.simButton, { borderColor: '#EF4444' }]}
                    onPress={() => handleSimulate('Uber Driver', 55.0, 7.8, 22)}
                  >
                    <Text style={[styles.simButtonBadge, { color: '#EF4444' }]}>LOW PROFIT</Text>
                    <Text style={styles.simButtonMain}>₹55 • 7.8 km</Text>
                    <Text style={styles.simButtonRate}>₹7.0/km</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Latest Evaluated Offer Card */}
              {latestTrip ? (
                <View style={[styles.card, styles.heroCard, { borderColor: latestTrip.gradeColor }]}>
                  <View style={styles.heroHeader}>
                    <View style={styles.platformBadge}>
                      <Text style={styles.platformText}>{latestTrip.platform.toUpperCase()}</Text>
                    </View>
                    <View
                      style={[
                        styles.gradePill,
                        { backgroundColor: `${latestTrip.gradeColor}25` },
                      ]}
                    >
                      <Text style={[styles.gradeText, { color: latestTrip.gradeColor }]}>
                        {latestTrip.grade}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metricsContainer}>
                    <View style={styles.metricItem}>
                      <Text style={[styles.metricBigValue, { color: latestTrip.gradeColor }]}>
                        ₹{latestTrip.ratePerKm}
                      </Text>
                      <Text style={styles.metricLabel}>EARNING / KM</Text>
                    </View>

                    <View style={styles.metricDivider} />

                    <View style={styles.metricItem}>
                      <Text style={styles.metricBigValue}>
                        ₹{Math.round(latestTrip.ratePerHour)}
                      </Text>
                      <Text style={styles.metricLabel}>EST. / HOUR</Text>
                    </View>
                  </View>

                  <View style={styles.tripMetaRow}>
                    <View style={styles.metaCol}>
                      <Text style={styles.metaTitle}>TOTAL FARE</Text>
                      <Text style={styles.metaVal}>₹{latestTrip.fare.toFixed(0)}</Text>
                    </View>
                    <View style={styles.metaCol}>
                      <Text style={styles.metaTitle}>DISTANCE</Text>
                      <Text style={styles.metaVal}>{latestTrip.totalKm} km</Text>
                    </View>
                    <View style={styles.metaCol}>
                      <Text style={styles.metaTitle}>DURATION</Text>
                      <Text style={styles.metaVal}>{Math.round(latestTrip.durationMin)} min</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={[styles.card, styles.emptyStateCard]}>
                  <Activity size={36} color="#60A5FA" />
                  <Text style={styles.emptyTitle}>Listening for Incoming Jobs</Text>
                  <Text style={styles.emptyDesc}>
                    Open Uber Driver or Rapido. When a ride ping lands, Smart Pickup will
                    instantly calculate ₹/km and pop up the heads-up display.
                  </Text>
                </View>
              )}

              {/* Shift Stats Card */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>TODAY'S SHIFT METRICS</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{totalAnalyzed}</Text>
                    <Text style={styles.statLabel}>Trips Analyzed</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[styles.statNumber, { color: '#10B981' }]}>
                      {profitableTrips}
                    </Text>
                    <Text style={styles.statLabel}>Profitable Rides</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[styles.statNumber, { color: '#3B82F6' }]}>
                      ₹{avgRatePerKm}
                    </Text>
                    <Text style={styles.statLabel}>Avg ₹ / km</Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {activeTab === 'settings' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>PROFITABILITY THRESHOLDS</Text>
              <Text style={styles.helperText}>
                Customize your minimum acceptable thresholds. Trips will be color-graded based on
                these targets.
              </Text>

              {/* Minimum Rate per KM */}
              <View style={styles.sliderControl}>
                <View style={styles.sliderHeader}>
                  <Text style={styles.sliderTitle}>Target Rate per Km</Text>
                  <Text style={styles.sliderValue}>₹{settings.minRatePerKm.toFixed(0)} / km</Text>
                </View>
                <View style={styles.stepRow}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => handleUpdateKm(-1)}
                  >
                    <Text style={styles.stepBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepDesc}>
                    Offers below ₹{(settings.minRatePerKm * 0.8).toFixed(0)} will be marked POOR
                  </Text>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => handleUpdateKm(1)}
                  >
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Minimum Rate per Hour */}
              <View style={styles.sliderControl}>
                <View style={styles.sliderHeader}>
                  <Text style={styles.sliderTitle}>Target Rate per Hour</Text>
                  <Text style={styles.sliderValue}>₹{settings.minRatePerHour.toFixed(0)} / hr</Text>
                </View>
                <View style={styles.stepRow}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => handleUpdateHr(-20)}
                  >
                    <Text style={styles.stepBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepDesc}>
                    Offers below ₹{(settings.minRatePerHour * 0.8).toFixed(0)} will be marked POOR
                  </Text>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => handleUpdateHr(20)}
                  >
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Supported Platforms */}
              <View style={styles.platformsSection}>
                <Text style={styles.platformsTitle}>SUPPORTED DRIVER PLATFORMS</Text>
                <View style={styles.platformChipRow}>
                  {['Uber Driver', 'Rapido Pilot', 'Ola Driver', 'Zomato', 'Swiggy'].map((p) => (
                    <View key={p} style={styles.platformChip}>
                      <CheckCircle2 size={14} color="#10B981" />
                      <Text style={styles.platformChipText}>{p}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {activeTab === 'history' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>EVALUATED TRIPS FEED</Text>
              {tripHistory.length === 0 ? (
                <Text style={styles.emptyHistory}>No trips evaluated yet.</Text>
              ) : (
                tripHistory.map((trip) => (
                  <View key={trip.id} style={styles.historyItem}>
                    <View style={styles.historyLeft}>
                      <View style={styles.historyTopRow}>
                        <Text style={styles.historyPlatform}>{trip.platform}</Text>
                        <View
                          style={[
                            styles.smallGradePill,
                            { backgroundColor: `${trip.gradeColor}20` },
                          ]}
                        >
                          <Text style={[styles.smallGradeText, { color: trip.gradeColor }]}>
                            {trip.grade}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.historyDetails}>
                        ₹{trip.fare.toFixed(0)} • {trip.totalKm} km • {Math.round(trip.durationMin)} min
                      </Text>
                    </View>

                    <View style={styles.historyRight}>
                      <Text style={[styles.historyRate, { color: trip.gradeColor }]}>
                        ₹{trip.ratePerKm}/km
                      </Text>
                      <Text style={styles.historyHourly}>
                        ₹{Math.round(trip.ratePerHour)}/hr
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
  container: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#0F172A',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: '#1E293B',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabTextActive: {
    color: '#60A5FA',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  permissionSection: {
    gap: 10,
  },
  permissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181E2E',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  permissionDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  enableBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  enableBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#131A29',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  heroCard: {
    borderWidth: 2,
    backgroundColor: '#161F33',
  },
  cardHeader: {
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#60A5FA',
    letterSpacing: 0.8,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 2,
  },
  helperText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 18,
  },
  simButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  simButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  simButtonBadge: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  simButtonMain: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 4,
  },
  simButtonRate: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  platformBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  platformText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  gradePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gradeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  metricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#334155',
  },
  metricBigValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  tripMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 10,
  },
  metaCol: {
    alignItems: 'center',
  },
  metaTitle: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '700',
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F1F5F9',
    marginTop: 2,
  },
  emptyStateCard: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 12,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  statLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  sliderControl: {
    marginTop: 16,
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 12,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#60A5FA',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepDesc: {
    fontSize: 11,
    color: '#94A3B8',
  },
  platformsSection: {
    marginTop: 18,
  },
  platformsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  platformChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  platformChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  platformChipText: {
    fontSize: 12,
    color: '#F1F5F9',
  },
  emptyHistory: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginVertical: 20,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  historyLeft: {
    flex: 1,
  },
  historyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyPlatform: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  smallGradePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  smallGradeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  historyDetails: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 3,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyRate: {
    fontSize: 14,
    fontWeight: '800',
  },
  historyHourly: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
});
