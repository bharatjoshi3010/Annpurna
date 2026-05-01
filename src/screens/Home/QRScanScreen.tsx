import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ActivityIndicator, Animated, Easing, KeyboardAvoidingView,
    Platform, ScrollView, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import { Colors, Spacing, BorderRadius } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';

const { width: SCREEN_W } = Dimensions.get('window');
const SCAN_BOX = SCREEN_W * 0.65;

// ─── Success Checkmark Animation ─────────────────────────────────────────────
const SuccessAnimation = ({ onDone }: { onDone: () => void }) => {
    const scale   = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.parallel([
                Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 5 }),
                Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]),
            Animated.delay(1800),
            Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => onDone());
    }, []);

    return (
        <View style={successStyles.container}>
            <Animated.View style={[successStyles.circle, { transform: [{ scale }], opacity }]}>
                <Text style={successStyles.check}>✓</Text>
            </Animated.View>
            <Animated.Text style={[successStyles.label, { opacity }]}>Meal Confirmed!</Animated.Text>
            <Animated.Text style={[successStyles.sub, { opacity }]}>Enjoy your meal 🎉</Animated.Text>
        </View>
    );
};

const successStyles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
    circle: {
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: '#4CAF50',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35, shadowRadius: 16, elevation: 12,
    },
    check:  { fontSize: 56, color: '#FFF', fontWeight: '900' },
    label:  { fontSize: 26, fontWeight: '900', color: Colors.text, letterSpacing: -0.5 },
    sub:    { fontSize: 16, color: Colors.textSecondary, marginTop: 8 },
});

// ─── Camera QR Tab ────────────────────────────────────────────────────────────
const CameraTab = ({
    onTokenFound,
    isActive,
}: {
    onTokenFound: (token: string) => void;
    isActive: boolean;
}) => {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const device = useCameraDevice('back');

    useEffect(() => {
        Camera.requestCameraPermission().then(status => {
            setHasPermission(status === 'granted');
        });
    }, []);

    const codeScanner = useCodeScanner({
        codeTypes: ['qr'],
        onCodeScanned: (codes) => {
            if (scanned || !isActive) return;
            const value = codes[0]?.value;
            if (!value) return;

            // Parse token from "annpurna://meal/validate/XXXXXXXX"
            const parts = value.split('/');
            const token = parts[parts.length - 1];
            if (token && token.length === 8) {
                setScanned(true);
                onTokenFound(token);
            }
        },
    });

    if (hasPermission === null) {
        return (
            <View style={camStyles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={camStyles.permText}>Requesting camera access…</Text>
            </View>
        );
    }
    if (!hasPermission) {
        return (
            <View style={camStyles.center}>
                <Text style={camStyles.noPermIcon}>📷</Text>
                <Text style={camStyles.noPermTitle}>Camera Access Required</Text>
                <Text style={camStyles.noPermSub}>
                    Please allow camera access in your device settings to scan QR codes.
                </Text>
                <TouchableOpacity
                    style={camStyles.settingsBtn}
                    onPress={() => Camera.requestCameraPermission().then(s => setHasPermission(s === 'granted'))}
                >
                    <Text style={camStyles.settingsBtnText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }
    if (!device) {
        return (
            <View style={camStyles.center}>
                <Text style={camStyles.noPermTitle}>No Camera Found</Text>
            </View>
        );
    }

    return (
        <View style={camStyles.wrapper}>
            <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={isActive && !scanned}
                codeScanner={codeScanner}
            />

            {/* Dark overlay with cutout */}
            <View style={camStyles.overlay}>
                {/* Top dark bar */}
                <View style={[camStyles.darkBar, { flex: 1 }]} />

                {/* Middle row: dark | scan box | dark */}
                <View style={camStyles.middleRow}>
                    <View style={camStyles.darkSide} />
                    <View style={camStyles.scanBox}>
                        {/* Corner brackets */}
                        <View style={[camStyles.corner, camStyles.tl]} />
                        <View style={[camStyles.corner, camStyles.tr]} />
                        <View style={[camStyles.corner, camStyles.bl]} />
                        <View style={[camStyles.corner, camStyles.br]} />
                        {/* Scan line */}
                        <ScanLine />
                    </View>
                    <View style={camStyles.darkSide} />
                </View>

                {/* Bottom dark bar */}
                <View style={[camStyles.darkBar, { flex: 1.5 }]}>
                    <Text style={camStyles.scanHint}>
                        Point the camera at the QR code on the{'\n'}restaurant owner's screen
                    </Text>
                </View>
            </View>

            {/* Scanned flash */}
            {scanned && (
                <View style={camStyles.scannedOverlay}>
                    <ActivityIndicator size="large" color="#FFF" />
                    <Text style={camStyles.scannedText}>Verifying…</Text>
                </View>
            )}
        </View>
    );
};

// Animated scan line
const ScanLine = () => {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(anim, { toValue: 1, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
                Animated.timing(anim, { toValue: 0, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
            ])
        ).start();
    }, []);
    const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, SCAN_BOX - 4] });
    return (
        <Animated.View style={[camStyles.scanLine, { transform: [{ translateY }] }]} />
    );
};

