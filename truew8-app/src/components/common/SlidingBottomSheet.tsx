import React, { memo, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type SlidingBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  testID?: string;
  sheetStyle?: StyleProp<ViewStyle>;
  backdropStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export const SlidingBottomSheet = memo(function SlidingBottomSheet({
  visible,
  onClose,
  testID,
  sheetStyle,
  backdropStyle,
  children,
}: SlidingBottomSheetProps) {
  const { height: screenHeight } = useWindowDimensions();
  const [isMounted, setIsMounted] = useState(visible);
  const animationDistance = useMemo(() => Math.max(screenHeight, 640), [screenHeight]);

  const translateY = useSharedValue(animationDistance);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      translateY.value = animationDistance;
      backdropOpacity.value = 0;

      translateY.value = withTiming(0, {
        duration: 280,
        easing: Easing.out(Easing.cubic),
      });
      backdropOpacity.value = withTiming(1, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      });
      return;
    }

    if (!isMounted) {
      return;
    }

    translateY.value = withTiming(animationDistance, {
      duration: 220,
      easing: Easing.in(Easing.cubic),
    });
    backdropOpacity.value = withTiming(
      0,
      {
        duration: 180,
        easing: Easing.in(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          runOnJS(setIsMounted)(false);
        }
      },
    );
  }, [animationDistance, backdropOpacity, isMounted, translateY, visible]);

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!isMounted) {
    return null;
  }

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, backdropAnimatedStyle, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.sheet, sheetAnimatedStyle, sheetStyle]} testID={testID}>
        {children}
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    ...Platform.select({
      web: { position: 'fixed' },
      default: {},
    }),
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 15, 35, 0.52)',
  },
  sheet: {
    position: 'absolute',
    overflow: 'hidden',
  },
});