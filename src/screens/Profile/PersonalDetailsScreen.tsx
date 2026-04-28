import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../styles/theme';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';

const InfoRow = ({ label, value }: { label: string, value: string | number | undefined }) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'Not provided'}</Text>
    </View>
);

const PersonalDetailsScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const isStudent = user?.role === 'student';

    return (
        <SafeAreaView style={styles.container}>
            <Header title="Personal Information" showBack onBackPress={() => navigation.goBack()} />
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account Details</Text>
                    <View style={styles.card}>
                        <InfoRow label="Email Address" value={user?.email} />
                        <InfoRow label="User ID" value={user?._id} />
                        <InfoRow label="Account Role" value={user?.role?.toUpperCase()} />
                        <InfoRow label="KYC Status" value={user?.kycStatus?.toUpperCase()} />
                    </View>
                </View>

                {isStudent ? (
                    <>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Basic Profile</Text>
                            <View style={styles.card}>
                                <InfoRow label="Full Name" value={user?.name} />
                                <InfoRow label="Phone Number" value={user?.phoneNumber} />
                                <InfoRow label="Current Address" value={user?.address} />
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Guardian Details</Text>
                            <View style={styles.card}>
                                <InfoRow label="Guardian Name" value={user?.localGuardianName} />
                                <InfoRow label="Guardian Phone" value={user?.localGuardianPhone} />
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Academic & Preferences</Text>
                            <View style={styles.card}>
                                <InfoRow label="College" value={user?.college} />
                                <InfoRow label="Location" value={user?.location} />
                                <InfoRow label="Hometown" value={user?.hometownAddress} />
                                <InfoRow label="Monthly Budget" value={user?.budget} />
                            </View>
                        </View>
                    </>
                ) : (
                    <>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Restaurant Profile</Text>
                            <View style={styles.card}>
                                <InfoRow label="Restaurant Name" value={user?.restaurantName} />
                                <InfoRow label="Owner Name" value={user?.ownerName} />
                                <InfoRow label="Opening Year" value={user?.openingYear} />
                                <InfoRow label="Capacity" value={user?.maxCapacity} />
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Contact & Location</Text>
                            <View style={styles.card}>
                                <InfoRow label="Professional Phone" value={user?.phoneNumber} />
                                <InfoRow label="Restaurant Address" value={user?.address} />
                                <InfoRow label="Location" value={user?.location} />
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Business Details</Text>
                            <View style={styles.card}>
                                <InfoRow label="FSSAI License" value={user?.fssaiLicense} />
                                <InfoRow label="Specializations" value={user?.specifications} />
                            </View>
                        </View>
                    </>
                )}

                <TouchableOpacity style={styles.editButton}>
                    <Text style={styles.editButtonText}>Request Information Update</Text>
                </TouchableOpacity>
                <Text style={styles.footerNote}>Contact support to change verified account identifiers.</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: Spacing.md,
        paddingBottom: 40,
    },
    section: {
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textLight,
        marginBottom: 8,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.surfaceAlt,
    },
    infoLabel: {
        fontSize: 14,
        color: Colors.textLight,
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 14,
        color: Colors.text,
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
        marginLeft: 20,
    },
    editButton: {
        marginTop: Spacing.xl,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.primary,
        height: 50,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editButtonText: {
        color: Colors.primary,
        fontSize: 16,
        fontWeight: '700',
    },
    footerNote: {
        textAlign: 'center',
        fontSize: 12,
        color: Colors.textLight,
        marginTop: 12,
    },
});

export default PersonalDetailsScreen;
