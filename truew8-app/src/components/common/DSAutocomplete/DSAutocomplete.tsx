import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { DSInput } from "@/src/components/common/DSInput";
import { DSText } from "@/src/components/common/DSText";
import { theme } from "@/src/theme/tokens";

import { DSDropdownList } from "./DSDropdownList";
import { DSMobileModal } from "./DSMobileModal";
import { DSSelectedChips } from "./DSSelectedChips";
import { DSAutocompleteProps } from "./types";
import { getNestedValue } from "./utils";

const DEFAULT_ITEMS: any[] = [];
const DEFAULT_SELECTED_ITEMS: any[] = [];

export function DSAutocomplete<T extends Record<string, any>>({
  items = DEFAULT_ITEMS,
  loadItems,
  idField,
  displayField,
  value,
  selectedItems = DEFAULT_SELECTED_ITEMS,
  onChange,
  multiple = false,
  allowFreeText = false,
  placeholder = "Digite para buscar...",
  label = "",
  disabled = false,
  error,
  helperText,
  debounceTime = 300,
  initialDisplayValue,
  testID,
}: DSAutocompleteProps<T>) {
  const { width: windowWidth } = useWindowDimensions();
  const isMobile = windowWidth < 600;

  const [inputValue, setInputValue] = useState(initialDisplayValue || "");
  const [internalSelectedItems, setInternalSelectedItems] = useState<T[]>(selectedItems);
  const [filteredItems, setFilteredItems] = useState<T[]>(items as T[]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [layout, setLayout] = useState({ top: 0, left: 0, width: 0, height: 0 });

  const containerRef = useRef<View>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestSearchRef = useRef("");

  useEffect(() => {
    if (!multiple) {
      if (typeof value === "string" && value !== "") {
        const match = items.find((item) => String(getNestedValue(item, idField)) === value);
        if (match) {
          setInputValue(String(getNestedValue(match, displayField)));
        }
      } else if (value === "" || value === undefined || value === null) {
        setInputValue("");
        setFilteredItems(items as T[]);
      }
    }
  }, [displayField, idField, items, multiple, value]);

  useEffect(() => {
    setInternalSelectedItems(selectedItems);
  }, [selectedItems]);

  useEffect(() => {
    if (!loadItems) {
      setFilteredItems(items as T[]);
    }
  }, [items, loadItems]);

  useEffect(
    () => () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    },
    [],
  );

  const performSearch = useCallback(
    async (text: string) => {
      latestSearchRef.current = text;
      if (loadItems) {
        setLoading(true);
        try {
          const results = await loadItems(text);
          if (latestSearchRef.current === text) {
            setFilteredItems(results);
          }
        } catch {
          if (latestSearchRef.current === text) {
            setFilteredItems([]);
          }
        } finally {
          if (latestSearchRef.current === text) {
            setLoading(false);
          }
        }
        return;
      }

      if (!text.trim()) {
        setFilteredItems(items as T[]);
        return;
      }

      const lowered = text.toLowerCase();
      const filtered = (items as T[]).filter((item) =>
        String(getNestedValue(item, displayField)).toLowerCase().includes(lowered),
      );
      setFilteredItems(filtered);
    },
    [displayField, items, loadItems],
  );

  const measureAnchor = useCallback(() => {
    containerRef.current?.measureInWindow((x, y, width, height) => {
      setLayout({ left: x, top: y, width, height });
    });
  }, []);

  const scheduleSearch = useCallback(
    (text: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        void performSearch(text);
      }, debounceTime);
    },
    [debounceTime, performSearch],
  );

  const handleTextChange = useCallback(
    (text: string) => {
      setInputValue(text);
      if (!isMobile) {
        measureAnchor();
        setIsOpen(true);
        scheduleSearch(text);
      }

      if (allowFreeText && !multiple) {
        onChange(text, undefined, false);
      }
    },
    [allowFreeText, isMobile, measureAnchor, multiple, onChange, scheduleSearch],
  );

  const handleOpen = useCallback(() => {
    if (disabled) {
      return;
    }

    measureAnchor();
    setIsOpen(true);
    void performSearch("");
  }, [disabled, measureAnchor, performSearch]);

  const handleClear = useCallback(() => {
    setInputValue("");
    setInternalSelectedItems([]);
    if (multiple) {
      onChange([], [], false);
    } else {
      onChange("", undefined, false);
    }

    if (loadItems) {
      setFilteredItems([]);
    } else {
      setFilteredItems(items as T[]);
    }

    if (isMobile) {
      setIsOpen(false);
      return;
    }

    handleOpen();
  }, [handleOpen, isMobile, items, loadItems, multiple, onChange]);

  const handleSelect = useCallback(
    (item: T) => {
      if (multiple) {
        const selected = internalSelectedItems.some(
          (candidate) => getNestedValue(candidate, idField) === getNestedValue(item, idField),
        );
        const nextSelected = selected
          ? internalSelectedItems.filter(
              (candidate) => getNestedValue(candidate, idField) !== getNestedValue(item, idField),
            )
          : [...internalSelectedItems, item];

        setInternalSelectedItems(nextSelected);
        setInputValue("");
        onChange(
          nextSelected.map((candidate) => String(getNestedValue(candidate, idField))),
          nextSelected,
          true,
        );
        return;
      }

      const displayValue = String(getNestedValue(item, displayField));
      setInputValue(displayValue);
      setIsOpen(false);
      onChange(String(getNestedValue(item, idField)), item, true);
    },
    [displayField, idField, internalSelectedItems, multiple, onChange],
  );

  const isItemSelected = useCallback(
    (item: T) =>
      internalSelectedItems.some(
        (selected) => getNestedValue(selected, idField) === getNestedValue(item, idField),
      ),
    [idField, internalSelectedItems],
  );

  const rightElement = useMemo(() => {
    const iconName = inputValue ? "close" : isOpen ? "chevron-up" : "chevron-down";
    return (
      <Pressable
        onPress={inputValue ? handleClear : handleOpen}
        disabled={disabled}
        style={styles.iconButton}
        testID={testID ? `${testID}-toggle` : undefined}
      >
        <Ionicons name={iconName} size={16} color={theme.colors.primary} />
      </Pressable>
    );
  }, [disabled, handleClear, handleOpen, inputValue, isOpen, testID]);

  return (
    <View ref={containerRef} style={styles.container}>
      <DSSelectedChips
        selectedItems={internalSelectedItems}
        displayField={displayField}
        idField={idField}
        onRemove={handleSelect}
        disabled={disabled}
      />

      {isMobile ? (
        <View style={styles.mobileWrap}>
          <TouchableOpacity onPress={handleOpen} disabled={disabled} activeOpacity={0.8} style={styles.mobileTouchable}>
            <View pointerEvents="none">
              <DSInput
                label={label}
                value={inputValue}
                onChangeText={() => {}}
                placeholder={placeholder}
                rightElement={rightElement}
                testID={testID}
              />
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <DSInput
          label={label}
          value={inputValue}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          testID={testID}
          rightElement={rightElement}
        />
      )}

      {isMobile ? (
        <DSMobileModal
          visible={isOpen}
          onClose={() => setIsOpen(false)}
          loading={loading}
          items={filteredItems}
          inputValue={inputValue}
          onInputChange={(text) => {
            setInputValue(text);
            scheduleSearch(text);
          }}
          onSelect={handleSelect}
          displayField={displayField}
          idField={idField}
          isItemSelected={isItemSelected}
          placeholder={placeholder}
          label={label}
        />
      ) : (
        <DSDropdownList
          isOpen={isOpen}
          loading={loading}
          items={filteredItems}
          onClose={() => setIsOpen(false)}
          onSelect={handleSelect}
          displayField={displayField}
          idField={idField}
          isItemSelected={isItemSelected}
          anchorLayout={layout}
        />
      )}

      {error || helperText ? (
        <View style={styles.helperWrap}>
          <DSText style={[styles.helperText, error ? styles.errorText : null]}>{error || helperText}</DSText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 1,
  },
  mobileWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  mobileTouchable: {
    flex: 1,
  },
  iconButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  helperWrap: {
    marginTop: 4,
    paddingHorizontal: 2,
  },
  helperText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  errorText: {
    color: theme.colors.danger,
  },
});
