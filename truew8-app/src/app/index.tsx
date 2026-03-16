import React from 'react';
import { Redirect } from 'expo-router';

import { AuthLoadingScreen } from '@/src/components/common/AuthLoadingScreen';
import { useAuth } from '@/src/store/AuthContext';

export default function IndexRoute() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <AuthLoadingScreen message="Validando sessao..." />;
  }

  if (isAuthenticated) {
    return <Redirect href={'/dashboard' as never} />;
  }

  return <Redirect href="/login" />;
}
