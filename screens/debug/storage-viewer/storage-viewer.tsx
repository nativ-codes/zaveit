import { Menu } from "@/common/components";
import { Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { storage } from "@/config/storage/storage";
import React, { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import styles from "./storage-viewer.style";
import { StorageItemType } from "./storage-viewer.type";

function StorageViewer() {
  const [storageItems, setStorageItems] = useState<StorageItemType[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const getAllStorageKeys = useCallback((): string[] => {
    try {
      return storage.getAllKeys();
    } catch (error) {
      console.error("Error getting storage keys:", error);
      return [];
    }
  }, []);

  const getStorageValue = useCallback((key: string): StorageItemType => {
    try {
      const value = storage.getString(key);
      let parsedValue: any = value;
      let type: "string" | "object" | "unknown" = "string";

      if (value) {
        try {
          parsedValue = JSON.parse(value);
          type = typeof parsedValue === "object" ? "object" : "string";
        } catch {
          type = "string";
        }
      }

      return {
        key,
        value: value || null,
        parsedValue,
        type,
      };
    } catch (error) {
      console.error(`Error getting storage value for key ${key}:`, error);
      return {
        key,
        value: null,
        type: "unknown",
      };
    }
  }, []);

  const loadStorageData = useCallback(() => {
    const keys = getAllStorageKeys();
    const items = keys.map(getStorageValue);

    items.sort((a, b) => a.key.localeCompare(b.key));

    setStorageItems(items);
  }, [getAllStorageKeys, getStorageValue]);

  const toggleExpanded = useCallback((key: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }, []);

  const formatValue = useCallback((item: StorageItemType): string => {
    if (item.value === null) {
      return "null";
    }

    if (item.type === "object") {
      return JSON.stringify(item.parsedValue, null, 2);
    }

    return item.value;
  }, []);

  useEffect(() => {
    loadStorageData();
  }, [loadStorageData]);

  const renderStorageItem = useCallback(
    (item: StorageItemType) => {
      const isExpanded = expandedItems.has(item.key);

      return (
        <View key={item.key}>
          <Menu.Item
            label={item.key}
            description={`${item.type} • ${item.value?.length || 0} chars`}
            onPress={() => toggleExpanded(item.key)}
          />

          {isExpanded && (
            <View style={styles.storageValueContainer}>
              <Text style={styles.storageValue} selectable>
                {formatValue(item)}
              </Text>
            </View>
          )}
        </View>
      );
    },
    [expandedItems, toggleExpanded, formatValue]
  );

  return (
    <Menu>
      <Spacer direction={["left", "bottom"]} size="s8">
        <Text style={GeneralStyles.textLabelMediumSecondary}>
          Storage Explorer ({storageItems.length} items)
        </Text>
      </Spacer>
      {storageItems.length === 0 ? (
        <Text style={styles.emptyState}>No storage items found</Text>
      ) : (
        storageItems.map(renderStorageItem)
      )}
    </Menu>
  );
}

export default StorageViewer;
