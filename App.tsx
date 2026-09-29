import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';

// Theme & Contexts
import { Colors } from './src/theme/colors';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SiteProvider } from './src/context/SiteContext';
import { NetworkProvider } from './src/context/NetworkContext';

// Screens
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { RegisterScreen } from './src/screens/auth/RegisterScreen';
import { HomeScreen } from './src/screens/dashboard/HomeScreen';
import { SitesListScreen } from './src/screens/sites/SitesListScreen';
import { CreateSiteScreen } from './src/screens/sites/CreateSiteScreen';
import { SiteDetailScreen } from './src/screens/sites/SiteDetailScreen';
import { SiteMembersScreen } from './src/screens/sites/SiteMembersScreen';
import { AddExpenseScreen } from './src/screens/expenses/AddExpenseScreen';
import { ExpenseListScreen } from './src/screens/expenses/ExpenseListScreen';
import { ExpenseDetailScreen } from './src/screens/expenses/ExpenseDetailScreen';
import { ItemSummaryScreen } from './src/screens/summary/ItemSummaryScreen';
import { MeasurementBookScreen } from './src/screens/summary/MeasurementBookScreen';
import { FinalReportScreen } from './src/screens/reports/FinalReportScreen';
import { ActivityLogScreen } from './src/screens/activity/ActivityLogScreen';
import { PendingSyncScreen } from './src/screens/offline/PendingSyncScreen';
import { ProfileScreen } from './src/screens/profile/ProfileScreen';
import { AdminSettingsScreen } from './src/screens/profile/AdminSettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18 }}>🏠</Text>
        }}
      />
      <Tab.Screen
        name="SitesTab"
        component={SitesListScreen}
        options={{
          tabBarLabel: 'Sites',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18 }}>🏗️</Text>
        }}
      />
      <Tab.Screen
        name="AddExpenseTab"
        component={AddExpenseScreen}
        options={{
          tabBarLabel: 'Add Expense',
          tabBarIcon: () => (
            <View style={styles.addExpenseTabBtn}>
              <Text style={styles.addExpenseTabIcon}>+</Text>
            </View>
          )
        }}
      />
      <Tab.Screen
        name="ReportsTab"
        component={FinalReportScreen}
        options={{
          tabBarLabel: 'Reports',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18 }}>📊</Text>
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18 }}>👤</Text>
        }}
      />
    </Tab.Navigator>
  );
}

function NavigationStack() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: Colors.accent, fontSize: 32, fontWeight: '900' }}>R2R</Text>
        <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '700', marginTop: 8 }}>Raw to Refined</Text>
        <Text style={{ color: Colors.textSecondary, fontSize: 12, marginTop: 4 }}>Loading Contractor Workspace...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
          <Stack.Screen name="SitesList" component={SitesListScreen} />
          <Stack.Screen name="CreateSite" component={CreateSiteScreen} />
          <Stack.Screen name="SiteDetail" component={SiteDetailScreen} />
          <Stack.Screen name="SiteMembers" component={SiteMembersScreen} />
          <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
          <Stack.Screen name="ExpenseList" component={ExpenseListScreen} />
          <Stack.Screen name="ExpenseDetail" component={ExpenseDetailScreen} />
          <Stack.Screen name="ItemSummary" component={ItemSummaryScreen} />
          <Stack.Screen name="MeasurementBook" component={MeasurementBookScreen} />
          <Stack.Screen name="FinalReport" component={FinalReportScreen} />
          <Stack.Screen name="ActivityLog" component={ActivityLogScreen} />
          <Stack.Screen name="PendingSync" component={PendingSyncScreen} />
          <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SiteProvider>
          <NetworkProvider>
            <NavigationContainer>
              <StatusBar style="light" />
              <NavigationStack />
            </NavigationContainer>
          </NetworkProvider>
        </SiteProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center'
  },
  tabBar: {
    backgroundColor: Colors.primary,
    borderTopColor: Colors.surfaceBorder,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 6
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700'
  },
  addExpenseTabBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -12,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5
  },
  addExpenseTabIcon: {
    color: Colors.buttonPrimaryText,
    fontSize: 26,
    fontWeight: '900',
    marginTop: -2
  }
});
