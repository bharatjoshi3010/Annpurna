import React, { useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    TouchableOpacity, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../styles/theme';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';

// ─── Read-only info row ───────────────────────────────────────────────────────
const InfoRow = ({ label, value }: { label: string; value: string | number | undefined }) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value ?? 'Not provided'}</Text>
    </View>
);

// ─── Editable field row ───────────────────────────────────────────────────────
const EditRow = ({
    label, value, onChangeText, keyboardType = 'default', placeholder,
}: {
    label: string;
    value: string;
    onChangeText: (v: string) => void;
    keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
    placeholder?: string;
}) => (
    <View style={styles.editRow}>
        <Text style={styles.editLabel}>{label}</Text>
        <TextInput
            style={styles.editInput}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            placeholderTextColor={Colors.textLight}
        />
    </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const PersonalDetailsScreen = ({ navigation }: any) => {
    const { user, setUser } = useAuth();
    const isStudent = user?.role === 'student';
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);

    // ── Student mutable fields ────────────────────────────────────────────────
    const [name, setName]                           = useState(user?.name || '');
    const [phoneNumber, setPhoneNumber]             = useState(user?.phoneNumber || '');
    const [address, setAddress]                     = useState(user?.address || '');
    const [localGuardianName, setLocalGuardianName] = useState(user?.localGuardianName || '');
    const [localGuardianPhone, setLocalGuardianPhone] = useState(user?.localGuardianPhone || '');
    const [college, setCollege]                     = useState(user?.college || '');
    const [location, setLocation]                   = useState(user?.location || '');
    const [hometownAddress, setHometownAddress]     = useState(user?.hometownAddress || '');
    const [budget, setBudget]                       = useState(user?.budget?.toString() || '');

    // ── Restaurant mutable fields ─────────────────────────────────────────────
    const [ownerName, setOwnerName]           = useState(user?.ownerName || '');
    const [restaurantName, setRestaurantName] = useState(user?.restaurantName || '');
    const [openingYear, setOpeningYear]       = useState(user?.openingYear?.toString() || '');
    const [maxCapacity, setMaxCapacity]       = useState(user?.maxCapacity?.toString() || '');
    const [restPhone, setRestPhone]           = useState(user?.phoneNumber || '');
    const [restAddress, setRestAddress]       = useState(user?.address || '');
    const [restLocation, setRestLocation]     = useState(user?.location || '');
    const [fssaiLicense, setFssaiLicense]     = useState(user?.fssaiLicense || '');
    const [specifications, setSpecifications] = useState(user?.specifications || '');

    // ─────────────────────────────────────────────────────────────────────────
    const handleRequestEdit = () => setEditMode(true);

    const handleDoneChanges = async () => {
        setSaving(true);
        try {
            const payload: Record<string, any> = { kycStatus: 'pending' };

            if (isStudent) {
                payload.name               = name;
                payload.phoneNumber        = phoneNumber;
                payload.address            = address;
                payload.localGuardianName  = localGuardianName;
                payload.localGuardianPhone = localGuardianPhone;
                payload.college            = college;
                payload.location           = location;
                payload.hometownAddress    = hometownAddress;
                payload.budget             = budget;
            } else {
                payload.ownerName      = ownerName;
                payload.restaurantName = restaurantName;
                payload.openingYear    = openingYear;
                payload.maxCapacity    = maxCapacity;
                payload.phoneNumber    = restPhone;
                payload.address        = restAddress;
                payload.location       = restLocation;
                payload.fssaiLicense   = fssaiLicense;
                payload.specifications = specifications;
            }

            const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user?.token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.ok) {
                // ⚠️  IMPORTANT: Merge backend response ON TOP of the existing user.
                // The updateProfile endpoint only returns a subset of fields. If we
                // replace the full user object we lose fields like subscriptionStatus,
                // defaultRestaurantId, selectedPlan, walletBalance, etc.
                setUser((prev: any) => ({
                    ...prev,           // keep ALL existing fields (plan, restaurant, wallet…)
                    ...data,           // overlay only what the server returned
                    token: prev?.token,  // keep the original valid token, no need to replace it
                }));
                setEditMode(false);
                Alert.alert(
                    '✅ Changes Submitted',
                    'Your information has been updated and sent for admin review. Your KYC status is now Pending.',
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert('Update Failed', data.message || 'Something went wrong.');
            }
        } catch {
            Alert.alert('Error', 'Could not connect to the server. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        // Reset all fields back to user data
        if (isStudent) {
            setName(user?.name || '');
            setPhoneNumber(user?.phoneNumber || '');
            setAddress(user?.address || '');
            setLocalGuardianName(user?.localGuardianName || '');
            setLocalGuardianPhone(user?.localGuardianPhone || '');
            setCollege(user?.college || '');
            setLocation(user?.location || '');
            setHometownAddress(user?.hometownAddress || '');
            setBudget(user?.budget?.toString() || '');
        } else {
            setOwnerName(user?.ownerName || '');
            setRestaurantName(user?.restaurantName || '');
            setOpeningYear(user?.openingYear?.toString() || '');
            setMaxCapacity(user?.maxCapacity?.toString() || '');
            setRestPhone(user?.phoneNumber || '');
            setRestAddress(user?.address || '');
            setRestLocation(user?.location || '');
            setFssaiLicense(user?.fssaiLicense || '');
            setSpecifications(user?.specifications || '');
        }
        setEditMode(false);
    };

    // ── KYC badge color ───────────────────────────────────────────────────────
    const kycColor =
        user?.kycStatus === 'approved' ? Colors.success :
        user?.kycStatus === 'pending'  ? '#D97706' :
        Colors.error;

    const kycBg =
        user?.kycStatus === 'approved' ? '#DCFCE7' :
        user?.kycStatus === 'pending'  ? '#FEF3C7' :
        '#FEE2E2';

    return (
        <SafeAreaView style={styles.container}>
            <Header title="Personal Information" showBack onBackPress={() => navigation.goBack()} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Edit Mode Banner ─────────────────────────────────────── */}
                {editMode && (
                    <View style={styles.editBanner}>
                        <Text style={styles.editBannerIcon}>✏️</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.editBannerTitle}>Editing Information</Text>
                            <Text style={styles.editBannerSub}>
                                After saving, your KYC status will reset to Pending for admin review.
                            </Text>
                        </View>
                    </View>
                )}

                {/* ── Account Details (always read-only) ───────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account Details</Text>
                    <View style={styles.card}>
                        <InfoRow label="Email Address" value={user?.email} />
                        <InfoRow label="User ID" value={user?._id} />
                        <InfoRow label="Account Role" value={user?.role?.toUpperCase()} />
                        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                            <Text style={styles.infoLabel}>KYC Status</Text>
                            <View style={[styles.kycBadge, { backgroundColor: kycBg }]}>
                                <Text style={[styles.kycBadgeText, { color: kycColor }]}>
                                    {user?.kycStatus?.toUpperCase() || 'NOT SET'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ══════════════════════════════════════════════════════════════
                    STUDENT FIELDS
                   ══════════════════════════════════════════════════════════════ */}
                {isStudent ? (
                    <>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Basic Profile</Text>
                            <View style={styles.card}>
                                {editMode ? (
                                    <>
                                        <EditRow label="Full Name"      value={name}        onChangeText={setName} />
                                        <EditRow label="Phone Number"   value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
                                        <EditRow label="Current Address" value={address}    onChangeText={setAddress} />
                                    </>
                                ) : (
                                    <>
                                        <InfoRow label="Full Name"       value={user?.name} />
                                        <InfoRow label="Phone Number"    value={user?.phoneNumber} />
                                        <InfoRow label="Current Address" value={user?.address} />
                                    </>
                                )}
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Guardian Details</Text>
                            <View style={styles.card}>
                                {editMode ? (
                                    <>
                                        <EditRow label="Guardian Name"  value={localGuardianName}  onChangeText={setLocalGuardianName} />
                                        <EditRow label="Guardian Phone" value={localGuardianPhone} onChangeText={setLocalGuardianPhone} keyboardType="phone-pad" />
                                    </>
                                ) : (
                                    <>
                                        <InfoRow label="Guardian Name"  value={user?.localGuardianName} />
                                        <InfoRow label="Guardian Phone" value={user?.localGuardianPhone} />
                                    </>
                                )}
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Academic & Preferences</Text>
                            <View style={styles.card}>
                                {editMode ? (
                                    <>
                                        <EditRow label="College"        value={college}         onChangeText={setCollege} />
                                        <EditRow label="Location"       value={location}        onChangeText={setLocation} />
                                        <EditRow label="Hometown"       value={hometownAddress} onChangeText={setHometownAddress} />
                                        <EditRow label="Monthly Budget" value={budget}          onChangeText={setBudget} keyboardType="numeric" />
                                    </>
                                ) : (
                                    <>
                                        <InfoRow label="College"        value={user?.college} />
                                        <InfoRow label="Location"       value={user?.location} />
                                        <InfoRow label="Hometown"       value={user?.hometownAddress} />
                                        <InfoRow label="Monthly Budget" value={user?.budget} />
                                    </>
                                )}
                            </View>
                        </View>
                    </>
                ) : (
                    /* ══════════════════════════════════════════════════════════
                       RESTAURANT FIELDS
                       ══════════════════════════════════════════════════════════ */
                    <>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Restaurant Profile</Text>
                            <View style={styles.card}>
                                {editMode ? (
                                    <>
                                        <EditRow label="Restaurant Name" value={restaurantName} onChangeText={setRestaurantName} />
                                        <EditRow label="Owner Name"      value={ownerName}      onChangeText={setOwnerName} />
                                        <EditRow label="Opening Year"    value={openingYear}    onChangeText={setOpeningYear} keyboardType="numeric" />
                                        <EditRow label="Capacity"        value={maxCapacity}    onChangeText={setMaxCapacity} keyboardType="numeric" />
                                    </>
                                ) : (
                                    <>
                                        <InfoRow label="Restaurant Name" value={user?.restaurantName} />
                                        <InfoRow label="Owner Name"      value={user?.ownerName} />
                                        <InfoRow label="Opening Year"    value={user?.openingYear} />
                                        <InfoRow label="Capacity"        value={user?.maxCapacity} />
                                    </>
                                )}
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Contact & Location</Text>
                            <View style={styles.card}>
                                {editMode ? (
                                    <>
                                        <EditRow label="Professional Phone"    value={restPhone}   onChangeText={setRestPhone} keyboardType="phone-pad" />
                                        <EditRow label="Restaurant Address"    value={restAddress} onChangeText={setRestAddress} />
                                        <EditRow label="Location / Area"       value={restLocation} onChangeText={setRestLocation} />
                                    </>
                                ) : (
                                    <>
                                        <InfoRow label="Professional Phone"  value={user?.phoneNumber} />
                                        <InfoRow label="Restaurant Address"  value={user?.address} />
                                        <InfoRow label="Location"            value={user?.location} />
                                    </>
                                )}
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Business Details</Text>
                            <View style={styles.card}>
                                {editMode ? (
                                    <>
                                        <EditRow label="FSSAI License"   value={fssaiLicense}   onChangeText={setFssaiLicense} />
                                        <EditRow label="Specializations" value={specifications} onChangeText={setSpecifications} />
                                    </>
                                ) : (
                                    <>
                                        <InfoRow label="FSSAI License"   value={user?.fssaiLicense} />
                                        <InfoRow label="Specializations" value={user?.specifications} />
                                    </>
                                )}
                            </View>
                        </View>
                    </>
                )}

                {/* ── Action Buttons ───────────────────────────────────────── */}
                {!editMode ? (
                    <>
                        <TouchableOpacity style={styles.requestBtn} onPress={handleRequestEdit}>
                            <Text style={styles.requestBtnText}>✏️  Request Information Update</Text>
                        </TouchableOpacity>
                        <Text style={styles.footerNote}>
                            Tap above to edit your mutable details. Changes will require admin re-verification.
                        </Text>
                    </>
                ) : (
                    <View style={styles.editActions}>
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={handleCancelEdit}
                            disabled={saving}
                        >
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.doneBtn, saving && { opacity: 0.6 }]}
                            onPress={handleDoneChanges}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.doneBtnText}>Done Changes</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: Spacing.md,
        paddingBottom: 50,
    },

    // ── Edit banner ────────────────────────────────────────────────────────────
    editBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FFF7ED',
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: '#FED7AA',
        padding: 12,
        marginBottom: Spacing.md,
        gap: 10,
    },
    editBannerIcon:  { fontSize: 20, marginTop: 1 },
    editBannerTitle: { fontSize: 13, fontWeight: '800', color: '#92400E', marginBottom: 2 },
    editBannerSub:   { fontSize: 11, color: '#B45309', lineHeight: 16 },

    // ── Section ────────────────────────────────────────────────────────────────
    section: { marginBottom: Spacing.lg },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: Colors.textLight,
        marginBottom: 8,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
    },

    // ── Read-only row ─────────────────────────────────────────────────────────
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight || '#F3F4F6',
    },
    infoLabel: {
        fontSize: 13,
        color: Colors.textLight,
        fontWeight: '500',
        flex: 1,
    },
    infoValue: {
        fontSize: 13,
        color: Colors.text,
        fontWeight: '600',
        flex: 1.4,
        textAlign: 'right',
        marginLeft: 12,
    },

    // ── KYC badge ─────────────────────────────────────────────────────────────
    kycBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: BorderRadius.round,
    },
    kycBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
    },

    // ── Edit row ──────────────────────────────────────────────────────────────
    editRow: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight || '#F3F4F6',
        paddingVertical: 6,
    },
    editLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    editInput: {
        fontSize: 14,
        color: Colors.text,
        fontWeight: '600',
        paddingVertical: 4,
    },

    // ── Action buttons ────────────────────────────────────────────────────────
    requestBtn: {
        marginTop: Spacing.lg,
        backgroundColor: Colors.surface,
        borderWidth: 1.5,
        borderColor: Colors.primary,
        height: 52,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    requestBtnText: {
        color: Colors.primary,
        fontSize: 15,
        fontWeight: '700',
    },
    footerNote: {
        textAlign: 'center',
        fontSize: 12,
        color: Colors.textLight,
        marginTop: 12,
        lineHeight: 17,
    },

    editActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: Spacing.xl,
    },
    cancelBtn: {
        flex: 1,
        height: 52,
        borderRadius: BorderRadius.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.surface,
    },
    cancelBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    doneBtn: {
        flex: 2,
        height: 52,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    doneBtnText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FFFFFF',
    },
} as any);

export default PersonalDetailsScreen;
