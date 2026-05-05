import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, BorderRadius } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';

const RestaurantAnalyticsScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dateRange, setDateRange] = useState('weekly'); // 'weekly', 'monthly', 'all'

    const fetchAnalytics = useCallback(async () => {
        try {
            let url = `${API_BASE_URL}/api/analytics/restaurant`;
            
            // Add date filters
            const end = new Date();
            let start = new Date();
            if (dateRange === 'weekly') {
                start.setDate(end.getDate() - 7);
            } else if (dateRange === 'monthly') {
                start.setMonth(end.getMonth() - 1);
            } else {
                start = new Date('2024-01-01'); // arbitrary far past for "all"
            }
            
            url += `?startDate=${start.toISOString()}&endDate=${end.toISOString()}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            const result = await res.json();
            if (res.ok) {
                setData(result);
            } else {
                console.error(result.message);
            }
        } catch (err) {
            console.error('Fetch Analytics Error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user, dateRange]);

    useEffect(() => {
        setLoading(true);
        fetchAnalytics();
    }, [fetchAnalytics]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchAnalytics();
    };

    if (loading && !data) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading Analytics...</Text>
            </SafeAreaView>
        );
    }

    if (!data) return null;

    // Helper to calculate bar heights
    const maxVal = Math.max(...data.trendData.map((d: any) => Math.max(d.consumed, d.missed)), 1);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Financial Analytics</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView 
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
            >
                {/* Filter Tabs */}
                <View style={styles.tabsContainer}>
                    {['weekly', 'monthly', 'all'].map(tab => (
                        <TouchableOpacity 
                            key={tab} 
                            style={[styles.tab, dateRange === tab && styles.activeTab]}
                            onPress={() => setDateRange(tab)}
                        >
                            <Text style={[styles.tabText, dateRange === tab && styles.activeTabText]}>
                                {tab === 'weekly' ? 'Last 7 Days' : tab === 'monthly' ? 'Last 30 Days' : 'All Time'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Main Metric Cards */}
                <View style={styles.metricsRow}>
                    <View style={[styles.metricCard, { borderTopColor: Colors.success, borderTopWidth: 4 }]}>
                        <Text style={styles.metricLabel}>Total Earnings</Text>
                        <Text style={[styles.metricValue, { color: Colors.success }]}>₹{data.totalEarnings}</Text>
                        <Text style={styles.metricSub}>{data.mealsServed} meals served</Text>
                    </View>
                    <View style={[styles.metricCard, { borderTopColor: Colors.error, borderTopWidth: 4 }]}>
                        <Text style={styles.metricLabel}>Revenue Lost</Text>
                        <Text style={[styles.metricValue, { color: Colors.error }]}>₹{data.revenueLost}</Text>
                        <Text style={styles.metricSub}>{data.mealsMissed} meals missed</Text>
                    </View>
                </View>

                {/* Efficiency Bar */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Fulfillment Efficiency</Text>
                    <View style={styles.progressBarBg}>
                        {data.mealsServed + data.mealsMissed > 0 ? (
                            <View 
                                style={[
                                    styles.progressBarFill, 
                                    { width: `${(data.mealsServed / (data.mealsServed + data.mealsMissed)) * 100}%` }
                                ]} 
                            />
                        ) : null}
                    </View>
                    <View style={styles.progressLabels}>
                        <Text style={styles.progressLabel}>Served: {data.mealsServed}</Text>
                        <Text style={styles.progressLabel}>Missed: {data.mealsMissed}</Text>
                    </View>
                </View>

                {/* Meal Breakdown */}
                <Text style={styles.sectionTitle}>Meal-wise Breakdown</Text>
                {['Breakfast', 'Lunch', 'Dinner'].map(meal => {
                    const stats = data.breakdown[meal];
                    const EMOJI = meal === 'Breakfast' ? '🌅' : meal === 'Lunch' ? '☀️' : '🌙';
                    return (
                        <View key={meal} style={styles.breakdownCard}>
                            <View style={styles.bdHeader}>
                                <Text style={styles.bdEmoji}>{EMOJI}</Text>
                                <Text style={styles.bdTitle}>{meal}</Text>
                                <Text style={styles.bdRate}>₹{meal === 'Breakfast' ? 20 : 40} / meal</Text>
                            </View>
                            <View style={styles.bdRow}>
                                <View style={styles.bdStat}>
                                    <Text style={styles.bdStatLabel}>Consumed</Text>
                                    <Text style={styles.bdStatVal}>{stats.count}</Text>
                                    <Text style={styles.bdStatRev}>₹{stats.revenue}</Text>
                                </View>
                                <View style={styles.bdStat}>
                                    <Text style={styles.bdStatLabel}>Missed</Text>
                                    <Text style={styles.bdStatValError}>{stats.missedCount}</Text>
                                    <Text style={styles.bdStatRevError}>₹{stats.missedRevenue}</Text>
                                </View>
                            </View>
                        </View>
                    );
                })}

                {/* Trend Chart (Simple Bar implementation) */}
                {data.trendData && data.trendData.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Daily Trend</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}>
                            {data.trendData.map((day: any, i: number) => {
                                const hConsumed = (day.consumed / maxVal) * 120;
                                const hMissed = (day.missed / maxVal) * 120;
                                const dateLabel = day.date.substring(5, 10); // MM-DD
                                
                                return (
                                    <View key={i} style={styles.chartCol}>
                                        <View style={styles.barsContainer}>
                                            <View style={styles.barWrapper}>
                                                <View style={[styles.bar, styles.barMissed, { height: hMissed }]} />
                                            </View>
                                            <View style={styles.barWrapper}>
                                                <View style={[styles.bar, styles.barConsumed, { height: hConsumed }]} />
                                            </View>
                                        </View>
                                        <Text style={styles.chartLabel}>{dateLabel}</Text>
                                    </View>
                                );
                            })}
                        </ScrollView>
                        <View style={styles.legendRow}>
                            <View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: Colors.success }]} /><Text style={styles.legendText}>Earnings</Text></View>
                            <View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: Colors.error }]} /><Text style={styles.legendText}>Lost Revenue</Text></View>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
    loadingText: { marginTop: 12, color: Colors.textLight, fontWeight: '600' },
    scroll: { padding: Spacing.md, paddingBottom: 60, gap: Spacing.md },
    
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    backIcon: { fontSize: 28, color: Colors.text, lineHeight: 30 },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', textAlign: 'center', color: Colors.text },

    tabsContainer: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: BorderRadius.md },
    activeTab: { backgroundColor: Colors.primary, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
    tabText: { fontSize: 13, fontWeight: '600', color: Colors.textLight },
    activeTabText: { color: '#FFF' },

    metricsRow: { flexDirection: 'row', gap: Spacing.md },
    metricCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    metricLabel: { fontSize: 12, fontWeight: '700', color: Colors.textLight, textTransform: 'uppercase', marginBottom: 6 },
    metricValue: { fontSize: 24, fontWeight: '800' },
    metricSub: { fontSize: 12, color: Colors.textLight, marginTop: 4, fontWeight: '500' },

    card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    cardTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 12 },
    
    progressBarBg: { height: 12, backgroundColor: Colors.surfaceAlt, borderRadius: 6, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: Colors.primary },
    progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    progressLabel: { fontSize: 12, fontWeight: '600', color: Colors.textLight },

    sectionTitle: { fontSize: 14, fontWeight: '800', color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 1, marginTop: Spacing.sm },
    
    breakdownCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.borderLight },
    bdHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.surfaceAlt },
    bdEmoji: { fontSize: 18, marginRight: 8 },
    bdTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: Colors.text },
    bdRate: { fontSize: 12, fontWeight: '700', color: Colors.primary },
    
    bdRow: { flexDirection: 'row', justifyContent: 'space-around' },
    bdStat: { alignItems: 'center' },
    bdStatLabel: { fontSize: 11, fontWeight: '700', color: Colors.textLight, textTransform: 'uppercase', marginBottom: 4 },
    bdStatVal: { fontSize: 20, fontWeight: '800', color: Colors.text },
    bdStatRev: { fontSize: 14, fontWeight: '700', color: Colors.success, marginTop: 2 },
    bdStatValError: { fontSize: 20, fontWeight: '800', color: Colors.error },
    bdStatRevError: { fontSize: 14, fontWeight: '700', color: Colors.error, marginTop: 2 },

    chartScroll: { gap: 16, paddingVertical: 10 },
    chartCol: { alignItems: 'center', width: 44 },
    barsContainer: { flexDirection: 'row', height: 120, alignItems: 'flex-end', gap: 2, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, width: '100%' },
    barWrapper: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
    bar: { width: '100%', borderTopLeftRadius: 4, borderTopRightRadius: 4, minHeight: 2 },
    barConsumed: { backgroundColor: Colors.success },
    barMissed: { backgroundColor: Colors.error },
    chartLabel: { fontSize: 10, color: Colors.textLight, marginTop: 8, fontWeight: '600' },
    
    legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.surfaceAlt },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendColor: { width: 12, height: 12, borderRadius: 3 },
    legendText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary }
});

export default RestaurantAnalyticsScreen;
