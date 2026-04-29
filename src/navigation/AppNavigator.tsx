import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../styles/theme';

// Import Screens
import SplashScreen from '../screens/Splash/SplashScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import RestaurantListScreen from '../screens/Restaurant/RestaurantListScreen';
import MenuScreen from '../screens/Restaurant/MenuScreen';
import MealDetailScreen from '../screens/Restaurant/MealDetailScreen';
import WalletScreen from '../screens/Wallet/WalletScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import PersonalDetailsScreen from '../screens/Profile/PersonalDetailsScreen';
import RestaurantDashboardScreen from '../screens/RestaurantOwner/RestaurantDashboardScreen';
import ManageMenuScreen from '../screens/RestaurantOwner/MenuManagement/ManageMenuScreen';
import MealHistoryScreen from '../screens/MealHistory/MealHistoryScreen';
import AddMoneyScreen from '../screens/Wallet/AddMoneyScreen';
import PlanDetailScreen from '../screens/Subscription/PlanDetailScreen';
import RestaurantSelectionScreen from '../screens/Subscription/RestaurantSelectionScreen';
import SubscriptionHistoryScreen from '../screens/Profile/SubscriptionHistoryScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Tab Bar Icon Component
const TabIcon = ({ label, focused }: { label: string; focused: boolean }) => {
    const getIcon = () => {
        switch (label) {
            case 'Home':      return '🏠';
            case 'Wallet':    return '💰';
            case 'Profile':   return '👤';
            case 'Dashboard': return '📊';
            default:          return '●';
        }
    };

    return (
        <View style={[styles.tabIconContainer, focused && styles.tabIconContainerFocused]}>
            <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.45 }]}>
                {getIcon()}
            </Text>
            <Text
                style={[styles.tabLabel, { color: focused ? Colors.primary : Colors.textLight }]}
                numberOfLines={1}
            >
                {label}
            </Text>
        </View>
    );
};

const MainTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarShowLabel: false,
            }}
        >
            <Tab.Screen
                name="HomeTab"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon label="Home" focused={focused} />
                }}
            />
            <Tab.Screen
                name="WalletTab"
                component={WalletScreen}
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon label="Wallet" focused={focused} />
                }}
            />
            <Tab.Screen
                name="ProfileTab"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon label="Profile" focused={focused} />
                }}
            />
        </Tab.Navigator>
    );
};

const RestaurantTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarShowLabel: false,
            }}
        >
            <Tab.Screen
                name="RestaurantDashboardTab"
                component={RestaurantDashboardScreen}
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon label="Dashboard" focused={focused} />
                }}
            />
            <Tab.Screen
                name="ProfileTab"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon label="Profile" focused={focused} />
                }}
            />
        </Tab.Navigator>
    );
};

const AuthStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
        </Stack.Navigator>
    );
};

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="Auth" component={AuthStack} />
                <Stack.Screen name="Main" component={MainTabNavigator} />
                <Stack.Screen name="RestaurantMain" component={RestaurantTabNavigator} />

                {/* Screens outside Tab Navigation */}
                <Stack.Screen name="Restaurants" component={RestaurantListScreen} />
                <Stack.Screen name="Menu" component={MenuScreen} />
                <Stack.Screen name="MealDetail" component={MealDetailScreen} />
                <Stack.Screen name="PersonalDetails" component={PersonalDetailsScreen} />
                <Stack.Screen name="MealHistory"             component={MealHistoryScreen} />
                <Stack.Screen name="ManageMenu"              component={ManageMenuScreen} />
                <Stack.Screen name="AddMoney"                component={AddMoneyScreen} />
                <Stack.Screen name="PlanDetail"              component={PlanDetailScreen} />
                <Stack.Screen name="RestaurantSelection"     component={RestaurantSelectionScreen} />
                <Stack.Screen name="SubscriptionHistory"     component={SubscriptionHistoryScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    tabBar: {
        height: 72,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingBottom: 8,
        paddingTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 10,
    },
    tabIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
        paddingHorizontal: 6,
        borderRadius: 12,
        minWidth: 52,
        maxWidth: 80,
    },
    tabIconContainerFocused: {
        backgroundColor: Colors.primaryLight,
    },
    tabIcon: {
        fontSize: 22,
        marginBottom: 3,
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.2,
        textAlign: 'center',
    },
});

export default AppNavigator;
