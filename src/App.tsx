import React from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './navigation/AppNavigator';
import { Colors } from './styles/theme';
import { AuthProvider } from './context/AuthContext';


import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';

const App = () => {
  return (
    <StripeProvider
      publishableKey="pk_test_51SxWFfFG8NO0TTjZRA7LCIXjGWpUUvbVx5Dgc4UhyLC86KfQWSX0oq7yMRrDikD9rQuNVuyCxo7I9IVq3sWbLYsK00SuOhXUPC"
      merchantIdentifier="merchant.com.annpurna" // required for Apple Pay
    >
      <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent={true}
        />
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </GestureHandlerRootView>
      </SafeAreaProvider>
    </StripeProvider>
  );
};

export default App;