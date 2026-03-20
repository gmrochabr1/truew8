import { Redirect } from 'expo-router';
import React from 'react';

import { AuthLoadingScreen } from '@/src/components/common/AuthLoadingScreen';
import { useAuth } from '@/src/store/AuthContext';

export default function FaqScreen() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AuthLoadingScreen message="Validating session..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/dashboard" />;
}
