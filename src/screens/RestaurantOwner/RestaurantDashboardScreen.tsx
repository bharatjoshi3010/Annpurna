import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../styles/theme';

const StatCard = ({ title, value, color }: { title: string, value: string | number, color: string }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
);

const RestaurantDashboardScreen = ({ navigation }: any) => {
    // Mock Data
    const stats = {
        totalComing: 120,
        completed: 45,
        remaining: 65,
        canceled: 10,
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
                <Text style={Typography.h1}>Restaurant Dashboard</Text>
                <Text style={styles.subtitle}>Today's Meal Overview</Text>
            </View>

            <View style={styles.statsContainer}>
                <StatCard title="Total Expected" value={stats.totalComing} color={Colors.primary} />
                <StatCard title="Completed" value={stats.completed} color="#4CAF50" />
            </View>
            <View style={styles.statsContainer}>
                <StatCard title="Remaining" value={stats.remaining} color="#FF9800" />
                <StatCard title="Canceled" value={stats.canceled} color="#F44336" />
            </View>

            <View style={styles.section}>
                <Text style={Typography.h2}>Quick Actions</Text>

                <TouchableOpacity style={styles.actionCard}>
                    <View style={styles.actionIconContainer}>
                        <Text style={styles.actionIcon}>📋</Text>
                    </View>
                    <View>
                        <Text style={styles.actionTitle}>List Specific Item</Text>
                        <Text style={styles.actionSubtitle}>Update today's special menu</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionCard}>
                    <View style={styles.actionIconContainer}>
                        <Text style={styles.actionIcon}>📸</Text>
                    </View>
                    <View>
                        <Text style={styles.actionTitle}>Scan Student QR</Text>
                        <Text style={styles.actionSubtitle}>Verify student meal token</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={Typography.h2}>Recent Meal Scans</Text>
                <View style={styles.scanItem}>
                    <Text style={styles.scanName}>Rahul Kumar</Text>
                    <Text style={styles.scanTime}>Just now</Text>
                </View>
                <View style={styles.scanItem}>
                    <Text style={styles.scanName}>Anjali Sharma</Text>
                    <Text style={styles.scanTime}>5 mins ago</Text>
                </View>
                <View style={[styles.scanItem, { borderBottomWidth: 0 }]}>
                    <Text style={styles.scanName}>Vikram Singh</Text>
                    <Text style={styles.scanTime}>12 mins ago</Text>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingTop: 60,
    },
    header: {
        marginBottom: Spacing.xl,
    },
    subtitle: {
        ...Typography.body,
        color: Colors.textLight,
        marginTop: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    statCard: {
        flex: 1,
        backgroundColor: Colors.white,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginHorizontal: 4,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    statTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textLight,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    section: {
        marginTop: Spacing.xl,
    },
    actionCard: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.md,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    actionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    actionIcon: {
        fontSize: 20,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    actionSubtitle: {
        fontSize: 12,
        color: Colors.textLight,
        marginTop: 2,
    },
    scanItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    scanName: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.text,
    },
    scanTime: {
        fontSize: 12,
        color: Colors.textLight,
    },
});

export default RestaurantDashboardScreen;
