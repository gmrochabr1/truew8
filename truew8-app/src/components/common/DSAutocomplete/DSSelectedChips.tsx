import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { DSText } from "@/src/components/common/DSText";
import { theme } from "@/src/theme/tokens";

import { getNestedValue } from "./utils";

type DSSelectedChipsProps<T> = {
  selectedItems: T[];
  displayField: string | keyof T;
  idField: string | keyof T;
  onRemove: (item: T) => void;
  disabled?: boolean;
};

export function DSSelectedChips<T>({
  selectedItems,
  displayField,
  idField,
  onRemove,
  disabled,
}: DSSelectedChipsProps<T>) {
  if (!selectedItems || selectedItems.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      {selectedItems.map((item) => (
        <View key={String(getNestedValue(item, idField))} style={styles.chip}>
          <DSText style={styles.chipText}>{String(getNestedValue(item, displayField))}</DSText>
          {!disabled ? (
            <Pressable onPress={() => onRemove(item)} hitSlop={6}>
              <Ionicons name="close" size={14} color={theme.colors.primary} />
            </Pressable>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#9DB0CA",
    backgroundColor: "#EDF3FC",
    paddingLeft: 10,
    paddingRight: 8,
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chipText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
});
