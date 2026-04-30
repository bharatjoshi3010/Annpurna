import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, BorderRadius } from '../../styles/theme';
import Header from '../../components/Header';

const SupportScreen = () => {
    const bharatDetails = {
        name: 'Bharat Joshi',
        title: 'MCA Final Year Student',
        project: 'Annpurna - Prepaid Meal Network',
        bio: "Hey there! I'm Bharat, a caffeine-dependent MCA student currently navigating the chaos of my final year project. Annpurna is the result of many sleepless nights, excessive debugging, and a dream of fixing the hostel mess system once and for all. If you're using this app, you're literally looking at my graduation ticket — so please be gentle!",
        phones: ['+91 9411537194', '+91 9458922638'],
        socials: [
            { name: 'WhatsApp', icon: '💬', value: 'Chat with Bharat', url: 'https://wa.me/919411537194' },
            { name: 'Instagram', icon: '📸', value: '@bharatjoshi3010', url: 'https://instagram.com/bharatjoshi3010' },
            { name: 'LinkedIn', icon: '💼', value: 'Bharat Joshi', url: 'https://www.linkedin.com/in/bharat-joshi-3303a01b0' },
            { name: 'GitHub', icon: '📂', value: 'bharatjoshi3010', url: 'https://github.com/bharatjoshi3010' },
        ]
    };

    const handleLink = (url: string) => {
        Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    };

    return (
        <SafeAreaView style={styles.container}>
            <Header title="HELP & SUPPORT" />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                
                {/* Developer Profile Card */}
                <View style={styles.devCard}>
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarEmoji}>👨‍💻</Text>
                    </View>
                    <Text style={styles.devName}>{bharatDetails.name}</Text>
                    <Text style={styles.devTitle}>{bharatDetails.title}</Text>
                    
                    <View style={styles.tagContainer}>
                        <View style={styles.tag}><Text style={styles.tagText}>DEVELOPER</Text></View>
                        <View style={[styles.tag, { backgroundColor: '#E3F2FD' }]}><Text style={[styles.tagText, { color: '#1976D2' }]}>FINAL YEAR PROJECT</Text></View>
                    </View>

                    <Text style={styles.bioText}>{bharatDetails.bio}</Text>
                </View>

                <Text style={styles.sectionTitle}>GET IN TOUCH</Text>

                {/* Contact Options */}
                {bharatDetails.socials.map((social, index) => (
                    <TouchableOpacity 
                        key={index} 
                        style={styles.socialCard}
                        onPress={() => handleLink(social.url)}
                    >
                        <View style={styles.socialIconBox}>
                            <Text style={styles.socialIcon}>{social.icon}</Text>
                        </View>
                        <View style={styles.socialInfo}>
                            <Text style={styles.socialName}>{social.name}</Text>
                            <Text style={styles.socialValue}>{social.value}</Text>
                        </View>
                        <Text style={styles.arrow}>›</Text>
                    </TouchableOpacity>
                ))}

                <View style={styles.callSection}>
                    <Text style={styles.callTitle}>Direct Emergency Helpline (SOS)</Text>
                    {bharatDetails.phones.map((phone, idx) => (
                        <TouchableOpacity 
                            key={idx} 
                            style={styles.phoneRow}
                            onPress={() => handleLink(`tel:${phone.replace(/\s/g, '')}`)}
                        >
                            <Text style={styles.phoneIcon}>📞</Text>
                            <Text style={styles.phoneNumber}>{phone}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Made with 🧡 in India</Text>
                    <Text style={styles.versionText}>Annpurna v1.0.0</Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        padding: Spacing.md,
    },
    devCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFF1E8',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
        borderWidth: 3,
        borderColor: Colors.primaryLight,
    },
    avatarEmoji: {
        fontSize: 50,
    },
    devName: {
        fontSize: 22,
        fontWeight: '900',
        color: Colors.text,
    },
    devTitle: {
        fontSize: 14,
        color: Colors.textLight,
        marginTop: 2,
    },
    tagContainer: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
        marginBottom: 20,
    },
    tag: {
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
    },
    tagText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#E65100',
        letterSpacing: 0.5,
    },
    bioText: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        fontStyle: 'italic',
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1.5,
        color: Colors.textLight,
        marginBottom: 12,
        marginLeft: 4,
    },
    socialCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: BorderRadius.md,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    socialIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    socialIcon: {
        fontSize: 20,
    },
    socialInfo: {
        flex: 1,
    },
    socialName: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textLight,
        textTransform: 'uppercase',
    },
    socialValue: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text,
        marginTop: 1,
    },
    arrow: {
        fontSize: 24,
        color: '#DDD',
    },
    callSection: {
        marginTop: Spacing.xl,
        backgroundColor: '#FFF8E1',
        padding: 20,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: '#FFE082',
    },
    callTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#795548',
        marginBottom: 16,
        textAlign: 'center',
    },
    phoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        gap: 12,
    },
    phoneIcon: {
        fontSize: 18,
    },
    phoneNumber: {
        fontSize: 18,
        fontWeight: '900',
        color: '#5D4037',
        letterSpacing: 1,
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
        paddingBottom: 20,
    },
    footerText: {
        fontSize: 12,
        color: Colors.textLight,
        fontWeight: '600',
    },
    versionText: {
        fontSize: 10,
        color: '#CCC',
        marginTop: 4,
    }
});

export default SupportScreen;
