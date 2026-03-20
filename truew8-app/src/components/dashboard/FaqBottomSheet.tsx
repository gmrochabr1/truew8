import React, { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { DSText } from '@/src/components/common/DSText';
import { SlidingBottomSheet } from '@/src/components/common/SlidingBottomSheet';
import { useLocale } from '@/src/store/LocaleContext';
import { theme } from '@/src/theme/tokens';

type FaqBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
};

export const FaqBottomSheet = memo(function FaqBottomSheet({ visible, onClose }: FaqBottomSheetProps) {
  const { t } = useLocale();

  return (
    <SlidingBottomSheet
      visible={visible}
      onClose={onClose}
      testID="dashboard-faq-bottom-sheet"
      sheetStyle={styles.sheet}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <DSText style={styles.title}>{t('faq.title')}</DSText>
          <Pressable style={styles.closeButton} onPress={onClose} testID="faq-close-button">
            <DSText style={styles.closeButtonText}>{t('common.close')}</DSText>
          </Pressable>
        </View>

        <DSText style={styles.subtitle}>{t('faq.subtitle')}</DSText>

        <View style={styles.card}>
          <DSText style={styles.question}>{t('faq.q.lockAsset.title')}</DSText>
          <DSText style={styles.answer}>{t('faq.q.lockAsset.answer')}</DSText>
          <DSText style={styles.answer}>{t('faq.q.lockAsset.confirmation')}</DSText>
        </View>

        <View style={styles.card}>
          <DSText style={styles.question}>{t('faq.q.lockPortfolio.title')}</DSText>
          <DSText style={styles.answer}>{t('faq.q.lockPortfolio.answer')}</DSText>
          <DSText style={styles.answer}>{t('faq.q.lockPortfolio.confirmation')}</DSText>
        </View>
      </ScrollView>
    </SlidingBottomSheet>
  );
});

const styles = StyleSheet.create({
  sheet: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    bottom: 0,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: '#C7D5E8',
    backgroundColor: '#FFFFFF',
    minHeight: 340,
    maxHeight: '86%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.24,
    shadowRadius: 11,
    elevation: 16,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  title: {
    color: '#113C74',
    fontWeight: '800',
    fontSize: 24,
    flex: 1,
  },
  subtitle: {
    color: '#35557E',
    fontSize: 14,
    lineHeight: 21,
  },
  card: {
    borderWidth: 1,
    borderColor: '#C5D5EA',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  question: {
    color: '#1D426F',
    fontWeight: '800',
    fontSize: 16,
  },
  answer: {
    color: '#3A5A83',
    lineHeight: 20,
  },
  closeButton: {
    borderWidth: 1,
    borderColor: '#2A4A80',
    borderRadius: 10,
    backgroundColor: '#11325E',
    minHeight: 38,
    minWidth: 92,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  closeButtonText: {
    color: '#EDF3FB',
    fontWeight: '700',
  },
});