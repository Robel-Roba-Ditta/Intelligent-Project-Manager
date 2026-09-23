import React, { useEffect, useRef } from 'react';
import { NavigationContainer, type NavigationContainerRef } from '@react-navigation/native';
import Constants from 'expo-constants';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  useEffect(() => {
    if (isExpoGo) return; // Push not available in Expo Go

    try {
      const Notifications = require('expo-notifications');
      // Handle push notification taps — navigate to the relevant task
      const subscription = Notifications.addNotificationResponseReceivedListener(
        (response: any) => {
          const data = response.notification.request.content.data;
          if (data?.taskId && navigationRef.current) {
            navigationRef.current.navigate('Projects', {
              screen: 'TaskDetail',
              params: { taskId: data.taskId, projectId: 0 },
            });
          }
        },
      );

      return () => subscription.remove();
    } catch {
      // expo-notifications not available
    }
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer ref={navigationRef}>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
