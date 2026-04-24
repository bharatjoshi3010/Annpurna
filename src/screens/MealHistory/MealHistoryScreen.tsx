/**
 * MealHistoryScreen.tsx
 *
 * Displays a subscription-month calendar where each day is colour-coded by
 * how many meals were consumed:
 *   3 consumed → deep green
 *   2 consumed → medium green
 *   1 consumed → very light green
 *   0 / no booking → white / faint grey
 *
 * Tapping any day opens a bottom sheet with the list of that day's meals
 * (meal type, restaurant, status).
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    TouchableOpacity, Modal, Platform, RefreshControl,
    FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Typography } from '../../styles/theme';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Booking {
    _id: string;
    date: string;
    mealType: 'Breakfast' | 'Lunch' | 'Dinner';
    status: 'booked' | 'consumed' | 'cancelled' | 'not_consumed';
    restaurant: { restaurantName: string; address?: string };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
];

const toDateKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate();

// Green shading by consumed count
const dayBgColor = (consumed: number, total: number): string => {
    if (total === 0) return 'transparent';
    if (consumed === 3) return '#166534'; // deep green  — all 3
    if (consumed === 2) return '#4CAF50'; // medium green — 2/3
    if (consumed === 1) return '#A8D5B5'; // very light green — 1/3
    return '#F5F5F5'; // had bookings but none consumed
};

const dayTextColor = (consumed: number): string => {
    if (consumed >= 2) return '#FFFFFF';
    if (consumed === 1) return '#166534';
    return Colors.text;
};

// Status pill colour
const statusColor = (status: string) => {
    switch (status) {
        case 'consumed':     return { bg: '#E8F5E9', text: '#2E7D32' };
        case 'booked':       return { bg: '#E3F2FD', text: '#1565C0' };
        case 'cancelled':    return { bg: '#FFEBEE', text: '#C62828' };
        case 'not_consumed': return { bg: '#FFF8E1', text: '#F57F17' };
        default:             return { bg: '#F5F5F5', text: '#666'    };
    }
};

const mealEmoji = (type: string) =>
    type === 'Breakfast' ? '🍳' : type === 'Lunch' ? '🍱' : '🌙';

// ── Component ─────────────────────────────────────────────────────────────────
const MealHistoryScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const [bookings,   setBookings]   = useState<Booking[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    // Subscription period navigation
    const [viewYear,  setViewYear]  = useState(new Date().getFullYear());
    const [viewMonth, setViewMonth] = useState(new Date().getMonth());

    const fetchHistory = async () => {
        if (!user?._id) return;
        try {
            const base = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
            const res  = await fetch(`${base}/api/meals/student/${user._id}`);
            const data = await res.json();
            if (res.ok) setBookings(data);
        } catch (e) {
            console.error('MealHistory fetch error:', e);
        }
    };

    useFocusEffect(useCallback(() => { fetchHistory(); }, [user?._id]));

    const onRefresh = async () => { setRefreshing(true); await fetchHistory(); setRefreshing(false); };

    // ── Group bookings by date key ────────────────────────────────────────────
    const byDay = useMemo(() => {
        const map: Record<string, Booking[]> = {};
        bookings.forEach(b => {
            const key = toDateKey(new Date(b.date));
            if (!map[key]) map[key] = [];
            map[key].push(b);
        });
        return map;
    }, [bookings]);

    // ── Calendar grid for viewMonth/viewYear ─────────────────────────────────
    const calendarDays = useMemo(() => {
        const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        const cells: (Date | null)[] = Array(firstDay).fill(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));
        // Pad to full rows
        while (cells.length % 7 !== 0) cells.push(null);
        return cells;
    }, [viewYear, viewMonth]);

    // ── Subscription period bounds ────────────────────────────────────────────
    const subStart = user?.subscriptionDate ? new Date(user.subscriptionDate) : null;
    const subEnd   = user?.subscriptionEndDate ? new Date(user.subscriptionEndDate) : null;

    const isInSubscription = (d: Date) => {
        if (!subStart) return true; // no sub info — show everything
        if (d < subStart) return false;
        if (subEnd && d > subEnd) return false;
        return true;
    };

    // ── Month navigation ──────────────────────────────────────────────────────
    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        const now = new Date();
        if (viewYear > now.getFullYear() || (viewYear === now.getFullYear() && viewMonth >= now.getMonth())) return;
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    // ── Day detail data ───────────────────────────────────────────────────────
    const selectedDayBookings = selectedDay
        ? (byDay[toDateKey(selectedDay)] || [])
        : [];

    const today = new Date();

    return (
        <SafeAreaView style={styles.container}>
            <Header
                title="Meal History"
                showBack
                onBackPress={() => navigation.goBack()}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
            >
                {/* ── Subscription info card ──────────────────────────── */}
                {subStart && (
                    <View style={styles.subCard}>
                        <View style={styles.subCardTop}>
                            <View>
                                <Text style={styles.subPlanLabel}>ACTIVE PLAN</Text>
                                <Text style={styles.subPlanName}>
                                    {user?.selectedPlan || 'Subscription'}
                                </Text>
                            </View>
                            <View style={[
                                styles.subStatusPill,
                                { backgroundColor: user?.subscriptionStatus === 'active' ? '#E8F5E9' : '#FFEBEE' }
                            ]}>
                                <View style={[styles.subDot, { backgroundColor: user?.subscriptionStatus === 'active' ? '#4CAF50' : '#F44336' }]} />
                                <Text style={[styles.subStatusText, { color: user?.subscriptionStatus === 'active' ? '#2E7D32' : '#C62828' }]}>
                                    {(user?.subscriptionStatus || 'inactive').toUpperCase()}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.subDatesRow}>
                            <View style={styles.subDateItem}>
                                <Text style={styles.subDateLabel}>START DATE</Text>
                                <Text style={styles.subDateValue}>
                                    {subStart.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </Text>
                            </View>
                            <View style={styles.subDateDivider} />
                            <View style={styles.subDateItem}>
                                <Text style={styles.subDateLabel}>END DATE</Text>
                                <Text style={[styles.subDateValue, !subEnd && { color: Colors.textLight }]}>
                                    {subEnd
                                        ? subEnd.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                        : 'No expiry'}
                                </Text>
                            </View>
                            {subEnd && (() => {
                                const today2 = new Date();
                                const daysLeft = Math.max(0, Math.ceil((subEnd.getTime() - today2.getTime()) / (1000 * 60 * 60 * 24)));
                                const totalDays = Math.ceil((subEnd.getTime() - subStart.getTime()) / (1000 * 60 * 60 * 24));
                                const progress = Math.max(0, Math.min(1, 1 - daysLeft / totalDays));
                                return (
                                    <View style={styles.subDateItem}>
                                        <Text style={styles.subDateLabel}>DAYS LEFT</Text>
                                        <Text style={[styles.subDateValue, { color: daysLeft <= 5 ? '#F44336' : Colors.text }]}>
                                            {daysLeft}d
                                        </Text>
                                    </View>
                                );
                            })()}
                        </View>

                        {subEnd && (() => {
                            const today2 = new Date();
                            const daysLeft = Math.max(0, Math.ceil((subEnd.getTime() - today2.getTime()) / (1000 * 60 * 60 * 24)));
                            const totalDays = Math.ceil((subEnd.getTime() - subStart.getTime()) / (1000 * 60 * 60 * 24));
                            const progress = Math.max(0, Math.min(1, 1 - daysLeft / totalDays));
                            return (
                                <View style={styles.progressWrap}>
                                    <View style={styles.progressTrack}>
                                        <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
                                    </View>
                                    <Text style={styles.progressLabel}>{Math.round(progress * 100)}% used</Text>
                                </View>
                            );
                        })()}
                    </View>
                )}

                {/* ── Calendar card ────────────────────────────────────────── */}
                <View style={styles.calendarCard}>

                    {/* Month header + nav */}
                    <View style={styles.monthNav}>
                        <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
                            <Text style={styles.navArrow}>‹</Text>
                        </TouchableOpacity>
                        <Text style={styles.monthTitle}>
                            {MONTH_NAMES[viewMonth]} {viewYear}
                        </Text>
                        <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
                            <Text style={styles.navArrow}>›</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Day-of-week labels */}
                    <View style={styles.weekRow}>
                        {DAY_NAMES.map(d => (
                            <Text key={d} style={styles.weekLabel}>{d}</Text>
                        ))}
                    </View>

                    {/* Calendar grid */}
                    <View style={styles.gridWrap}>
                        {calendarDays.map((day, i) => {
                            if (!day) return <View key={`empty-${i}`} style={styles.dayCell} />;

                            const key      = toDateKey(day);
                            const dayBooks = byDay[key] || [];
                            const consumed = dayBooks.filter(b => b.status === 'consumed').length;
                            const inSub    = isInSubscription(day);
                            const isFuture = day > today;
                            const isToday  = isSameDay(day, today);
                            const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;

                            const bg   = (!inSub || isFuture) ? 'transparent' : dayBgColor(consumed, dayBooks.length);
                            const txtC = (!inSub || isFuture) ? '#CCC'        : dayTextColor(consumed);

                            return (
                                <TouchableOpacity
                                    key={key}
                                    style={[
                                        styles.dayCell,
                                        { backgroundColor: bg },
                                        isToday    && styles.todayCell,
                                        isSelected && styles.selectedCell,
                                        (!inSub || isFuture) && styles.disabledCell,
                                    ]}
                                    onPress={() => {
                                        if (!inSub || isFuture) return;
                                        setSelectedDay(day);
                                    }}
                                    activeOpacity={(!inSub || isFuture) ? 1 : 0.75}
                                >
                                    <Text style={[styles.dayNum, { color: isSelected ? '#FFF' : txtC }]}>
                                        {day.getDate()}
                                    </Text>
                                    {/* Meal dots */}
                                    {inSub && !isFuture && dayBooks.length > 0 && (
                                        <View style={styles.dotsRow}>
                                            {(['Breakfast','Lunch','Dinner'] as const).map(mt => {
                                                const b = dayBooks.find(x => x.mealType === mt);
                                                if (!b) return null;
                                                const dotColor =
                                                    b.status === 'consumed'     ? '#4CAF50'
                                                  : b.status === 'cancelled'    ? '#F44336'
                                                  : b.status === 'not_consumed' ? '#FFC107'
                                                  : '#90CAF9';
                                                return (
                                                    <View
                                                        key={mt}
                                                        style={[styles.dot, { backgroundColor: consumed >= 2 ? 'rgba(255,255,255,0.7)' : dotColor }]}
                                                    />
                                                );
                                            })}
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Legend */}
                    <View style={styles.legend}>
                        {[
                            { color: '#166534', label: '3 meals' },
                            { color: '#4CAF50', label: '2 meals' },
                            { color: '#A8D5B5', label: '1 meal'  },
                            { color: '#F5F5F5', label: 'Skipped' },
                        ].map(l => (
                            <View key={l.label} style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: l.color, borderWidth: l.color === '#F5F5F5' ? 1 : 0, borderColor: '#DDD' }]} />
                                <Text style={styles.legendLabel}>{l.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* ── Selected day detail ──────────────────────────────────── */}
                {selectedDay && (
                    <View style={styles.detailCard}>
                        <Text style={styles.detailTitle}>
                            {selectedDay.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </Text>

                        {selectedDayBookings.length === 0 ? (
                            <View style={styles.noMealsBox}>
                                <Text style={styles.noMealsIcon}>🍽️</Text>
                                <Text style={styles.noMealsText}>No meal records for this day</Text>
                            </View>
                        ) : (
                            selectedDayBookings
                                .sort((a, b) => {
                                    const order = { Breakfast: 0, Lunch: 1, Dinner: 2 };
                                    return order[a.mealType] - order[b.mealType];
                                })
                                .map(b => {
                                    const sc = statusColor(b.status);
                                    return (
                                        <View key={b._id} style={styles.mealRow}>
                                            <View style={styles.mealRowLeft}>
                                                <Text style={styles.mealEmoji}>{mealEmoji(b.mealType)}</Text>
                                                <View style={styles.mealInfo}>
                                                    <Text style={styles.mealType}>{b.mealType}</Text>
                                                    <Text style={styles.mealRestaurant} numberOfLines={1}>
                                                        {b.restaurant?.restaurantName || 'Unknown Restaurant'}
                                                    </Text>
                                                    {b.restaurant?.address ? (
                                                        <Text style={styles.mealAddress} numberOfLines={1}>
                                                            📍 {b.restaurant.address}
                                                        </Text>
                                                    ) : null}
                                                </View>
                                            </View>
                                            <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
                                                <Text style={[styles.statusPillText, { color: sc.text }]}>
                                                    {b.status === 'not_consumed' ? 'MISSED' : b.status.toUpperCase()}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })
                        )}
                    </View>
                )}

                {/* ── Stats summary ────────────────────────────────────────── */}
                <View style={styles.statsRow}>
                    {[
                        { label: 'Consumed', count: bookings.filter(b => b.status === 'consumed').length,     color: '#4CAF50' },
                        { label: 'Missed',   count: bookings.filter(b => b.status === 'not_consumed').length, color: '#FFC107' },
                        { label: 'Cancelled',count: bookings.filter(b => b.status === 'cancelled').length,    color: '#F44336' },
                    ].map(s => (
                        <View key={s.label} style={[styles.statBox, { borderTopColor: s.color }]}>
                            <Text style={[styles.statCount, { color: s.color }]}>{s.count}</Text>
                            <Text style={styles.statLabel}>{s.label}</Text>
                        </View>
                    ))}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const CELL_SIZE = 44;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    // ── Subscription card ─────────────────────────────────────
    subCard: {
        margin: Spacing.md,
        marginBottom: 0,
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 3,
    },
    subCardTop: {
        flexDirection:  'row',
        justifyContent: 'space-between',
        alignItems:     'flex-start',
        marginBottom:   Spacing.md,
    },
    subPlanLabel: {
        fontSize: 10, fontWeight: '700', color: Colors.textLight, letterSpacing: 1,
    },
    subPlanName: {
        fontSize: 22, fontWeight: '900', color: Colors.text, marginTop: 2,
    },
    subStatusPill: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 20, gap: 5,
    },
    subDot: { width: 7, height: 7, borderRadius: 4 },
    subStatusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    subDatesRow: {
        flexDirection: 'row',
        alignItems:    'center',
        marginBottom:  Spacing.md,
    },
    subDateItem: { flex: 1, alignItems: 'center' },
    subDateDivider: {
        width: 1, height: 36, backgroundColor: Colors.border,
        marginHorizontal: 4,
    },
    subDateLabel: {
        fontSize: 9, fontWeight: '700', color: Colors.textLight, letterSpacing: 0.8, marginBottom: 4,
    },
    subDateValue: {
        fontSize: 13, fontWeight: '700', color: Colors.text, textAlign: 'center',
    },
    progressWrap: {
        gap: 4,
    },
    progressTrack: {
        height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden',
    },
    progressFill: {
        height: '100%' as any,
        backgroundColor: Colors.primary,
        borderRadius: 3,
    },
    progressLabel: {
        fontSize: 10, color: Colors.textLight, fontWeight: '600', textAlign: 'right',
    },
    // ── Calendar ─────────────────────────────────────────────────
    calendarCard: {
        margin: Spacing.md,
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3,
    },
    monthNav: {
        flexDirection:  'row',
        alignItems:     'center',
        justifyContent: 'space-between',
        marginBottom:   Spacing.md,
    },
    navBtn: {
        width: 36, height: 36,
        borderRadius: 18,
        backgroundColor: '#F5F5F5',
        alignItems: 'center', justifyContent: 'center',
    },
    navArrow: {
        fontSize: 24, color: Colors.text, lineHeight: 28,
    },
    monthTitle: {
        fontSize: 17, fontWeight: '700', color: Colors.text,
    },
    weekRow: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    weekLabel: {
        flex: 1,
        textAlign: 'center',
        fontSize: 11,
        fontWeight: '700',
        color: Colors.textLight,
        letterSpacing: 0.5,
    },
    gridWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: `${100 / 7}%` as any,
        aspectRatio: 1,
        alignItems:   'center',
        justifyContent: 'center',
        borderRadius: 8,
        marginVertical: 2,
    },
    todayCell: {
        borderWidth: 2,
        borderColor: Colors.primary,
    },
    selectedCell: {
        backgroundColor: Colors.primary + 'DD',
    },
    disabledCell: {
        opacity: 0.35,
    },
    dayNum: {
        fontSize: 13,
        fontWeight: '700',
    },
    dotsRow: {
        flexDirection: 'row',
        gap: 2,
        marginTop: 2,
    },
    dot: {
        width: 4, height: 4, borderRadius: 2,
    },
    // ── Legend ───────────────────────────────────────────────────
    legend: {
        flexDirection:  'row',
        justifyContent: 'center',
        flexWrap:       'wrap',
        gap: 12,
        marginTop: Spacing.md,
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    legendDot: {
        width: 12, height: 12, borderRadius: 3,
    },
    legendLabel: {
        fontSize: 11, color: Colors.textLight, fontWeight: '600',
    },
    // ── Day detail ───────────────────────────────────────────────
    detailCard: {
        marginHorizontal: Spacing.md,
        backgroundColor:  Colors.white,
        borderRadius:     BorderRadius.md,
        padding:          Spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3,
    },
    detailTitle: {
        fontSize:     15,
        fontWeight:   '700',
        color:        Colors.text,
        marginBottom: Spacing.md,
        paddingBottom: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    noMealsBox: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    noMealsIcon: { fontSize: 32, marginBottom: 8 },
    noMealsText: { fontSize: 14, color: Colors.textLight },
    mealRow: {
        flexDirection:  'row',
        alignItems:     'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F7F7F7',
    },
    mealRowLeft: {
        flexDirection: 'row',
        alignItems:    'center',
        flex: 1,
    },
    mealEmoji: {
        fontSize:    26,
        marginRight: 12,
    },
    mealInfo: { flex: 1 },
    mealType: {
        fontSize: 14, fontWeight: '700', color: Colors.text,
    },
    mealRestaurant: {
        fontSize: 13, color: Colors.textLight, marginTop: 2,
    },
    mealAddress: {
        fontSize: 11, color: '#AAA', marginTop: 1,
    },
    statusPill: {
        paddingHorizontal: 8,
        paddingVertical:   3,
        borderRadius:      6,
        marginLeft:        8,
    },
    statusPillText: {
        fontSize: 9, fontWeight: '800', letterSpacing: 0.5,
    },
    // ── Stats row ────────────────────────────────────────────────
    statsRow: {
        flexDirection:  'row',
        margin:         Spacing.md,
        marginTop:      Spacing.sm,
        gap:            Spacing.sm,
    },
    statBox: {
        flex: 1,
        backgroundColor:  Colors.white,
        borderRadius:     BorderRadius.sm,
        alignItems:       'center',
        paddingVertical:  14,
        borderTopWidth:   3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statCount: {
        fontSize:   24,
        fontWeight: '900',
    },
    statLabel: {
        fontSize:  11,
        color:     Colors.textLight,
        fontWeight:'600',
        marginTop:  2,
    },
});

export default MealHistoryScreen;
