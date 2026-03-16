import React from 'react';
import { Redirect } from 'expo-router';

import { AuthLoadingScreen } from '@/src/components/common/AuthLoadingScreen';
import { useAuth } from '@/src/store/AuthContext';
import { useLocale } from '@/src/store/LocaleContext';

export default function IndexRoute() {
  const { isLoading, isAuthenticated } = useAuth();
  const { t } = useLocale();

  if (isLoading) {
    return <AuthLoadingScreen message={t('app.validatingSession')} />;
  }

  if (isAuthenticated) {
    return <Redirect href={'/dashboard' as never} />;
  }

  return <Redirect href="/login" />;
}
