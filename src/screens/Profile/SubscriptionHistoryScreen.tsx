/**
 * SubscriptionHistoryScreen.tsx
 *
 * Shows the student's current plan status + full history of all
 * subscriptions (purchased, cancelled, expired).
 */

import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, SafeAreaView,
} from 'react-native';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, BorderRadius } from '../../styles/theme';

const fmt = (d: string | Date | undefined) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const daysLeft = (end: string | Date | undefined): number => {
    if (!end) return 0;
    return Math.max(0, Math.ceil((new Date(end).getTime() - Date.now()) / 86_400_000));
};

const statusColor = (status: string) => {
    switch (status) {
        case 'active':    return { bg: '#E8F5E9', fg: '#2E7D32', dot: '#4CAF50' };
        case 'cancelled': return { bg: '#FFEBEE', fg: '#C62828', dot: '#F44336' };
        default:          return { bg: '#F5F5F5', fg: '#666',    dot: '#999'    };
    }
};

const SubscriptionHistoryScreen = ({ navigation }: any) => {
    const { user } = useAuth();

    const currentPlan   = user?.selectedPlan;
    const currentStatus = user?.subscriptionStatus || 'inactive';
    const subStart      = user?.subscriptionDate;
    const subEnd        = user?.subscriptionEndDate;
    const history: any[]= user?.subscriptionHistory || [];
    const dl            = daysLeft(subEnd);

    const sc = statusColor(currentStatus);

    return (
        <SafeAreaView style={s.container}>
            <Header
                title="My Subscriptions"
                showBack
                onBackPress={() => navigation.goBack()}
            />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

                {/* ── Current plan card ── */}
                <View style={s.currentCard}>
                    <View style={s.currentTop}>
                        <View>
                            <Text style={s.currentLabel}>CURRENT PLAN</Text>
                            <Text style={s.currentPlan}>{currentPlan || 'No Plan'}</Text>
                        </View>
                        <View style={[s.statusPill, { backgroundColor: sc.bg }]}>
                            <View style={[s.dot, { backgroundColor: sc.dot }]} />
                            <Text style={[s.statusTxt, { color: sc.fg }]}>
                                {currentStatus.toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    {currentStatus === 'active' && (
                        <>
                            {/* Date row */}
                            <View style={s.dateRow}>
                                <View style={s.dateItem}>
                                    <Text style={s.dateLabel}>STARTED</Text>
                                    <Text style={s.dateVal}>{fmt(subStart)}</Text>
                                </View>
                                <View style={s.dateDivider} />
                                <View style={s.dateItem}>
                                    <Text style={s.dateLabel}>EXPIRES</Text>
                                    <Text style={[s.dateVal, dl <= 5 && { color: '#F44336' }]}>
                                        {fmt(subEnd)}
                                    </Text>
                                </View>
                                <View style={s.dateDivider} />
                                <View style={s.dateItem}>
                                    <Text style={s.dateLabel}>DAYS LEFT</Text>
                                    <Text style={[s.dateVal, { color: dl <= 5 ? '#F44336' : Colors.primary }]}>
                                        {dl}d
                                    </Text>
                                </View>
                            </View>

                            {/* Progress bar */}
                            {subStart && subEnd && (() => {
                                const total = Math.max(1, new Date(subEnd).getTime() - new Date(subStart).getTime());
                                const used  = Math.max(0, Date.now() - new Date(subStart).getTime());
                                const pct   = Math.min(1, used / total);
                                return (
                                    <View style={s.progressWrap}>
                                        <View style={s.progressTrack}>
                                            <View style={[s.progressFill, { width: `${pct * 100}%` as any }]} />
                                        </View>
                                        <Text style={s.progressLabel}>{Math.round(pct * 100)}% used</Text>
                                    </View>
                                );
                            })()}
                        </>
                    )}

                    {currentStatus !== 'active' && (
                        <Text style={s.noActiveTxt}>
                            {currentStatus === 'cancelled'
                                ? 'Your subscription has been cancelled.'
                                : 'You don\'t have an active subscription. Purchase a plan to enjoy meals.'}
                        </Text>
                    )}
                </View>

                {/* ── History list ── */}
                <Text style={s.sectionTitle}>Subscription History</Text>

                {history.length === 0 ? (
                    <View style={s.emptyBox}>
                        <Text style={{ fontSize: 36 }}>📋</Text>
                        <Text style={s.emptyTitle}>No history yet</Text>
                        <Text style={s.emptyDesc}>
                            Your past subscriptions will appear here.
                        </Text>
                    </View>
                ) : (
                    [...history].reverse().map((h: any, idx: number) => {
                        const hsc = statusColor(h.status);
                        const isLatest = idx === 0;
                        return (
                            <View key={idx} style={[s.historyCard, isLatest && s.historyCardLatest]}>
                                {/* Left timeline dot */}
                                <View style={s.timelineDot}>
                                    <View style={[s.tlDot, { backgroundColor: hsc.dot }]} />
                                    {idx < history.length - 1 && <View style={s.tlLine} />}
                                </View>

                                <View style={s.historyBody}>
                                    <View style={s.historyTop}>
                                        <Text style={s.historyPlan}>{h.planName}</Text>
                                        <View style={[s.historyBadge, { backgroundColor: hsc.bg }]}>
                                            <Text style={[s.historyBadgeTxt, { color: hsc.fg }]}>
                                                {(h.status || 'completed').toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={s.historyDates}>
                                        <Text style={s.historyDateItem}>
                                            📅 {fmt(h.startDate)}
                                        </Text>
                                        <Text style={s.historyDateSep}>→</Text>
                                        <Text style={s.historyDateItem}>
                                            {fmt(h.endDate)}
                                        </Text>
                                    </View>

                                    {h.price != null && (
                                        <Text style={s.historyPrice}>
                                            ₹{h.price} paid
                                        </Text>
                                    )}

                                    {h.cancelledAt && (
                                        <Text style={s.historyCancelled}>
                                            ❌ Cancelled on {fmt(h.cancelledAt)}
                                            {h.refundAmount ? ` · ₹${h.refundAmount} refunded` : ''}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        );
                    })
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F7F7' },
    scroll:    { padding: 16 },

    // Current plan card
    currentCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
    },
    currentTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    currentLabel:{ fontSize: 10, fontWeight: '700', color: '#999', letterSpacing: 1.2 },
    currentPlan: { fontSize: 26, fontWeight: '900', color: '#000', marginTop: 2 },
    statusPill:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 5 },
    dot:         { width: 7, height: 7, borderRadius: 4 },
    statusTxt:   { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

    dateRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    dateItem:    { flex: 1, alignItems: 'center' },
    dateDivider: { width: 1, height: 36, backgroundColor: '#EEE' },
    dateLabel:   { fontSize: 9, fontWeight: '700', color: '#AAA', letterSpacing: 0.8, marginBottom: 4 },
    dateVal:     { fontSize: 13, fontWeight: '700', color: '#000', textAlign: 'center' },

    progressWrap:  { gap: 4 },
    progressTrack: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
    progressFill:  { height: '100%' as any, backgroundColor: Colors.primary, borderRadius: 3 },
    progressLabel: { fontSize: 10, color: '#AAA', fontWeight: '600', textAlign: 'right' },

    noActiveTxt: { fontSize: 14, color: '#888', lineHeight: 21, marginTop: 4 },

    // History
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#000', marginBottom: 16, marginLeft: 4 },

    emptyBox:  { alignItems: 'center', paddingVertical: 40 },
    emptyTitle:{ fontSize: 16, fontWeight: '700', color: '#555', marginTop: 12 },
    emptyDesc: { fontSize: 13, color: '#AAA', marginTop: 6, textAlign: 'center' },

    historyCard:       { flexDirection: 'row', marginBottom: 12 },
    historyCardLatest: {},
    timelineDot:       { alignItems: 'center', marginRight: 12, paddingTop: 4 },
    tlDot:             { width: 12, height: 12, borderRadius: 6 },
    tlLine:            { width: 2, flex: 1, backgroundColor: '#E0E0E0', marginTop: 4 },

    historyBody: {
        flex: 1, backgroundColor: '#FFF', borderRadius: 12, padding: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    historyTop:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    historyPlan:      { fontSize: 15, fontWeight: '800', color: '#000' },
    historyBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    historyBadgeTxt:  { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
    historyDates:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    historyDateItem:  { fontSize: 12, color: '#666' },
    historyDateSep:   { fontSize: 12, color: '#BBB' },
    historyPrice:     { fontSize: 13, color: Colors.primary, fontWeight: '700', marginTop: 4 },
    historyCancelled: { fontSize: 12, color: '#E53935', marginTop: 6, lineHeight: 18 },
});

export default SubscriptionHistoryScreen;
