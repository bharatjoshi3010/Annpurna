import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, BorderRadius } from '../../styles/theme';
import Header from '../../components/Header';
import { API_BASE_URL } from '../../config';

const MenuScreen = ({ navigation, route }: any) => {
    const { restaurantId, restaurantName } = route?.params || {};
    const [allMenus, setAllMenus] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [currentMeal, setCurrentMeal] = React.useState('');

    const getCurrentMealType = () => {
        const hour = new Date().getHours();
        if (hour < 11) return 'Breakfast';
        if (hour < 16) return 'Lunch';
        return 'Dinner';
    };

    React.useEffect(() => {
        setCurrentMeal(getCurrentMealType());
        if (restaurantId) {
            fetchMenu();
        }
    }, [restaurantId]);

    const fetchMenu = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/menu/${restaurantId}?date=${new Date().toISOString()}`);
            const data = await response.json();
            if (response.ok) {
                setAllMenus(data);
            }
        } catch (error) {
            console.error('Error fetching menu:', error);
        } finally {
            setLoading(false);
        }
    };

    const servingMenu = allMenus.find(m => m.mealType === currentMeal);
    const otherMenus = allMenus.filter(m => m.mealType !== currentMeal);

    const renderFoodItem = (item: any, isLarge = false) => (
        <View style={isLarge ? styles.largeItemCard : styles.menuItem} key={item.name + Math.random()}>
            <View style={isLarge ? styles.largeItemImageContainer : styles.itemImageContainer}>
                 {item.image ? (
                     <Image source={{ uri: item.image }} style={styles.mealItemImage} />
                 ) : (
                     <Text style={styles.itemEmoji}>🍲</Text>
                 )}
            </View>
            <View style={isLarge ? styles.largeItemInfo : styles.menuItemInfo}>
                <Text style={isLarge ? styles.largeItemName : styles.itemName}>{item.name}</Text>
                <Text style={styles.itemCategory}>{isLarge ? 'Recommended for you' : 'Freshly Prepared'}</Text>
            </View>
            {!isLarge && <View style={styles.statusDot} />}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Header title={restaurantName || 'Menu'} showBack onBackPress={() => navigation.goBack()} />

            {loading ? (
                <View style={styles.centerLoading}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={[Typography.body, { marginTop: 10 }]}>Loading today's menu...</Text>
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Currently Serving Hero Section */}
                    <View style={styles.heroSection}>
                        <View style={styles.servingHeader}>
                            <View style={styles.servingBadge}>
                                <View style={styles.pulseDot} />
                                <Text style={styles.servingBadgeText}>CURRENTLY SERVING: {currentMeal.toUpperCase()}</Text>
                            </View>
                            <Text style={styles.timeInfo}>Until {currentMeal === 'Breakfast' ? '11:00 AM' : currentMeal === 'Lunch' ? '04:00 PM' : '10:30 PM'}</Text>
                        </View>

                        <Text style={[Typography.h2, styles.sectionTitle]}>Special for {currentMeal}</Text>
                        
                        {servingMenu && servingMenu.items.length > 0 ? (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.largeItemsList}>
                                {servingMenu.items.map((item: any) => renderFoodItem(item, true))}
                            </ScrollView>
                        ) : (
                            <View style={styles.emptyServing}>
                                <Text style={styles.emptyText}>No special items listed for {currentMeal} yet.</Text>
                            </View>
                        )}
                    </View>

                    {/* Full Menu Section */}
                    <View style={styles.fullMenuSection}>
                        <View style={styles.divider} />
                        <Text style={[Typography.h2, styles.sectionTitle]}>Browse Full Menu</Text>
                        
                        {allMenus.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No menu items listed for today.</Text>
                            </View>
                        ) : (
                            allMenus.sort((a,b) => {
                                const order = { 'Breakfast': 1, 'Lunch': 2, 'Dinner': 3 };
                                return order[a.mealType as keyof typeof order] - order[b.mealType as keyof typeof order];
                            }).map((menuSlot) => (
                                <View key={menuSlot._id} style={styles.mealTypeSection}>
                                    <View style={styles.mealTypeHeader}>
                                        <Text style={styles.mealTypeText}>{menuSlot.mealType}</Text>
                                        <View style={styles.line} />
                                    </View>
                                    {menuSlot.items.map((item: any) => renderFoodItem(item))}
                                </View>
                            ))
                        )}
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    centerLoading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: Spacing.xl,
    },
    heroSection: {
        backgroundColor: '#FFF',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
    },
    servingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    servingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 126, 33, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
        marginRight: 8,
    },
    servingBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.primary,
        letterSpacing: 0.5,
    },
    timeInfo: {
        fontSize: 12,
        color: Colors.textLight,
        fontWeight: '600',
    },
    sectionTitle: {
        marginBottom: Spacing.md,
        color: Colors.text,
    },
    largeItemsList: {
        paddingRight: Spacing.md,
    },
    largeItemCard: {
        width: 200,
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        marginRight: Spacing.md,
        padding: 10,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    largeItemImageContainer: {
        width: '100%',
        height: 140,
        borderRadius: BorderRadius.md,
        backgroundColor: '#F9F9F9',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginBottom: 10,
    },
    largeItemInfo: {
        paddingHorizontal: 4,
    },
    largeItemName: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    fullMenuSection: {
        padding: Spacing.md,
        marginTop: Spacing.sm,
    },
    divider: {
        height: 1,
        backgroundColor: '#EEE',
        marginVertical: Spacing.lg,
    },
    mealTypeSection: {
        marginBottom: Spacing.lg,
    },
    mealTypeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    mealTypeText: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.textLight,
        marginRight: 10,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#F0F0F0',
    },
    menuItem: {
        backgroundColor: Colors.white,
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.sm,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    itemImageContainer: {
        width: 60,
        height: 60,
        borderRadius: BorderRadius.sm,
        backgroundColor: '#F9F9F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
        overflow: 'hidden',
    },
    mealItemImage: {
        width: '100%',
        height: '100%',
    },
    menuItemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    itemCategory: {
        fontSize: 12,
        color: Colors.textLight,
        marginTop: 2,
    },
    itemEmoji: {
        fontSize: 24,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.success,
        marginLeft: Spacing.sm,
        opacity: 0.5,
    },
    emptyServing: {
        padding: 30,
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
        borderRadius: BorderRadius.md,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: Colors.textLight,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});

export default MenuScreen;