const camStyles = StyleSheet.create({
    wrapper: { flex: 1, position: 'relative', backgroundColor: '#000' },
    center:  { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: Colors.background },
    permText:       { marginTop: 12, fontSize: 14, color: Colors.textSecondary },
    noPermIcon:     { fontSize: 52, marginBottom: 16 },
    noPermTitle:    { fontSize: 20, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: 8 },
    noPermSub:      { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    settingsBtn:    { backgroundColor: Colors.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 24 },
    settingsBtnText:{ color: '#FFF', fontWeight: '800', fontSize: 14 },

    overlay:    { ...StyleSheet.absoluteFillObject, flexDirection: 'column' },
    darkBar:    { backgroundColor: 'rgba(0,0,0,0.6)', width: '100%', justifyContent: 'flex-end', paddingBottom: 20 },
    middleRow:  { flexDirection: 'row', height: SCAN_BOX },
    darkSide:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
    scanBox:    { width: SCAN_BOX, height: SCAN_BOX, position: 'relative' },

    corner:     { position: 'absolute', width: 24, height: 24, borderColor: Colors.primary, borderWidth: 3 },
    tl:         { top: 0,    left: 0,  borderRightWidth: 0, borderBottomWidth: 0 },
    tr:         { top: 0,    right: 0, borderLeftWidth: 0,  borderBottomWidth: 0 },
    bl:         { bottom: 0, left: 0,  borderRightWidth: 0, borderTopWidth: 0    },
    br:         { bottom: 0, right: 0, borderLeftWidth: 0,  borderTopWidth: 0    },

    scanLine: {
        position: 'absolute', left: 8, right: 8, height: 2,
        backgroundColor: Colors.primary,
        shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9, shadowRadius: 4, elevation: 4,
    },
    scanHint: { color: 'rgba(255,255,255,0.8)', textAlign: 'center', fontSize: 13, lineHeight: 20 },

    scannedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center', alignItems: 'center', gap: 12,
    },
    scannedText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
} as any);

