import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { MapPin, ShoppingBag, MonitorPlay, Bot, User, Database } from 'lucide-react-native';
import GPSScreen from '../screens/GPSScreen';
import StoreScreen from '../screens/StoreScreen';
import IPTVScreen from '../screens/IPTVScreen';
import ManagerHub from '../screens/ManagerHub';
import ProfileScreen from '../screens/ProfileScreen';
import AdminScreen from '../screens/AdminScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
        screenOptions={{
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: '#10B981',
            tabBarInactiveTintColor: '#9CA3AF',
            tabBarLabelStyle: styles.tabLabel,
        }}
    >
        <Tab.Screen 
            name="GPS" 
            component={GPSScreen}
            options={{
                tabBarIcon: ({ color, size }) => <MapPin color={color} size={24} strokeWidth={2} />,
            }}
        />
        <Tab.Screen 
            name="Store" 
            component={StoreScreen}
            options={{
                tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={24} strokeWidth={2} />,
            }}
        />
        <Tab.Screen 
            name="IPTV" 
            component={IPTVScreen}
            options={{
                tabBarIcon: ({ color, size }) => <MonitorPlay color={color} size={24} strokeWidth={2} />,
                tabBarLabel: 'TV'
            }}
        />
        <Tab.Screen 
            name="Manager" 
            component={ManagerHub}
            options={{
                tabBarIcon: ({ color, size }) => (
                    <View style={[styles.managerIconContainer, { borderColor: color }]}>
                        <Bot color={color} size={22} strokeWidth={2} />
                    </View>
                ),
                tabBarLabel: 'IA'
            }}
        />
        <Tab.Screen 
            name="Profil" 
            component={ProfileScreen}
            options={{
                tabBarIcon: ({ color, size }) => <User color={color} size={24} strokeWidth={2} />,
            }}
        />
        <Tab.Screen 
            name="Admin" 
            component={AdminScreen}
            options={{
                tabBarIcon: ({ color, size }) => <Database color={color} size={22} strokeWidth={2} />,
                tabBarLabel: 'DB'
            }}
        />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    placeholderText: {
        color: '#9CA3AF',
        fontWeight: 'bold',
    },
    tabBar: {
        height: 90,
        paddingBottom: 30,
        paddingTop: 10,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
    },
    managerIconContainer: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        padding: 6,
        borderRadius: 10,
        borderWidth: 1.5,
    },
});
