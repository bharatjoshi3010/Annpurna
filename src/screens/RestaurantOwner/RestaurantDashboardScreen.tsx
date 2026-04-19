import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import KYCWarning from '../../components/KYCWarning';
import { io } from 'socket.io-client';

const SOCKET_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

const StatCard = ({ title, value, color }: { title: string, value: string | number, color: string }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
);

const RestaurantDashboardScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const [incomingStudents, setIncomingStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const displayName = user?.restaurantName || user?.ownerName || 'Restaurant';

    useEffect(() => {
        fetchIncomingStudents();

        const socket = io(SOCKET_URL);
        socket.on('connect', () => {
            socket.emit('join', user._id.toString());
        });

        socket.on('newBooking', (booking) => {
            setIncomingStudents(prev => {
                // Check if already in list (update/replace)
                const exists = prev.find(b => b.student._id === booking.student._id);
                if (exists) {
                    return prev.map(b => b.student._id === booking.student._id ? booking : b);
                }
                return [booking, ...prev];
            });
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const fetchIncomingStudents = async () => {
        try {
            const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
            const response = await fetch(`${baseUrl}/api/meals/incoming/${user._id}`);
            const data = await response.json();
            if (response.ok) {
                setIncomingStudents(data);
            }
        } catch (error) {
            console.error('Error fetching incoming students:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkConsumed = async (bookingId: string) => {
        try {
            const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
            const response = await fetch(`${baseUrl}/api/meals/consume`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId })
            });
            if (response.ok) {
                setIncomingStudents(prev => 
                    prev.map(b => b._id === bookingId ? { ...b, status: 'consumed' } : b)
                );
            }
        } catch (error) {
            console.error('Error marking as consumed:', error);
        }
    };

    const stats = {
        totalComing: incomingStudents.length,
        completed: incomingStudents.filter(b => b.status === 'consumed').length,
        remaining: incomingStudents.filter(b => b.status === 'booked').length,
        canceled: incomingStudents.filter(b => b.status === 'cancelled').length,
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <KYCWarning />
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <View>
                        <Text style={Typography.h1}>{displayName}</Text>
                        <Text style={styles.subtitle}>Welcome back, {user?.ownerName || 'Owner'}</Text>
                    </View>
                    <TouchableOpacity 
                        style={styles.profileIndicator}
                        onPress={() => navigation.navigate('PersonalDetails')}
                    >
                        <Text style={styles.profileEmoji}>👤</Text>
                        <Text style={styles.viewProfileText}>View Profile</Text>
                    </TouchableOpacity>
                </View>
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
                <View style={styles.sectionHeaderRow}>
                    <Text style={Typography.h2}>Incoming Students</Text>
                    {loading && <ActivityIndicator size="small" color={Colors.primary} />}
                </View>

                {incomingStudents.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No students expected yet for this meal slot.</Text>
                    </View>
                ) : (
                    incomingStudents.map((booking, index) => (
                        <View key={booking._id} style={[styles.scanItem, index === incomingStudents.length - 1 && { borderBottomWidth: 0 }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.scanName}>{booking.student?.name || 'Anonymous Student'}</Text>
                                <Text style={styles.scanSub}>{booking.mealType} • {booking.student?.phoneNumber}</Text>
                            </View>
                            {booking.status === 'booked' ? (
                                <TouchableOpacity 
                                    style={styles.confirmButton}
                                    onPress={() => handleMarkConsumed(booking._id)}
                                >
                                    <Text style={styles.confirmButtonText}>Confirm Meal</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={[
                                    styles.statusBadge, 
                                    { backgroundColor: booking.status === 'consumed' ? '#E8F5E9' : '#FFF3E0' }
                                ]}>
                                    <Text style={[
                                        styles.statusText, 
                                        { color: booking.status === 'consumed' ? '#2E7D32' : '#E65100' }
                                    ]}>
                                        {booking.status}
                                    </Text>
                                </View>
                            )}
                        </View>
                    ))
                )}
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
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    profileIndicator: {
        alignItems: 'center',
        padding: 8,
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    profileEmoji: {
        fontSize: 18,
    },
    viewProfileText: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.primary,
        marginTop: 2,
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
    scanSub: {
        fontSize: 12,
        color: Colors.textLight,
        marginTop: 2,
    },
    statusBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#2E7D32',
        textTransform: 'uppercase',
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    confirmButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    confirmButtonText: {
        color: Colors.white,
        fontSize: 12,
        fontWeight: '700',
    },
});

export default RestaurantDashboardScreen;
