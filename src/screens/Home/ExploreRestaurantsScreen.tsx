import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, TextInput, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius } from '../../styles/theme';
import { API_BASE_URL } from '../../config';
import UserAvatar from '../../components/UserAvatar';

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TODAY = DAYS_FULL[new Date().getDay()];
const MEAL_ORDER = ['Breakfast', 'Lunch', 'Dinner'];
const MEAL_EMOJI: Record<string, string> = { Breakfast: '🌅', Lunch: '☀️', Dinner: '🌙' };

type DayFilter = 'Today' | 'All Week';

// ─── Inline menu viewer for a restaurant ─────────────────────────────────────
const RestaurantMenuPanel = ({
    restaurantId,
    dayFilter,
}: {
    restaurantId: string;
    dayFilter: DayFilter;
}) => {
    const [menus, setMenus]   = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch_ = async () => {
            try {
                const res  = await fetch(`${API_BASE_URL}/api/menu/${restaurantId}?menuType=weekly`);
                const data = await res.json();
                setMenus(Array.isArray(data) ? data : []);
            } catch { setMenus([]); }
            finally   { setLoading(false); }
        };
        fetch_();
    }, [restaurantId]);

    if (loading) return <ActivityIndicator color={Colors.primary} style={{ marginVertical: 12 }} />;

    // Filter by day
    const filtered = dayFilter === 'Today'
        ? menus.filter(m => m.dayOfWeek === TODAY || !m.dayOfWeek)
        : menus;

    if (filtered.length === 0) {
        return (
            <View style={panelStyles.empty}>
                <Text style={panelStyles.emptyText}>
                    {dayFilter === 'Today'
                        ? `No menu set for ${TODAY}`
                        : 'No weekly menu set yet'}
                </Text>
            </View>
        );
    }

    // Group by mealType, then (for All Week) by dayOfWeek
    const grouped: Record<string, Record<string, any[]>> = {};
    filtered.forEach(m => {
        const meal = m.mealType || 'Other';
        const day  = m.dayOfWeek || 'All';
        if (!grouped[meal]) grouped[meal] = {};
        if (!grouped[meal][day]) grouped[meal][day] = [];
        grouped[meal][day].push(...(m.items || []));
    });

    return (
        <View style={panelStyles.container}>
            {MEAL_ORDER.filter(k => grouped[k]).map(mealType => (
                <View key={mealType} style={panelStyles.mealBlock}>
                    <View style={panelStyles.mealHeader}>
                        <Text style={panelStyles.mealEmoji}>{MEAL_EMOJI[mealType]}</Text>
                        <Text style={panelStyles.mealLabel}>{mealType}</Text>
                    </View>

                    {Object.entries(grouped[mealType]).map(([day, items]) => (
                        <View key={day} style={panelStyles.dayRow}>
                            {dayFilter === 'All Week' && (
                                <Text style={[panelStyles.dayLabel, day === TODAY && panelStyles.dayLabelToday]}>
                                    {day === TODAY ? `${day} (Today)` : day}
                                </Text>
                            )}
                            <View style={panelStyles.chipsRow}>
                                {(items as any[]).map((item: any, i: number) => (
                                    <View key={i} style={panelStyles.chip}>
                                        <Text style={panelStyles.chipText} numberOfLines={1}>
                                            {typeof item === 'string' ? item : item.name || '—'}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))}
                </View>
            ))}
        </View>
    );
};

const panelStyles = StyleSheet.create({
    container:   { paddingTop: 4, gap: 14 },
    empty:       { paddingVertical: 14, alignItems: 'center' },
    emptyText:   { fontSize: 13, color: Colors.textLight, fontStyle: 'italic' },
    mealBlock:   { gap: 6 },
    mealHeader:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    mealEmoji:   { fontSize: 15 },
    mealLabel:   { fontSize: 12, fontWeight: '800', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 },
    dayRow:      { marginBottom: 6 },
    dayLabel:    { fontSize: 11, color: Colors.textLight, fontWeight: '600', marginBottom: 4 },
    dayLabelToday: { color: Colors.primary, fontWeight: '800' },
    chipsRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    chip:        { backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.round },
    chipText:    { fontSize: 12, color: Colors.primaryDark, fontWeight: '600' },
} as any);

// ─── Restaurant Accordion Card ────────────────────────────────────────────────
const RestaurantAccordion = ({
    restaurant,
    dayFilter,
    defaultOpen,
}: {
    restaurant: any;
    dayFilter: DayFilter;
    defaultOpen?: boolean;
}) => {
    const [open, setOpen] = useState(defaultOpen ?? false);

    const isApproved = restaurant.kycStatus === 'approved';

    return (
        <View style={cardStyles.card}>
            <TouchableOpacity
                style={cardStyles.header}
                onPress={() => setOpen(o => !o)}
                activeOpacity={0.8}
            >
                {/* Avatar/initial */}
                <UserAvatar
                    photoUrl={restaurant.profilePhoto}
                    name={restaurant.restaurantName}
                    size={48}
                />

                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={cardStyles.name} numberOfLines={1}>{restaurant.restaurantName}</Text>
                    <Text style={cardStyles.address} numberOfLines={1}>
                        {restaurant.address || restaurant.location || 'Location not set'}
                    </Text>
                    {restaurant.specifications && (
                        <Text style={cardStyles.spec} numberOfLines={1}>{restaurant.specifications}</Text>
                    )}
                </View>

                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <View style={[cardStyles.badge, { backgroundColor: isApproved ? '#DCFCE7' : '#FEF3C7' }]}>
                        <Text style={[cardStyles.badgeText, { color: isApproved ? '#16A34A' : '#D97706' }]}>
                            {isApproved ? '✓ Verified' : '⏳ Pending'}
                        </Text>
                    </View>
                    <Text style={cardStyles.chevron}>{open ? '▲' : '▼ See Menu'}</Text>
                </View>
            </TouchableOpacity>

            {open && (
                <View style={cardStyles.body}>
                    <View style={cardStyles.bodyDivider} />
                    <RestaurantMenuPanel
                        restaurantId={restaurant._id}
                        dayFilter={dayFilter}
                    />
                </View>
            )}
        </View>
    );
};

const cardStyles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    header:       { flexDirection: 'row', alignItems: 'center', padding: 14 },
    name:         { fontSize: 15, fontWeight: '800', color: Colors.text },
    address:      { fontSize: 12, color: Colors.textLight, marginTop: 2 },
    spec:         { fontSize: 11, color: Colors.textSecondary, fontStyle: 'italic', marginTop: 2 },
    badge:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.round },
    badgeText:    { fontSize: 10, fontWeight: '700' },
    chevron:      { fontSize: 11, color: Colors.primary, fontWeight: '700' },
    body:         { paddingHorizontal: 14, paddingBottom: 14 },
    bodyDivider:  { height: 1, backgroundColor: Colors.borderLight, marginBottom: 12 },
} as any);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const ExploreRestaurantsScreen = ({ navigation, route }: any) => {
    const focusId = route?.params?.focusId as string | undefined;

    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [loading, setLoading]         = useState(true);
    const [refreshing, setRefreshing]   = useState(false);
    const [search, setSearch]           = useState('');
    const [dayFilter, setDayFilter]     = useState<DayFilter>('Today');

    const fetchRestaurants = useCallback(async () => {
        try {
            const res  = await fetch(`${API_BASE_URL}/api/auth/restaurants`);
            const data = await res.json();
            if (Array.isArray(data)) {
                // Sort: approved first, then alphabetically
                setRestaurants(
                    data.sort((a, b) => {
                        if (a.kycStatus === 'approved' && b.kycStatus !== 'approved') return -1;
                        if (b.kycStatus === 'approved' && a.kycStatus !== 'approved') return  1;
                        return (a.restaurantName || '').localeCompare(b.restaurantName || '');
                    })
                );
            }
        } catch (e) {
            console.error('ExploreRestaurants fetch error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchRestaurants(); }, []);

    const filtered = restaurants.filter(r =>
        !search || r.restaurantName?.toLowerCase().includes(search.toLowerCase()) ||
        r.address?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Explore Restaurants</Text>
                <View style={{ width: 60 }} />
            </View>

            {/* Hero bar */}
            <View style={styles.heroBanner}>
                <Text style={styles.heroTitle}>🍽️ Discover menus</Text>
                <Text style={styles.heroSub}>
                    Browse what's cooking at all Annpurna partner restaurants
                </Text>
            </View>

            {/* Search + Day filter */}
            <View style={styles.controlsRow}>
                <View style={styles.searchBox}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search restaurants…"
                        placeholderTextColor={Colors.textLight}
                        value={search}
                        onChangeText={setSearch}
                        returnKeyType="search"
                    />
                    {!!search && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Text style={styles.clearBtn}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Day toggle */}
            <View style={styles.dayToggle}>
                {(['Today', 'All Week'] as DayFilter[]).map(d => (
                    <TouchableOpacity
                        key={d}
                        style={[styles.dayBtn, dayFilter === d && styles.dayBtnActive]}
                        onPress={() => setDayFilter(d)}
                    >
                        <Text style={[styles.dayBtnText, dayFilter === d && styles.dayBtnTextActive]}>
                            {d === 'Today' ? `📅 Today (${TODAY})` : '📆 Full Week'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Restaurant list */}
            {loading ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Loading restaurants…</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); fetchRestaurants(); }}
                            colors={[Colors.primary]}
                        />
                    }
                >
                    {filtered.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <Text style={styles.emptyIcon}>🏪</Text>
                            <Text style={styles.emptyTitle}>No restaurants found</Text>
                            <Text style={styles.emptySub}>
                                {search ? 'Try a different search term.' : 'No partner restaurants yet.'}
                            </Text>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.countLabel}>
                                {filtered.length} restaurant{filtered.length !== 1 ? 's' : ''}
                            </Text>
                            {filtered.map(r => (
                                <RestaurantAccordion
                                    key={r._id}
                                    restaurant={r}
                                    dayFilter={dayFilter}
                                    defaultOpen={r._id === focusId}
                                />
                            ))}
                        </>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.md, paddingVertical: 12,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    backBtn:     { width: 60 },
    backText:    { fontSize: 15, color: Colors.primary, fontWeight: '700' },
    headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },

    heroBanner: {
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.md,
        paddingVertical: 16,
    },
    heroTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', marginBottom: 4 },
    heroSub:   { fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 18 },

    controlsRow: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: 8 },
    searchBox: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: 14,
        borderWidth: 1, borderColor: Colors.border,
        gap: 8,
    },
    searchIcon:  { fontSize: 16 },
    searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: Colors.text },
    clearBtn:    { fontSize: 14, color: Colors.textLight, fontWeight: '700', paddingHorizontal: 4 },

    dayToggle: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.sm,
        gap: 8,
    },
    dayBtn: {
        flex: 1, paddingVertical: 9, borderRadius: BorderRadius.md,
        backgroundColor: Colors.surface,
        borderWidth: 1, borderColor: Colors.border,
        alignItems: 'center',
    },
    dayBtnActive:     { backgroundColor: Colors.primary, borderColor: Colors.primary },
    dayBtnText:       { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
    dayBtnTextActive: { color: '#FFFFFF' },

    list:        { flex: 1 },
    listContent: { paddingHorizontal: Spacing.md, paddingBottom: 40 },
    countLabel:  { fontSize: 11, color: Colors.textLight, fontWeight: '700', marginBottom: 10, letterSpacing: 0.5 },

    loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingText: { fontSize: 14, color: Colors.textSecondary },

    emptyBox:   { paddingVertical: 60, alignItems: 'center', gap: 8 },
    emptyIcon:  { fontSize: 52 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
    emptySub:   { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
} as any);

export default ExploreRestaurantsScreen;
