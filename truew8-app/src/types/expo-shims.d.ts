declare module 'react-native/Libraries/Image/AssetSourceResolver' {
  const AssetSourceResolver: any;
  export default AssetSourceResolver;
}

declare module '@react-native/assets-registry/registry' {
  export type PackagerAsset = {
    scales: number[];
    [key: string]: any;
  };

  export function getAssetByID(assetId: number): PackagerAsset | undefined;
}

declare module 'invariant' {
  export default function invariant(condition: any, message?: string, ...args: any[]): asserts condition;
}
