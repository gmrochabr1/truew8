import { Ionicons } from '@expo/vector-icons';
import React, { memo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { DSText } from '@/src/components/common/DSText';
import { theme } from '@/src/theme/tokens';

type DSInfoTooltipProps = {
  text: string;
  testID?: string;
};

export const DSInfoTooltip = memo(function DSInfoTooltip({ text, testID }: DSInfoTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  return (
    <View style={styles.root}>
      <Pressable
        onPress={() => {
          setIsPinned((currentPinned) => {
            const nextPinned = !currentPinned;
            setVisible(nextPinned);
            return nextPinned;
          });
        }}
        onHoverIn={() => {
          if (!isPinned) {
            setVisible(true);
          }
        }}
        onHoverOut={() => {
          if (!isPinned) {
            setVisible(false);
          }
        }}
        style={({ pressed }) => [styles.trigger, pressed ? styles.triggerPressed : null]}
        hitSlop={8}
        testID={testID}
      >
        <Ionicons name="information-circle-outline" size={16} color="#5A7191" />
      </Pressable>

      {visible ? (
        <View style={styles.tooltipBubble} testID={testID ? `${testID}-content` : undefined}>
          <DSText style={styles.tooltipText}>{text}</DSText>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 120,
  },
  trigger: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CED9E8',
    backgroundColor: '#F3F7FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerPressed: {
    opacity: 0.75,
  },
  tooltipBubble: {
    position: 'absolute',
    right: 0,
    bottom: 34,
    width: 240,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD8EB',
    backgroundColor: '#F8FBFF',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 8,
    zIndex: 1200,
    ...Platform.select({
      web: {
        boxShadow: '0 14px 26px rgba(18, 39, 70, 0.18)' as never,
      },
      default: {
        elevation: 40,
        shadowColor: '#000',
        shadowOpacity: 0.16,
        shadowRadius: 8,
      },
    }),
  },
  tooltipText: {
    color: '#2F486B',
    fontSize: 12,
    lineHeight: 18,
  },
});
