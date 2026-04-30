import React, { useState, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl, SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Header from '../../components/Header';
import UserAvatar from '../../components/UserAvatar';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, BorderRadius } from '../../styles/theme';
import { API_BASE_URL } from '../../config';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Booking {
    _id: string;
    date: string;
    mealType: 'Breakfast' | 'Lunch' | 'Dinner';
    status: 'booked' | 'consumed' | 'cancelled' | 'not_consumed';
    student: { _id: string; name: string; email: string; phoneNumber: string };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { bg: string; fg: string; dot: string; label: string }> = {
    consumed:     { bg: '#E8F5E9', fg: '#2E7D32', dot: '#4CAF50', label: 'CONSUMED' },
    booked:       { bg: '#E3F2FD', fg: '#1565C0', dot: '#42A5F5', label: 'PENDING' },
    cancelled:    { bg: '#FFEBEE', fg: '#C62828', dot: '#F44336', label: 'CANCELLED' },
    not_consumed: { bg: '#FFF8E1', fg: '#E65100', dot: '#FFA726', label: 'MISSED' },
};

const MEAL_META: Record<string, { emoji: string; color: string }> = {
    Breakfast: { emoji: '🌅', color: '#FF9800' },
    Lunch:     { emoji: '☀️',  color: '#4CAF50' },
    Dinner:    { emoji: '🌙', color: '#5C6BC0' },
};

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const fmtDateKey = (iso: string) => {
    const d = new Date(iso);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
};

const fmtDateLabel = (key: string) => {
    const d = new Date(`${key}T00:00:00Z`);
    const today = fmtDateKey(new Date().toISOString());
    const yesterday = fmtDateKey(new Date(Date.now() - 86400000).toISOString());
    if (key === today) return 'Today';
    if (key === yesterday) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
};

// ── Booking Row Card ──────────────────────────────────────────────────────────
const BookingCard = ({ booking }: { booking: Booking }) => {
    const sc  = STATUS_CONFIG[booking.status] || STATUS_CONFIG.booked;
    const mm  = MEAL_META[booking.mealType]   || { emoji: '🍽️', color: '#888' };

    return (
        <View style={styles.card}>
            {/* Meal type stripe */}
            <View style={[styles.mealStripe, { backgroundColor: mm.color + '20' }]}>
                <Text style={styles.mealEmoji}>{mm.emoji}</Text>
                <Text style={[styles.mealType, { color: mm.color }]}>{booking.mealType}</Text>
            </View>

            {/* Student info */}
            <View style={styles.cardBody}>
                <View style={styles.studentRow}>
                    <UserAvatar
                        name={booking.student?.name || 'S'}
                        size={36}
                        borderWidth={0}
                    />
                    <View style={styles.studentInfo}>
                        <Text style={styles.studentName}>{booking.student?.name || 'Unknown'}</Text>
                        <Text style={styles.studentContact}>
                            {booking.student?.phoneNumber || booking.student?.email || '—'}
                        </Text>
                    </View>
                    {/* Status pill */}
                    <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
                        <View style={[styles.statusDot, { backgroundColor: sc.dot }]} />
                        <Text style={[styles.statusText, { color: sc.fg }]}>{sc.label}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
const RestaurantMealHistoryScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const [bookings,   setBookings]   = useState<Booking[]>([]);
    const [loading,    setLoading]    = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter,     setFilter]     = useState<'All' | 'consumed' | 'booked' | 'cancelled' | 'not_consumed'>('All');

    const fetchHistory = useCallback(async () => {
        try {
            const res  = await fetch(`${API_BASE_URL}/api/meals/history/${user._id}`);
            const data = await res.json();
            if (res.ok) setBookings(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('RestaurantHistory error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user._id]);

    useFocusEffect(useCallback(() => { fetchHistory(); }, [fetchHistory]));

    // ── Stats ─────────────────────────────────────────────────────────────────
    const stats = useMemo(() => ({
        total:        bookings.length,
        consumed:     bookings.filter(b => b.status === 'consumed').length,
        pending:      bookings.filter(b => b.status === 'booked').length,
        cancelled:    bookings.filter(b => b.status === 'cancelled').length,
        notConsumed:  bookings.filter(b => b.status === 'not_consumed').length,
    }), [bookings]);

    // ── Filtered + grouped by date ────────────────────────────────────────────
    const sections = useMemo(() => {
        const filtered = filter === 'All' ? bookings : bookings.filter(b => b.status === filter);

        // Group by UTC date key
        const map: Record<string, Booking[]> = {};
        filtered.forEach(b => {
            const key = fmtDateKey(b.date);
            if (!map[key]) map[key] = [];
            map[key].push(b);
        });

        return Object.entries(map)
            .sort(([a], [b]) => b.localeCompare(a)) // newest first
            .map(([key, data]) => ({ title: key, data }));
    }, [bookings, filter]);

    const FILTERS: Array<typeof filter> = ['All', 'consumed', 'booked', 'cancelled', 'not_consumed'];
    const FILTER_LABELS: Record<string, string> = {
        All: 'All', consumed: 'Consumed', booked: 'Pending', cancelled: 'Cancelled', not_consumed: 'Missed',
    };

    return (
        <SafeAreaView style={styles.container}>
            <Header title="Meal History" showBack onBackPress={() => navigation.goBack()} />

            {/* ── Summary stats ── */}
            <View style={styles.statsGrid}>
                <View style={[styles.statCard, { borderTopColor: Colors.primary }]}>
                    <Text style={[styles.statValue, { color: Colors.primary }]}>{stats.total}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={[styles.statCard, { borderTopColor: '#4CAF50' }]}>
                    <Text style={[styles.statValue, { color: '#4CAF50' }]}>{stats.consumed}</Text>
                    <Text style={styles.statLabel}>Served</Text>
                </View>
                <View style={[styles.statCard, { borderTopColor: '#42A5F5' }]}>
                    <Text style={[styles.statValue, { color: '#42A5F5' }]}>{stats.pending}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={[styles.statCard, { borderTopColor: '#FFA726' }]}>
                    <Text style={[styles.statValue, { color: '#FFA726' }]}>{stats.notConsumed}</Text>
                    <Text style={styles.statLabel}>Missed</Text>
                </View>
                <View style={[styles.statCard, { borderTopColor: '#F44336' }]}>
                    <Text style={[styles.statValue, { color: '#F44336' }]}>{stats.cancelled}</Text>
                    <Text style={styles.statLabel}>Cancelled</Text>
                </View>
            </View>

            {/* ── Filter pills ── */}
            <View style={styles.filterRow}>
                {FILTERS.map(f => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterPill, filter === f && styles.filterPillActive]}
                        onPress={() => setFilter(f)}
                    >
                        <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                            {FILTER_LABELS[f]}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* ── Content ── */}
            {loading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
            ) : sections.length === 0 ? (
                <View style={styles.emptyBox}>
                    <Text style={{ fontSize: 48 }}>📋</Text>
                    <Text style={styles.emptyTitle}>No records found</Text>
                    <Text style={styles.emptyDesc}>
                        {filter === 'All'
                            ? 'Meal bookings for your restaurant will appear here.'
                            : `No ${FILTER_LABELS[filter].toLowerCase()} meals found.`}
                    </Text>
                </View>
            ) : (
                <SectionList
                    sections={sections}
                    keyExtractor={item => item._id}
                    renderItem={({ item }) => <BookingCard booking={item} />}
                    renderSectionHeader={({ section }) => (
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>{fmtDateLabel(section.title)}</Text>
                            <Text style={styles.sectionCount}>{section.data.length} meals</Text>
                        </View>
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    stickySectionHeadersEnabled
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); fetchHistory(); }}
                            colors={[Colors.primary]}
                        />
                    }
                    ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                    SectionSeparatorComponent={() => <View style={{ height: 4 }} />}
                />
            )}
        </SafeAreaView>
    );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },

    statsGrid: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.md,
        gap: 8,
    },
    statCard: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        paddingVertical: 10,
        borderTopWidth: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statValue: { fontSize: 20, fontWeight: '900' },
    statLabel: { fontSize: 9, color: Colors.textLight, fontWeight: '700', marginTop: 2, textAlign: 'center' },

    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        gap: 6,
        flexWrap: 'wrap',
    },
    filterPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterPillActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterText:       { fontSize: 12, fontWeight: '700', color: Colors.textLight },
    filterTextActive: { color: '#FFF' },

    listContent: { paddingHorizontal: Spacing.md, paddingBottom: 40 },

    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.background,
        paddingVertical: 10,
    },
    sectionTitle: { fontSize: 13, fontWeight: '800', color: Colors.text },
    sectionCount: { fontSize: 11, color: Colors.textLight, fontWeight: '600' },

    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    mealStripe: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        gap: 8,
    },
    mealEmoji: { fontSize: 16 },
    mealType:  { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },

    cardBody: { paddingHorizontal: 14, paddingBottom: 12 },
    studentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    studentInfo:    { flex: 1 },
    studentName:    { fontSize: 14, fontWeight: '800', color: Colors.text },
    studentContact: { fontSize: 11, color: Colors.textLight, marginTop: 1 },

    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    statusDot:  { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

    emptyBox:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    emptyTitle:{ fontSize: 18, fontWeight: '800', color: Colors.text, marginTop: 16 },
    emptyDesc: { fontSize: 14, color: Colors.textLight, textAlign: 'center', marginTop: 8, lineHeight: 22 },
});

export default RestaurantMealHistoryScreen;
