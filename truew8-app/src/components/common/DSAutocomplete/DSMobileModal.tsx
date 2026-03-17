import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { DSInput } from "@/src/components/common/DSInput";
import { DSText } from "@/src/components/common/DSText";
import { theme } from "@/src/theme/tokens";

import { getNestedValue } from "./utils";

type DSMobileModalProps<T> = {
  visible: boolean;
  onClose: () => void;
  loading: boolean;
  items: T[];
  inputValue: string;
  onInputChange: (text: string) => void;
  onSelect: (item: T) => void;
  displayField: string | keyof T;
  idField: string | keyof T;
  isItemSelected: (item: T) => boolean;
  placeholder?: string;
  label?: string;
};

export function DSMobileModal<T>({
  visible,
  onClose,
  loading,
  items,
  inputValue,
  onInputChange,
  onSelect,
  displayField,
  idField,
  isItemSelected,
  placeholder,
  label,
}: DSMobileModalProps<T>) {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 120);

    return () => {
      clearTimeout(timer);
    };
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} testID="autocomplete-mobile-close" hitSlop={6}>
            <Ionicons name="close" size={24} color={theme.colors.primary} />
          </Pressable>
          <DSText style={styles.title}>{label || "Selecionar"}</DSText>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.searchWrap}>
          <DSInput
            label=""
            value={inputValue}
            onChangeText={onInputChange}
            placeholder={placeholder || "Buscar"}
            maxLength={120}
            testID="autocomplete-mobile-input"
          />
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <DSText style={styles.loadingText}>Carregando...</DSText>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => String(getNestedValue(item, idField))}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <DSText style={styles.emptyText}>Nenhum resultado.</DSText>
              </View>
            }
            renderItem={({ item }) => {
              const selected = isItemSelected(item);
              return (
                <Pressable
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
            }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    minHeight: 52,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  headerSpacer: {
    width: 24,
  },
  searchWrap: {
    padding: theme.spacing.md,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  loadingText: {
    color: theme.colors.textMuted,
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.lg,
  },
  emptyText: {
    color: theme.colors.textMuted,
  },
  item: {
    minHeight: 46,
    paddingHorizontal: theme.spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  itemSelected: {
    backgroundColor: "#EEF3FA",
  },
  itemText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
  },
  itemTextSelected: {
    color: theme.colors.primary,
    fontWeight: "800",
  },
});
