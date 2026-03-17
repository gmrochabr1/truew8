import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { DSText } from "@/src/components/common/DSText";
import { theme } from "@/src/theme/tokens";

import { getNestedValue } from "./utils";

type DSDropdownListProps<T> = {
  isOpen: boolean;
  loading: boolean;
  items: T[];
  onClose: () => void;
  onSelect: (item: T) => void;
  displayField: string | keyof T;
  idField: string | keyof T;
  isItemSelected: (item: T) => boolean;
  anchorLayout: { top: number; left: number; width: number; height: number };
};

export function DSDropdownList<T>({
  isOpen,
  loading,
  items,
  onSelect,
  displayField,
  idField,
  isItemSelected,
  anchorLayout,
}: DSDropdownListProps<T>) {
  if (!isOpen) {
    return null;
  }

  return (
    <View
      style={[
        styles.dropdown,
        {
          width: anchorLayout.width || "100%",
          maxHeight: 260,
        },
      ]}
      testID="autocomplete-desktop-dropdown"
    >
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <DSText style={styles.loadingText}>Carregando...</DSText>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <DSText style={styles.emptyText}>Nenhum resultado.</DSText>
        </View>
      ) : (
        <ScrollView keyboardShouldPersistTaps="always">
          {items.map((item) => {
            const selected = isItemSelected(item);
            return (
              <Pressable
                key={String(getNestedValue(item, idField))}
                style={[styles.item, selected ? styles.itemSelected : null]}
                onPress={() => onSelect(item)}
                testID={`autocomplete-item-${String(getNestedValue(item, idField))}`}
              >
                <DSText style={[styles.itemText, selected ? styles.itemTextSelected : null]}>
                  {String(getNestedValue(item, displayField))}
                </DSText>
                {selected ? <Ionicons name="checkmark" size={18} color={theme.colors.primary} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    marginTop: 4,
    alignSelf: "stretch",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#AFC0D9",
    backgroundColor: theme.colors.panel,
    overflow: "hidden",
    zIndex: 15,
  },
  loadingWrap: {
    minHeight: 48,
    paddingHorizontal: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  emptyWrap: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  item: {
    minHeight: 42,
    paddingHorizontal: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E5EDF8",
  },
  itemSelected: {
    backgroundColor: "#EFF4FB",
  },
  itemText: {
    color: theme.colors.textPrimary,
    fontWeight: "600",
    fontSize: 14,
  },
  itemTextSelected: {
    color: theme.colors.primary,
    fontWeight: "800",
  },
});
