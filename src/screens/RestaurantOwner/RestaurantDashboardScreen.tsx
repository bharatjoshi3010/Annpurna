import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Platform, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, BorderRadius } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import KYCWarning from '../../components/KYCWarning';
import { io } from 'socket.io-client';
import { API_BASE_URL as BASE_URL } from '../../config';
import UserAvatar from '../../components/UserAvatar';

const MEAL_SECTIONS = [
    { type: 'Breakfast', emoji: '🌅', time: '08:00 – 10:30 AM', color: '#FF9800', bg: '#FFF3E0' },
    { type: 'Lunch',     emoji: '☀️', time: '12:30 – 03:30 PM', color: '#4CAF50', bg: '#E8F5E9' },
    { type: 'Dinner',   emoji: '🌙', time: '07:30 – 10:30 PM', color: '#5C6BC0', bg: '#EDE7F6' },
];

// ─── Small sub-components ─────────────────────────────────────────────────────
const StatCard = ({ title, value, color }: any) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
);

const BookingRow = ({ booking, onConsume }: { booking: any; onConsume: (id: string) => void }) => {
    const [loading, setLoading] = useState(false);

    const handleConsume = async () => {
        Alert.alert(
            'Mark as Consumed',
            `Confirm that ${booking.student?.name} has received their meal?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        setLoading(true);
                        await onConsume(booking._id);
                        setLoading(false);
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.bookingRow}>
            {/* Student initial avatar */}
            <UserAvatar
                name={booking.student?.name || 'A'}
                size={36}
                borderWidth={0}
            />
            <View style={{ width: 10 }} />

            {/* Student info */}
            <View style={{ flex: 1 }}>
                <Text style={styles.studentName}>{booking.student?.name || 'Unknown'}</Text>
                <Text style={styles.studentSub}>{booking.student?.phoneNumber || booking.student?.email || '—'}</Text>
            </View>

            {/* Status / Consume button */}
            {booking.status === 'booked' ? (
                <TouchableOpacity
                    style={[styles.consumeBtn, loading && { opacity: 0.6 }]}
                    onPress={handleConsume}
                    disabled={loading}
                >
                    {loading
                        ? <ActivityIndicator size="small" color="#FFF" />
                        : <Text style={styles.consumeBtnText}>✓ Consumed</Text>}
                </TouchableOpacity>
            ) : (
                <View style={[
                    styles.statusBadge,
                    { 
                        backgroundColor: booking.status === 'consumed' ? '#E8F5E9' : 
                                         booking.status === 'not_consumed' ? '#FFF3E0' : '#FFEBEE' 
                    }
                ]}>
                    <Text style={[
                        styles.statusBadgeText,
                        { 
                            color: booking.status === 'consumed' ? '#2E7D32' : 
                                   booking.status === 'not_consumed' ? '#E65100' : '#C62828' 
                        }
                    ]}>
                        {booking.status === 'consumed' ? 'Done' : 
                         booking.status === 'not_consumed' ? 'Not Consumed' : 'Cancelled'}
                    </Text>
                </View>
            )}
        </View>
    );
};

// ─── Meal Section (collapsible) ───────────────────────────────────────────────
const MealSection = ({ section, bookings, onConsume }: any) => {
    const [expanded, setExpanded] = useState(false);

    const total     = bookings.length;
    const consumed  = bookings.filter((b: any) => b.status === 'consumed').length;
    const cancelled = bookings.filter((b: any) => b.status === 'cancelled').length;
    const pending   = total - consumed - cancelled;

    return (
        <View style={[styles.mealSection, { borderLeftColor: section.color }]}>
            {/* Header — tap to expand */}
            <TouchableOpacity
                style={styles.mealSectionHeader}
                onPress={() => setExpanded(e => !e)}
                activeOpacity={0.75}
            >
                <View style={[styles.mealEmojiBox, { backgroundColor: section.bg }]}>
                    <Text style={styles.mealEmoji}>{section.emoji}</Text>
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.mealSectionTitle}>{section.type}</Text>
                    <Text style={styles.mealSectionTime}>{section.time}</Text>
                </View>

                {/* Quick count pills */}
                <View style={styles.countRow}>
                    <View style={[styles.countPill, { backgroundColor: '#E3F2FD' }]}>
                        <Text style={[styles.countText, { color: '#1565C0' }]}>{total} total</Text>
                    </View>
                    {pending > 0 && (
                        <View style={[styles.countPill, { backgroundColor: '#FFF3E0' }]}>
                            <Text style={[styles.countText, { color: '#E65100' }]}>{pending} pending</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {/* Student list */}
            {expanded && (
                <View style={styles.bookingList}>
                    {total === 0 ? (
                        <Text style={styles.emptyText}>No bookings for {section.type} today.</Text>
                    ) : (
                        bookings.map((b: any) => (
                            <BookingRow key={b._id} booking={b} onConsume={onConsume} />
                        ))
                    )}
                </View>
            )}
        </View>
    );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const RestaurantDashboardScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const [allBookings, setAllBookings] = useState<any[]>([]);
    const [loading, setLoading]         = useState(true);
    const [refreshing, setRefreshing]   = useState(false);
    const displayName = user?.restaurantName || user?.ownerName || 'Restaurant';

    const fetchBookings = useCallback(async () => {
        try {
            const res  = await fetch(`${BASE_URL}/api/meals/incoming/${user._id}`);
            const data = await res.json();
            if (res.ok) setAllBookings(data);
        } catch (err) {
            console.error('Fetch bookings error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user._id]);

    useEffect(() => {
        fetchBookings();

        const socket = io(BASE_URL);
        socket.on('connect', () => socket.emit('join', user._id.toString()));

        socket.on('newBooking', (booking: any) => {
            setAllBookings(prev => {
                // replace or prepend
                const idx = prev.findIndex(b => b._id === booking._id);
                if (idx >= 0) {
                    const next = [...prev];
                    next[idx] = booking;
                    return next;
                }
                return [booking, ...prev];
            });
        });

        return () => { socket.disconnect(); };
    }, []);

    const handleConsume = async (bookingId: string) => {
        try {
            const res = await fetch(`${BASE_URL}/api/meals/consume`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId }),
            });
            if (res.ok) {
                setAllBookings(prev =>
                    prev.map(b => b._id === bookingId ? { ...b, status: 'consumed' } : b)
                );
            } else {
                Alert.alert('Error', 'Could not mark as consumed.');
            }
        } catch {
            Alert.alert('Network Error', 'Please try again.');
        }
    };

    // Split by meal type
    const forMeal = (type: string) => allBookings.filter(b => b.mealType === type);

    // Overall stats
    const totalToday = allBookings.length;
    const consumed   = allBookings.filter(b => b.status === 'consumed').length;
    const pending    = allBookings.filter(b => b.status === 'booked').length;
    const cancelled  = allBookings.filter(b => b.status === 'cancelled').length;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchBookings(); }}
                        colors={[Colors.primary]}
                    />
                }
            >
                <KYCWarning />

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.titleRow}>
                        <View>
                            <Text style={Typography.h1}>{displayName}</Text>
                            <Text style={styles.subtitle}>Welcome back, {user?.ownerName || 'Owner'}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.profileBadge}
                            onPress={() => navigation.navigate('ProfileTab')}
                        >
                            <UserAvatar
                                photoUrl={user?.profilePhoto}
                                name={user?.ownerName || user?.restaurantName || 'R'}
                                size={48}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Summary stats */}
                <View style={styles.statsRow}>
                    <StatCard title="Total Today"  value={totalToday} color={Colors.primary} />
                    <StatCard title="Pending"      value={pending}    color="#FF9800" />
                    <StatCard title="Consumed"     value={consumed}   color="#4CAF50" />
                    <StatCard title="Cancelled"    value={cancelled}  color="#F44336" />
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('ManageMenu')}
                    >
                        <View style={styles.actionIconContainer}>
                            <Text style={styles.actionIcon}>📋</Text>
                        </View>
                        <View>
                            <Text style={styles.actionTitle}>Manage Menu</Text>
                            <Text style={styles.actionSubtitle}>Weekly routine & daily specials</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Meal Sections */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>TODAY'S BOOKINGS</Text>
                    {loading ? (
                        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 30 }} />
                    ) : (
                        MEAL_SECTIONS.map(section => (
                            <MealSection
                                key={section.type}
                                section={section}
                                bookings={forMeal(section.type)}
                                onConsume={handleConsume}
                            />
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container:     { flex: 1, backgroundColor: Colors.background },
    scrollContent: { padding: Spacing.md, paddingBottom: 40 },

    header:   { marginBottom: Spacing.lg },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    subtitle: { fontSize: 13, color: Colors.textLight, marginTop: 3 },
    profileBadge: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: Colors.primaryLight,
    },

    statsRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
    statCard: {
        flex: 1,
        backgroundColor: Colors.surface,
        padding: 12,
        borderRadius: BorderRadius.md,
        borderLeftWidth: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 3,
    },
    statTitle: { fontSize: 10, fontWeight: '700', color: Colors.textLight, marginBottom: 4, letterSpacing: 0.5 },
    statValue: { fontSize: 24, fontWeight: '900' },

    section:      { marginTop: Spacing.lg },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.5,
        color: Colors.textLight,
        textTransform: 'uppercase',
        marginBottom: 10,
    },

    actionCard: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
    },
    actionIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    actionIcon:     { fontSize: 20 },
    actionTitle:    { fontSize: 15, fontWeight: '700', color: Colors.text },
    actionSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

    // Meal section cards
    mealSection: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    mealSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    mealEmojiBox: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mealEmoji:        { fontSize: 22 },
    mealSectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text },
    mealSectionTime:  { fontSize: 11, color: Colors.textLight, marginTop: 1 },
    countRow: { flexDirection: 'row', gap: 4, marginRight: 8 },
    countPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.round },
    countText: { fontSize: 10, fontWeight: '700' },
    chevron:   { fontSize: 14, color: Colors.textLight },

    bookingList: {
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
        paddingHorizontal: 14,
        paddingBottom: 12,
    },
    emptyText: { fontSize: 13, color: Colors.textLight, textAlign: 'center', paddingVertical: 16 },

    // Booking row
    bookingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    avatarCircle:  { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
    avatarLetter:  { fontSize: 16, fontWeight: '800', color: Colors.primary },
    studentName:   { fontSize: 14, fontWeight: '700', color: Colors.text },
    studentSub:    { fontSize: 11, color: Colors.textLight, marginTop: 1 },
    consumeBtn: {
        backgroundColor: Colors.success,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: BorderRadius.sm,
        minWidth: 95,
        alignItems: 'center',
    },
    consumeBtnText: { color: Colors.white, fontSize: 12, fontWeight: '800' },
    statusBadge:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.round },
    statusBadgeText:{ fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
} as any);




export default RestaurantDashboardScreen;
