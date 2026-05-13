import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Alert, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, useThemeColors, Spacing, Typography, BorderRadius } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import KYCWarning from '../../components/KYCWarning';
import UserAvatar from '../../components/UserAvatar';
import { launchImageLibrary } from 'react-native-image-picker';
import { API_BASE_URL } from '../../config';

// ─── Days of week helpers ─────────────────────────────────────────────────────
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TODAY = DAYS_FULL[new Date().getDay()];

const MEAL_ORDER = ['Breakfast', 'Lunch', 'Dinner'];

// ─── Compact Menu Display (used in both sections) ─────────────────────────────
const MenuDisplay = ({ menus, compact = false }: { menus: any[]; compact?: boolean }) => {
    const C = useThemeColors();
    if (!menus || menus.length === 0) {
        return (
            <View style={menuStyles.emptyRow}>
                <Text style={[menuStyles.emptyText, { color: C.textLight }]}>No menu set for this week</Text>
            </View>
        );
    }

    // Group by mealType
    const grouped: Record<string, any[]> = {};
    menus.forEach(m => {
        const meal = m.mealType || 'Other';
        if (!grouped[meal]) grouped[meal] = [];
        grouped[meal].push(...(m.items || []));
    });

    return (
        <View style={menuStyles.container}>
            {MEAL_ORDER.filter(k => grouped[k]).map(mealType => {
                const items = grouped[mealType] || [];
                const MEAL_EMOJI: Record<string, string> = { Breakfast: '🌅', Lunch: '☀️', Dinner: '🌙' };
                return (
                    <View key={mealType} style={menuStyles.mealBlock}>
                        <View style={menuStyles.mealHeader}>
                            <Text style={menuStyles.mealEmoji}>{MEAL_EMOJI[mealType] || '🍽'}</Text>
                            <Text style={[menuStyles.mealLabel, { color: C.textSecondary }]}>{mealType}</Text>
                        </View>
                        <View style={menuStyles.itemsRow}>
                            {items.slice(0, compact ? 3 : 10).map((item: any, i: number) => (
                                <View key={i} style={[menuStyles.chip, { backgroundColor: C.primaryLight }]}>
                                    <Text style={[menuStyles.chipText, { color: C.primaryDark }]} numberOfLines={1}>
                                        {typeof item === 'string' ? item : item.name || '?'}
                                    </Text>
                                </View>
                            ))}
                            {compact && items.length > 3 && (
                                <View style={[menuStyles.chip, { backgroundColor: C.surfaceAlt }]}>
                                    <Text style={[menuStyles.chipText, { color: C.textSecondary }]}>+{items.length - 3}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                );
            })}
        </View>
    );
};

const menuStyles = StyleSheet.create({
    container:  { gap: 10 },
    emptyRow:   { paddingVertical: 12, alignItems: 'center' },
    emptyText:  { fontSize: 13, fontStyle: 'italic' },
    mealBlock:  { gap: 6 },
    mealHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    mealEmoji:  { fontSize: 14 },
    mealLabel:  { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    itemsRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    chip: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BorderRadius.round,
    },
    chipMore: {},
    chipText: { fontSize: 11, fontWeight: '600' },
} as any);

// ─── Default Restaurant Card ──────────────────────────────────────────────────
const DefaultRestaurantCard = ({ restaurantId, navigation }: { restaurantId: string; navigation: any }) => {
    const C = useThemeColors();
    const [restaurant, setRestaurant] = useState<any>(null);
    const [menus, setMenus]           = useState<any[]>([]);
    const [loading, setLoading]       = useState(true);
    const [expanded, setExpanded]     = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                // Get all restaurants and find the matching one
                const [restsRes, menuRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/auth/restaurants`),
                    fetch(`${API_BASE_URL}/api/menu/${restaurantId}?menuType=weekly`),
                ]);
                const rests = await restsRes.json();
                const menuData = await menuRes.json();

                const found = rests.find((r: any) => r._id === restaurantId);
                if (found) setRestaurant(found);

                // Filter for today's day menus
                const todayMenus = Array.isArray(menuData)
                    ? menuData.filter((m: any) => m.dayOfWeek === TODAY || !m.dayOfWeek)
                    : [];
                setMenus(todayMenus);
            } catch (e) {
                console.error('DefaultRestaurantCard error:', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [restaurantId]);

    if (loading) {
        return (
            <View style={[drStyles.card, { backgroundColor: C.surface, borderColor: C.primary + '40' }]}>
                <ActivityIndicator color={C.primary} style={{ paddingVertical: 20 }} />
            </View>
        );
    }

    if (!restaurant) return null;

    const isApproved = restaurant.kycStatus === 'approved';

    return (
        <View style={[drStyles.card, { backgroundColor: C.surface, borderColor: C.primary + '40' }]}>
            {/* Header */}
            <TouchableOpacity style={drStyles.header} onPress={() => setExpanded(e => !e)} activeOpacity={0.8}>
                <View style={[drStyles.iconBox, { backgroundColor: C.primaryLight }]}>
                    <Text style={drStyles.iconEmoji}>🏪</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[drStyles.name, { color: C.text }]} numberOfLines={1}>{restaurant.restaurantName}</Text>
                    <Text style={[drStyles.address, { color: C.textLight }]} numberOfLines={1}>{restaurant.address || restaurant.location || ''}</Text>
                </View>
                <View style={[drStyles.kycBadge, { backgroundColor: isApproved ? C.successLight : C.warningLight }]}>
                    <Text style={[drStyles.kycText, { color: isApproved ? C.success : C.warning }]}>
                        {isApproved ? '✓ Verified' : '⏳ Pending'}
                    </Text>
                </View>
                <Text style={[drStyles.chevron, { color: C.textLight }]}>{expanded ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {expanded && (
                <View style={[drStyles.menuSection, { borderTopColor: C.borderLight }]}>
                    <View style={drStyles.menuTitleRow}>
                        <Text style={[drStyles.menuTitle, { color: C.textSecondary }]}>Today's Menu · {TODAY}</Text>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('ExploreRestaurants', { focusId: restaurantId })}
                        >
                            <Text style={[drStyles.viewAll, { color: C.primary }]}>View Full Menu →</Text>
                        </TouchableOpacity>
                    </View>
                    <MenuDisplay menus={menus} compact={false} />
                </View>
            )}
        </View>
    );
};

const drStyles = StyleSheet.create({
    card: {
        borderRadius: BorderRadius.lg,
        borderWidth: 1.5,
        overflow: 'hidden',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    header: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
    iconBox: {
        width: 44, height: 44, borderRadius: 22,
        justifyContent: 'center', alignItems: 'center',
    },
    iconEmoji:  { fontSize: 22 },
    name:       { fontSize: 15, fontWeight: '800' },
    address:    { fontSize: 12, marginTop: 2 },
    kycBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.round },
    kycText:    { fontSize: 10, fontWeight: '700' },
    chevron:    { fontSize: 12, marginLeft: 4 },
    menuSection: { borderTopWidth: 1, padding: 14 },
    menuTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    menuTitle:    { flex: 1, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    viewAll:      { fontSize: 12, fontWeight: '700' },
} as any);

// ─── Main ProfileScreen ───────────────────────────────────────────────────────
const ProfileScreen = ({ navigation }: any) => {
    const { user, setUser, logout } = useAuth();
    const C = useThemeColors();
    const [uploading, setUploading] = useState(false);

    const isStudent    = user?.role === 'student';
    const displayName  = user?.name || user?.restaurantName || 'Guest';
    const displayEmail = user?.email || '';

    const handleLogout = async () => {
        await logout();
        navigation.replace('Auth');
    };

    // ── Pick & upload profile photo ───────────────────────────────────────────
    const handlePickPhoto = () => {
        launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, async (response) => {
            if (response.didCancel) return;
            if (response.errorCode) { Alert.alert('Error', response.errorMessage || 'Failed to pick image'); return; }
            const asset = response.assets?.[0];
            if (!asset?.uri) return;

            setUploading(true);
            try {
                const formData = new FormData();
                formData.append('image', { uri: asset.uri, type: asset.type || 'image/jpeg', name: asset.fileName || `avatar_${Date.now()}.jpg` } as any);

                const uploadRes  = await fetch(`${API_BASE_URL}/api/upload`, { method: 'POST', body: formData });
                const uploadData = await uploadRes.json();
                if (!uploadRes.ok) throw new Error(uploadData.message || 'Upload failed');
                const photoUrl = uploadData.image;

                const profileRes  = await fetch(`${API_BASE_URL}/api/auth/profile`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
                    body: JSON.stringify({ profilePhoto: photoUrl }),
                });
                const profileData = await profileRes.json();
                if (!profileRes.ok) throw new Error(profileData.message || 'Failed to save photo');

                setUser((prev: any) => ({ ...prev, profilePhoto: photoUrl }));
                Alert.alert('✅ Done', 'Profile photo updated!');
            } catch (err: any) {
                Alert.alert('Error', err.message || 'Something went wrong.');
            } finally {
                setUploading(false);
            }
        });
    };

    const MENU_OPTIONS = [
        { title: 'Personal Information', icon: '👤', route: 'PersonalDetails' },
        {
            title: 'My Subscriptions', icon: '💳',
            subtitle: isStudent
                ? (user?.selectedPlan ? `${user.selectedPlan} · ${user.subscriptionStatus?.toUpperCase()}` : 'No active plan')
                : 'View enrolled students',
            route: isStudent ? 'SubscriptionHistory' : 'MyStudents',
        },
        { title: 'Meal History', icon: '🍽️', route: isStudent ? 'MealHistory' : 'RestaurantMealHistory' },
        ...(!isStudent ? [{ title: 'Financial Analytics', icon: '📈', route: 'RestaurantAnalytics' }] : []),
        { title: 'Help & Support', icon: '❓', route: 'Support' },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: C.background }]} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <View style={{ paddingHorizontal: Spacing.md }}>
                    <KYCWarning />
                </View>

                {/* ── Profile card ────────────────────────────────────── */}
                <View style={[styles.profileCard, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
                    <View style={styles.avatarWrapper}>
                        <UserAvatar
                            photoUrl={user?.profilePhoto}
                            name={displayName}
                            size={96}
                            borderWidth={3}
                            borderColor={Colors.primary}
                        />
                        <TouchableOpacity style={styles.cameraBtn} onPress={handlePickPhoto} disabled={uploading}>
                            {uploading
                                ? <ActivityIndicator size="small" color="#FFF" />
                                : <Text style={{ fontSize: 14 }}>📷</Text>}
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.userName, { color: C.text }]}>{displayName}</Text>
                    <Text style={[styles.userEmail, { color: C.textLight }]}>{displayEmail}</Text>

                    {/* Role pill */}
                    <View style={[styles.rolePill, { backgroundColor: isStudent ? C.primaryLight : '#EDE7F6' }]}>
                        <Text style={[styles.roleText, { color: isStudent ? C.primary : '#6D28D9' }]}>
                            {isStudent ? '🎓 Student' : '🏪 Restaurant Owner'}
                        </Text>
                    </View>

                    <TouchableOpacity style={styles.editPhotoBtn} onPress={handlePickPhoto}>
                        <Text style={styles.editPhotoBtnText}>
                            {user?.profilePhoto ? '📷 Change Photo' : '📷 Add Profile Photo'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* ── Default Restaurant (students only) ──────────────── */}
                {isStudent && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: C.textLight }]}>MY DEFAULT RESTAURANT</Text>
                        </View>
                        {user?.defaultRestaurantId ? (
                            <DefaultRestaurantCard
                                restaurantId={user.defaultRestaurantId.toString()}
                                navigation={navigation}
                            />
                        ) : (
                            <View style={[styles.noRestaurantCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                                <Text style={styles.noRestaurantIcon}>🍽️</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.noRestaurantTitle, { color: C.text }]}>No restaurant selected</Text>
                                    <Text style={[styles.noRestaurantSub, { color: C.textLight }]}>Update your Personal Information to set one</Text>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* ── Explore Restaurants (students only) ─────────────── */}
                {isStudent && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: C.textLight }]}>DISCOVER</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.exploreCard}
                            onPress={() => navigation.navigate('ExploreRestaurants')}
                            activeOpacity={0.85}
                        >
                            <View style={styles.exploreIconBox}>
                                <Text style={{ fontSize: 28 }}>🔍</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.exploreTitle}>Explore All Restaurants</Text>
                                <Text style={styles.exploreSub}>
                                    Browse menus from all partner restaurants
                                </Text>
                            </View>
                            <Text style={styles.exploreArrow}>›</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ── Account menu ────────────────────────────────────── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: C.textLight }]}>ACCOUNT</Text>
                    </View>
                    <View style={[styles.menuCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                        {MENU_OPTIONS.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.menuItem, { borderBottomColor: C.borderLight }, index === MENU_OPTIONS.length - 1 && { borderBottomWidth: 0 }]}
                                onPress={() => navigation.navigate(item.route)}
                            >
                                <View style={[styles.menuIconBox, { backgroundColor: C.surfaceAlt }]}>
                                    <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.menuTitle, { color: C.text }]}>{item.title}</Text>
                                    {item.subtitle && <Text style={[styles.menuSub, { color: C.primary }]}>{item.subtitle}</Text>}
                                </View>
                                <Text style={[styles.menuArrow, { color: C.textLight }]}>›</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* ── Logout ──────────────────────────────────────────── */}
                <TouchableOpacity
                    style={[styles.logoutBtn, { backgroundColor: C.errorLight, borderColor: C.error + '60' }]}
                    onPress={handleLogout}
                >
                    <Text style={[styles.logoutText, { color: C.error }]}>🚪 Log Out</Text>
                </TouchableOpacity>

                <Text style={[styles.version, { color: C.textLight }]}>Annpurna v1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll:    { paddingBottom: 40 },

    // Profile card
    profileCard: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
        paddingHorizontal: Spacing.md,
        borderBottomWidth: 1,
    },
    avatarWrapper:  { position: 'relative', marginBottom: Spacing.md },
    cameraBtn: {
        position: 'absolute', bottom: 0, right: 0,
        width: 30, height: 30, borderRadius: 15,
        backgroundColor: Colors.primary,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#FFF',
    },
    userName:      { fontSize: 22, fontWeight: '800', marginBottom: 4 },
    userEmail:     { fontSize: 13, marginBottom: Spacing.sm },
    rolePill:      { paddingHorizontal: 14, paddingVertical: 5, borderRadius: BorderRadius.round, marginBottom: Spacing.md },
    roleText:      { fontSize: 13, fontWeight: '700' },
    editPhotoBtn:  { paddingHorizontal: 20, paddingVertical: 8, borderRadius: BorderRadius.round, borderWidth: 1.5, borderColor: Colors.primary },
    editPhotoBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },

    // Sections
    section:       { marginTop: Spacing.lg, paddingHorizontal: Spacing.md },
    sectionHeader: { marginBottom: 10 },
    sectionTitle:  { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },

    // No restaurant
    noRestaurantCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        borderRadius: BorderRadius.lg,
        padding: 16,
        borderWidth: 1.5,
        borderStyle: 'dashed',
    },
    noRestaurantIcon:  { fontSize: 28 },
    noRestaurantTitle: { fontSize: 14, fontWeight: '700' },
    noRestaurantSub:   { fontSize: 12, marginTop: 2 },

    // Explore card
    exploreCard: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.lg,
        padding: 16,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    exploreIconBox: {
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center', alignItems: 'center',
    },
    exploreTitle:  { fontSize: 16, fontWeight: '800', color: '#FFFFFF', marginBottom: 2 },
    exploreSub:    { fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 17 },
    exploreArrow:  { fontSize: 28, color: 'rgba(255,255,255,0.7)' },

    // Account menu
    menuCard:   { borderRadius: BorderRadius.lg, borderWidth: 1, overflow: 'hidden' },
    menuItem:   { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1 },
    menuIconBox:{ width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    menuTitle:  { fontSize: 15, fontWeight: '600' },
    menuSub:    { fontSize: 12, fontWeight: '600', marginTop: 2 },
    menuArrow:  { fontSize: 22 },

    // Logout
    logoutBtn:  { marginHorizontal: Spacing.md, marginTop: Spacing.xl, paddingVertical: 15, alignItems: 'center', borderRadius: BorderRadius.lg, borderWidth: 1 },
    logoutText: { fontWeight: '700', fontSize: 15 },
    version:    { textAlign: 'center', fontSize: 11, marginTop: 16 },
} as any);

export default ProfileScreen;
