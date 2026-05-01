import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Platform, ActivityIndicator, Alert, RefreshControl, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
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

// ─── QR Modal ─────────────────────────────────────────────────────────────────
interface QRInfo {
    token: string;
    qrData: string;
    mealType: string;
    studentName: string;
    expiresInSec: number;
}

const QRModal = ({ info, onClose }: { info: QRInfo | null; onClose: () => void }) => {
    const [secondsLeft, setSecondsLeft] = useState(info?.expiresInSec ?? 600);

    useEffect(() => {
        if (!info) return;
        setSecondsLeft(info.expiresInSec);
        const interval = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) { clearInterval(interval); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [info]);

    if (!info) return null;

    const mins = Math.floor(secondsLeft / 60);
    const secs = String(secondsLeft % 60).padStart(2, '0');
    const expired = secondsLeft === 0;

    return (
        <Modal transparent animationType="fade" visible={!!info} onRequestClose={onClose}>
            <View style={qrStyles.overlay}>
                <View style={qrStyles.card}>
                    {/* Header */}
                    <View style={qrStyles.header}>
                        <Text style={qrStyles.title}>Show QR to Student</Text>
                        <TouchableOpacity onPress={onClose} style={qrStyles.closeBtn}>
                            <Text style={qrStyles.closeX}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={qrStyles.studentLabel}>
                        🎓 {info.studentName} · {info.mealType}
                    </Text>

                    {/* QR Code */}
                    <View style={qrStyles.qrBox}>
                        {expired ? (
                            <View style={qrStyles.expiredBox}>
                                <Text style={qrStyles.expiredIcon}>⏰</Text>
                                <Text style={qrStyles.expiredText}>QR Expired</Text>
                                <Text style={qrStyles.expiredSub}>Close and tap Consumed again to regenerate.</Text>
                            </View>
                        ) : (
                            <QRCode
                                value={info.qrData}
                                size={200}
                                color="#1a1a2e"
                                backgroundColor="#FFFFFF"
                                logo={undefined}
                            />
                        )}
                    </View>

                    {/* 8-char token shown below QR */}
                    <Text style={qrStyles.orText}>— OR enter code manually —</Text>
                    <View style={qrStyles.tokenRow}>
                        {info.token.split('').map((ch, i) => (
                            <View key={i} style={qrStyles.tokenChar}>
                                <Text style={qrStyles.tokenCharText}>{ch}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Countdown */}
                    <View style={[qrStyles.timerRow, expired && { backgroundColor: '#FFEBEE' }]}>
                        <Text style={[qrStyles.timerText, expired && { color: '#C62828' }]}>
                            {expired ? '⛔ Expired' : `⏱ Expires in ${mins}:${secs}`}
                        </Text>
                    </View>

                    <Text style={qrStyles.instruction}>
                        Ask the student to open Annpurna app → tap "Verify Meal" → enter this code.
                    </Text>

                    <TouchableOpacity style={qrStyles.doneBtn} onPress={onClose}>
                        <Text style={qrStyles.doneBtnText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// ─── Small sub-components ─────────────────────────────────────────────────────
const StatCard = ({ title, value, color }: any) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
);

const BookingRow = ({
    booking,
    onGenerateQR,
}: {
    booking: any;
    onGenerateQR: (bookingId: string, studentName: string, mealType: string) => void;
}) => {
    const [loading, setLoading] = useState(false);

    const handlePress = async () => {
        Alert.alert(
            'Generate QR for Meal',
            `Generate a one-time QR code for ${booking.student?.name || 'this student'}'s ${booking.mealType}?\n\nThe student must scan it to confirm receipt.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Generate QR',
                    onPress: async () => {
                        setLoading(true);
                        await onGenerateQR(
                            booking._id,
                            booking.student?.name || 'Student',
                            booking.mealType
                        );
                        setLoading(false);
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.bookingRow}>
            <UserAvatar name={booking.student?.name || 'A'} size={36} borderWidth={0} />
            <View style={{ width: 10 }} />

            <View style={{ flex: 1 }}>
                <Text style={styles.studentName}>{booking.student?.name || 'Unknown'}</Text>
                <Text style={styles.studentSub}>
                    {booking.student?.phoneNumber || booking.student?.email || '—'}
                </Text>
            </View>

            {booking.status === 'booked' ? (
                <TouchableOpacity
                    style={[styles.consumeBtn, loading && { opacity: 0.6 }]}
                    onPress={handlePress}
                    disabled={loading}
                >
                    {loading
                        ? <ActivityIndicator size="small" color="#FFF" />
                        : <Text style={styles.consumeBtnText}>📲 QR</Text>}
                </TouchableOpacity>
            ) : (
                <View style={[
                    styles.statusBadge,
                    {
                        backgroundColor:
                            booking.status === 'consumed'   ? '#E8F5E9' :
                            booking.status === 'not_consumed' ? '#FFF3E0' : '#FFEBEE'
                    }
                ]}>
                    <Text style={[
                        styles.statusBadgeText,
                        {
                            color:
                                booking.status === 'consumed'   ? '#2E7D32' :
                                booking.status === 'not_consumed' ? '#E65100' : '#C62828'
                        }
                    ]}>
                        {booking.status === 'consumed'   ? '✓ Done'  :
                         booking.status === 'not_consumed' ? 'Missed' : 'Cancelled'}
                    </Text>
                </View>
            )}
        </View>
    );
};

// ─── Meal Section (collapsible) ───────────────────────────────────────────────
const MealSection = ({ section, bookings, onGenerateQR }: any) => {
    const [expanded, setExpanded] = useState(false);

    const total     = bookings.length;
    const consumed  = bookings.filter((b: any) => b.status === 'consumed').length;
    const cancelled = bookings.filter((b: any) => b.status === 'cancelled').length;
    const pending   = total - consumed - cancelled;

    return (
        <View style={[styles.mealSection, { borderLeftColor: section.color }]}>
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

            {expanded && (
                <View style={styles.bookingList}>
                    {total === 0 ? (
                        <Text style={styles.emptyText}>No bookings for {section.type} today.</Text>
                    ) : (
                        bookings.map((b: any) => (
                            <BookingRow key={b._id} booking={b} onGenerateQR={onGenerateQR} />
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
    const [qrInfo, setQrInfo]           = useState<QRInfo | null>(null);
    const socketRef = useRef<any>(null);

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
        socketRef.current = socket;

        socket.on('connect', () => socket.emit('join', user._id.toString()));

        // New booking arrives
        socket.on('newBooking', (booking: any) => {
            setAllBookings(prev => {
                const idx = prev.findIndex(b => b._id === booking._id);
                if (idx >= 0) {
                    const next = [...prev]; next[idx] = booking; return next;
                }
                return [booking, ...prev];
            });
        });

        // Student confirmed via QR — update row to consumed
        socket.on('mealConsumed', ({ bookingId }: any) => {
            setAllBookings(prev =>
                prev.map(b => b._id === bookingId ? { ...b, status: 'consumed' } : b)
            );
            // If the QR modal is open for this booking, close it
            setQrInfo(prev => {
                if (!prev) return prev;
                return prev; // close handled by Done button; leave open so owner sees
            });
        });

        return () => { socket.disconnect(); };
    }, []);

    // ── Generate QR token and open modal ─────────────────────────────────────
    const handleGenerateQR = async (bookingId: string, studentName: string, mealType: string) => {
        try {
            const res = await fetch(`${BASE_URL}/api/meals/generate-qr`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId }),
            });
            const data = await res.json();
            if (!res.ok) {
                Alert.alert('Error', data.message || 'Could not generate QR.');
                return;
            }
            setQrInfo({
                token:       data.token,
                qrData:      data.qrData,
                mealType,
                studentName,
                expiresInSec: data.expiresInSec,
            });
        } catch {
            Alert.alert('Network Error', 'Please try again.');
        }
    };

    const forMeal = (type: string) => allBookings.filter(b => b.mealType === type);

    const totalToday = allBookings.length;
    const consumed   = allBookings.filter(b => b.status === 'consumed').length;
    const pending    = allBookings.filter(b => b.status === 'booked').length;
    const cancelled  = allBookings.filter(b => b.status === 'cancelled').length;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* QR Modal */}
            <QRModal info={qrInfo} onClose={() => setQrInfo(null)} />

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
                                onGenerateQR={handleGenerateQR}
                            />
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// ─── QR Modal Styles ──────────────────────────────────────────────────────────
const qrStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 360,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 6,
    },
    title: {
        flex: 1,
        fontSize: 18,
        fontWeight: '800',
        color: '#1a1a2e',
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeX: { fontSize: 14, color: '#666', fontWeight: '700' },
    studentLabel: {
        fontSize: 13,
        color: '#666',
        marginBottom: 20,
        alignSelf: 'flex-start',
    },
    qrBox: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#F0F0F0',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    expiredBox: {
        width: 200,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    expiredIcon: { fontSize: 48, marginBottom: 8 },
    expiredText: { fontSize: 18, fontWeight: '800', color: '#C62828' },
    expiredSub:  { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 4 },
    orText: {
        fontSize: 11,
        color: '#AAA',
        fontWeight: '600',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    tokenRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 16,
    },
    tokenChar: {
        width: 34,
        height: 44,
        borderRadius: 8,
        backgroundColor: '#1a1a2e',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tokenCharText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 0,
    },
    timerRow: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 30,
        marginBottom: 16,
    },
    timerText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#2E7D32',
    },
    instruction: {
        fontSize: 12,
        color: '#888',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 20,
        paddingHorizontal: 8,
    },
    doneBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 48,
        paddingVertical: 14,
        borderRadius: 30,
        width: '100%',
        alignItems: 'center',
    },
    doneBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
} as any);

// ─── Main Styles ──────────────────────────────────────────────────────────────
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

    qrInfoBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#EDE7F6',
        borderRadius: BorderRadius.md,
        padding: 12,
        gap: 10,
        marginBottom: Spacing.md,
        borderLeftWidth: 4,
        borderLeftColor: '#7C3AED',
    },
    qrInfoIcon:  { fontSize: 22 },
    qrInfoTitle: { fontSize: 13, fontWeight: '800', color: '#4C1D95', marginBottom: 2 },
    qrInfoSub:   { fontSize: 11, color: '#6D28D9', lineHeight: 16 },

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
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center', alignItems: 'center',
        marginRight: Spacing.md,
    },
    actionIcon:     { fontSize: 20 },
    actionTitle:    { fontSize: 15, fontWeight: '700', color: Colors.text },
    actionSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

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
    mealSectionHeader: { flexDirection: 'row', alignItems: 'center', padding: 14 },
    mealEmojiBox: {
        width: 44, height: 44, borderRadius: BorderRadius.sm,
        justifyContent: 'center', alignItems: 'center',
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

    bookingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    studentName: { fontSize: 14, fontWeight: '700', color: Colors.text },
    studentSub:  { fontSize: 11, color: Colors.textLight, marginTop: 1 },
    consumeBtn: {
        backgroundColor: '#7C3AED',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: BorderRadius.sm,
        minWidth: 68,
        alignItems: 'center',
    },
    consumeBtnText: { color: Colors.white, fontSize: 13, fontWeight: '800' },
    statusBadge:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.round },
    statusBadgeText:{ fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
} as any);

export default RestaurantDashboardScreen;