// ─── Manual Code Tab ──────────────────────────────────────────────────────────
const ManualTab = ({
    onSubmit,
}: {
    onSubmit: (token: string) => void;
}) => {
    const [token, setToken]   = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError]   = useState('');
    const shakeX = useRef(new Animated.Value(0)).current;

    const shake = () => {
        Animated.sequence([
            Animated.timing(shakeX, { toValue: 10,  duration: 60, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue: -10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue: 8,   duration: 60, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue: -8,  duration: 60, useNativeDriver: true }),
            Animated.timing(shakeX, { toValue: 0,   duration: 60, useNativeDriver: true }),
        ]).start();
    };

    const handleVerify = () => {
        const trimmed = token.trim().toUpperCase();
        if (trimmed.length < 8) {
            setError('Please enter the full 8-character code.');
            shake();
            return;
        }
        setError('');
        onSubmit(trimmed);
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={manualStyles.scroll} keyboardShouldPersistTaps="handled">
                <View style={manualStyles.iconRing}>
                    <Text style={manualStyles.icon}>⌨️</Text>
                </View>
                <Text style={manualStyles.heading}>Enter the Code</Text>
                <Text style={manualStyles.sub}>
                    Type the <Text style={manualStyles.highlight}>8-character code</Text> shown
                    below the QR on the restaurant owner's screen.
                </Text>

                <Text style={manualStyles.inputLabel}>ENTER CODE</Text>
                <Animated.View style={{ transform: [{ translateX: shakeX }] }}>
                    <TextInput
                        style={[manualStyles.input, error ? manualStyles.inputError : null]}
                        value={token}
                        onChangeText={t => { setToken(t.toUpperCase()); setError(''); }}
                        placeholder="e.g. AB3K9ZXQ"
                        placeholderTextColor="#C0C0C0"
                        maxLength={8}
                        autoCapitalize="characters"
                        autoCorrect={false}
                        returnKeyType="done"
                        onSubmitEditing={handleVerify}
                    />
                </Animated.View>

                {/* Live character tiles */}
                {token.length > 0 && (
                    <View style={manualStyles.tokenDisplay}>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    manualStyles.tokenSlot,
                                    token[i] ? manualStyles.tokenSlotFilled : manualStyles.tokenSlotEmpty,
                                ]}
                            >
                                <Text style={[manualStyles.tokenSlotText, token[i] ? manualStyles.tokenSlotTextFilled : {}]}>
                                    {token[i] || ''}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {!!error && (
                    <View style={manualStyles.errorBox}>
                        <Text style={manualStyles.errorIcon}>⚠️</Text>
                        <Text style={manualStyles.errorText}>{error}</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[manualStyles.submitBtn, token.trim().length < 8 && manualStyles.submitBtnDisabled]}
                    onPress={handleVerify}
                    disabled={token.trim().length < 8}
                    activeOpacity={0.85}
                >
                    <Text style={manualStyles.submitText}>✓ Confirm Meal</Text>
                </TouchableOpacity>

                <View style={manualStyles.infoSection}>
                    {[
                        { emoji: '⏱', title: 'Code expires in 10 min',      sub: 'Ask the owner to regenerate if it expires.' },
                        { emoji: '🔒', title: 'One-time use',                sub: 'Each code can only be used once per meal.' },
                        { emoji: '👤', title: 'Linked to your account',      sub: 'Only you can confirm your meal code.' },
                    ].map(({ emoji, title, sub }) => (
                        <View key={title} style={manualStyles.infoCard}>
                            <Text style={manualStyles.infoEmoji}>{emoji}</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={manualStyles.infoTitle}>{title}</Text>
                                <Text style={manualStyles.infoSub}>{sub}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const manualStyles = StyleSheet.create({
    scroll:       { padding: Spacing.lg, paddingBottom: 40 },
    iconRing: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center', alignItems: 'center',
        alignSelf: 'center', marginBottom: 16,
    },
    icon:    { fontSize: 36 },
    heading: { fontSize: 22, fontWeight: '900', color: Colors.text, textAlign: 'center', marginBottom: 8 },
    sub:     { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.lg },
    highlight: { color: Colors.primary, fontWeight: '700' },

    inputLabel: { fontSize: 11, fontWeight: '800', color: Colors.textLight, letterSpacing: 1.5, marginBottom: 8 },
    input: {
        backgroundColor: Colors.surface,
        borderWidth: 2, borderColor: Colors.border,
        borderRadius: BorderRadius.md,
        paddingHorizontal: 20, paddingVertical: 14,
        fontSize: 22, fontWeight: '900', letterSpacing: 6,
        color: Colors.text, textAlign: 'center',
        marginBottom: 12,
    },
    inputError:  { borderColor: '#EF4444' },

    tokenDisplay: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 16 },
    tokenSlot:    { width: 34, height: 42, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
    tokenSlotFilled: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    tokenSlotEmpty:  { backgroundColor: Colors.surface, borderColor: Colors.border },
    tokenSlotText:       { fontSize: 17, fontWeight: '900' },
    tokenSlotTextFilled: { color: '#FFFFFF' },

    errorBox: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        backgroundColor: '#FFF1F2', borderRadius: BorderRadius.md,
        padding: 12, borderLeftWidth: 3, borderLeftColor: '#EF4444', marginBottom: 16,
    },
    errorIcon: { fontSize: 16 },
    errorText: { flex: 1, fontSize: 13, color: '#991B1B', lineHeight: 20 },

    submitBtn: {
        backgroundColor: Colors.primary,
        paddingVertical: 15, borderRadius: BorderRadius.lg,
        alignItems: 'center', marginBottom: Spacing.xl,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
    },
    submitBtnDisabled: { opacity: 0.45 },
    submitText: { color: '#FFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },

    infoSection: { gap: 10 },
    infoCard: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
        padding: 14, borderWidth: 1, borderColor: Colors.border,
    },
    infoEmoji: { fontSize: 20 },
    infoTitle: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 2 },
    infoSub:   { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
} as any);

// ─── Main Screen ──────────────────────────────────────────────────────────────
type Tab = 'camera' | 'manual';

const QRScanScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('camera');
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState('');
    const [success, setSuccess]     = useState(false);

    const submitToken = useCallback(async (token: string) => {
        setLoading(true);
        setError('');
        try {
            const res  = await fetch(`${API_BASE_URL}/api/meals/validate-qr`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, studentId: user._id }),
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess(true);
            } else {
                setError(data.message || 'Invalid code. Please try again.');
                // switch to manual tab so user can re-enter
                setActiveTab('manual');
            }
        } catch {
            setError('Network error. Check your connection.');
            setActiveTab('manual');
        } finally {
            setLoading(false);
        }
    }, [user._id]);

    if (success) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                <SuccessAnimation onDone={() => navigation.goBack()} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Verify Meal</Text>
                <View style={{ width: 60 }} />
            </View>

            {/* Tab toggle */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tabBtn, activeTab === 'camera' && styles.tabBtnActive]}
                    onPress={() => { setActiveTab('camera'); setError(''); }}
                >
                    <Text style={[styles.tabBtnText, activeTab === 'camera' && styles.tabBtnTextActive]}>
                        📷 Scan QR
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabBtn, activeTab === 'manual' && styles.tabBtnActive]}
                    onPress={() => { setActiveTab('manual'); setError(''); }}
                >
                    <Text style={[styles.tabBtnText, activeTab === 'manual' && styles.tabBtnTextActive]}>
                        ⌨️ Enter Code
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Global error (from camera scan failure) */}
            {!!error && (
                <View style={styles.globalError}>
                    <Text style={styles.globalErrorIcon}>⚠️</Text>
                    <Text style={styles.globalErrorText}>{error}</Text>
                </View>
            )}

            {/* Loading overlay */}
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Verifying your code…</Text>
                </View>
            )}

            {/* Tab content */}
            <View style={{ flex: 1 }}>
                {activeTab === 'camera' ? (
                    <CameraTab onTokenFound={submitToken} isActive={activeTab === 'camera' && !loading && !success} />
                ) : (
                    <ManualTab onSubmit={submitToken} />
                )}
            </View>
        </SafeAreaView>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.md, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    backBtn:     { width: 60 },
    backText:    { fontSize: 15, color: Colors.primary, fontWeight: '700' },
    headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },

    tabBar: {
        flexDirection: 'row',
        margin: Spacing.md,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: 4,
        borderWidth: 1, borderColor: Colors.border,
    },
    tabBtn: {
        flex: 1, paddingVertical: 10, borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    tabBtnActive:     { backgroundColor: Colors.primary },
    tabBtnText:       { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
    tabBtnTextActive: { color: '#FFFFFF' },

    globalError: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#FFF1F2', marginHorizontal: Spacing.md,
        borderRadius: BorderRadius.md, padding: 12,
        borderLeftWidth: 3, borderLeftColor: '#EF4444', marginBottom: 4,
    },
    globalErrorIcon: { fontSize: 16 },
    globalErrorText: { flex: 1, fontSize: 13, color: '#991B1B', lineHeight: 20 },

    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center', alignItems: 'center',
        zIndex: 99, gap: 12,
    },
    loadingText: { fontSize: 14, fontWeight: '700', color: Colors.text },
} as any);

export default QRScanScreen;
