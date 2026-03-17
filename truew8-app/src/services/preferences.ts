import { apiClient } from "@/src/services/api";

export type UserCustomizationPreference = {
  baseCurrency: "BRL" | "USD";
  toleranceValue: number;
  allowSells: boolean;
  theme: "LIGHT" | "DARK";
  availableBaseCurrencies: Array<"BRL" | "USD">;
  availableThemes: Array<"LIGHT" | "DARK">;
};

export async function getCustomizationPreferences(): Promise<UserCustomizationPreference> {
  const { data } = await apiClient.get<UserCustomizationPreference>("/preferences/customization");
  return data;
}

export async function updateCustomizationPreferences(
  payload: Pick<UserCustomizationPreference, "baseCurrency" | "toleranceValue" | "allowSells" | "theme">,
): Promise<UserCustomizationPreference> {
  const { data } = await apiClient.put<UserCustomizationPreference>("/preferences/customization", payload);
  return data;
}
