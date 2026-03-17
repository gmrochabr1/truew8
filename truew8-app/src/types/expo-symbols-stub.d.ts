declare module "expo-symbols" {
  import * as React from "react";

  export const SymbolView: React.ComponentType<any>;
  export function getSymbolSize(_name: string): number;
}
