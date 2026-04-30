import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import UserAvatar from '../../components/UserAvatar';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, BorderRadius } from '../../styles/theme';
import { API_BASE_URL } from '../../config';

const PLAN_COLORS: Record<string, { bg: string; fg: string }> = {
    Basic:    { bg: '#E3F2FD', fg: '#1565C0' },
    Standard: { bg: '#E8F5E9', fg: '#2E7D32' },
    Premium:  { bg: '#FFF3E0', fg: '#E65100' },
};

const STATUS_COLORS: Record<string, { bg: string; fg: string; dot: string }> = {
    active:    { bg: '#E8F5E9', fg: '#2E7D32', dot: '#4CAF50' },
    inactive:  { bg: '#F5F5F5', fg: '#757575', dot: '#9E9E9E' },
    cancelled: { bg: '#FFEBEE', fg: '#C62828', dot: '#F44336' },
};

const StudentCard = ({ student }: { student: any }) => {
    const plan   = student.selectedPlan || 'No Plan';
    const status = student.subscriptionStatus || 'inactive';
    const pc     = PLAN_COLORS[plan]   || { bg: '#F5F5F5', fg: '#555' };
    const sc     = STATUS_COLORS[status] || STATUS_COLORS.inactive;

    return (
        <View style={styles.card}>
            <UserAvatar
                photoUrl={student.profilePhoto}
                name={student.name || 'S'}
                size={48}
                borderWidth={0}
            />
            <View style={styles.cardInfo}>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentContact}>
                    {student.phoneNumber || student.email}
                </Text>

                <View style={styles.badges}>
                    {/* Plan badge */}
                    <View style={[styles.badge, { backgroundColor: pc.bg }]}>
                        <Text style={[styles.badgeText, { color: pc.fg }]}>{plan}</Text>
                    </View>

                    {/* Status badge */}
                    <View style={[styles.badge, { backgroundColor: sc.bg, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                        <View style={[styles.dot, { backgroundColor: sc.dot }]} />
                        <Text style={[styles.badgeText, { color: sc.fg }]}>
                            {status.toUpperCase()}
                        </Text>
                    </View>

                    {/* KYC badge */}
                    {student.kycStatus === 'approved' && (
                        <View style={[styles.badge, { backgroundColor: '#E8F5E9' }]}>
                            <Text style={[styles.badgeText, { color: '#2E7D32' }]}>✓ KYC</Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

const MyStudentsScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const [students,   setStudents]   = useState<any[]>([]);
    const [loading,    setLoading]    = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error,      setError]      = useState('');

    const fetchStudents = useCallback(async () => {
        try {
            setError('');
            const res  = await fetch(`${API_BASE_URL}/api/auth/my-students`, {
                headers: { Authorization: `Bearer ${user?.token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setStudents(data);
            } else {
                setError(data.message || 'Failed to load students.');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.token]);

    useEffect(() => { fetchStudents(); }, [fetchStudents]);

    const activeCount  = students.filter(s => s.subscriptionStatus === 'active').length;
    const premiumCount = students.filter(s => s.selectedPlan === 'Premium').length;

    return (
        <SafeAreaView style={styles.container}>
            <Header title="My Subscribers" showBack onBackPress={() => navigation.goBack()} />

            {/* Summary bar */}
            {!loading && students.length > 0 && (
                <View style={styles.summaryBar}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>{students.length}</Text>
                        <Text style={styles.summaryLabel}>Total</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>{activeCount}</Text>
                        <Text style={styles.summaryLabel}>Active</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryValue, { color: '#E65100' }]}>{premiumCount}</Text>
                        <Text style={styles.summaryLabel}>Premium</Text>
                    </View>
                </View>
            )}

            {loading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
            ) : error ? (
                <View style={styles.emptyBox}>
                    <Text style={{ fontSize: 36 }}>⚠️</Text>
                    <Text style={styles.emptyTitle}>Something went wrong</Text>
                    <Text style={styles.emptyDesc}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={fetchStudents}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : students.length === 0 ? (
                <View style={styles.emptyBox}>
                    <Text style={{ fontSize: 48 }}>🏫</Text>
                    <Text style={styles.emptyTitle}>No students yet</Text>
                    <Text style={styles.emptyDesc}>
                        Students who set your restaurant as their default will appear here.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={students}
                    keyExtractor={item => item._id}
                    renderItem={({ item }) => <StudentCard student={item} />}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); fetchStudents(); }}
                            colors={[Colors.primary]}
                        />
                    }
                    ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },

    summaryBar: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        marginHorizontal: Spacing.md,
        marginTop: Spacing.md,
        borderRadius: BorderRadius.lg,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    summaryItem:    { flex: 1, alignItems: 'center' },
    summaryValue:   { fontSize: 22, fontWeight: '900', color: Colors.text },
    summaryLabel:   { fontSize: 11, color: Colors.textLight, fontWeight: '600', marginTop: 2 },
    summaryDivider: { width: 1, backgroundColor: Colors.border },

    list: { padding: Spacing.md },

    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    cardInfo:      { flex: 1, marginLeft: 14 },
    studentName:   { fontSize: 15, fontWeight: '800', color: Colors.text },
    studentContact:{ fontSize: 12, color: Colors.textLight, marginTop: 1, marginBottom: 8 },

    badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    badge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
    dot: { width: 6, height: 6, borderRadius: 3 },

    emptyBox:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    emptyTitle:{ fontSize: 18, fontWeight: '800', color: Colors.text, marginTop: 16 },
    emptyDesc: { fontSize: 14, color: Colors.textLight, textAlign: 'center', marginTop: 8, lineHeight: 22 },

    retryBtn:  { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: Colors.primary, borderRadius: BorderRadius.md },
    retryText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});

export default MyStudentsScreen;
