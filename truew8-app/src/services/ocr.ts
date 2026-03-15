import { apiClient } from '@/src/services/api';

export type OcrHolding = {
  ticker: string;
  quantity: number;
};

type OcrUploadResponse = {
  holdings: OcrHolding[];
};

type UploadImagePayload = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

const inferFileExtension = (mimeType?: string | null): string => {
  if (!mimeType) {
    return 'jpg';
  }
  const [, subtype] = mimeType.split('/');
  return subtype || 'jpg';
};

export async function extractHoldingsFromPrint(payload: UploadImagePayload): Promise<OcrHolding[]> {
  const blob = await fetch(payload.uri).then((response) => response.blob());

  const formData = new FormData();
  formData.append(
    'image',
    blob,
    payload.fileName ?? `broker-print.${inferFileExtension(payload.mimeType)}`,
  );

  const { data } = await apiClient.post<OcrUploadResponse>('/ocr/upload', formData);

  return data.holdings;
}
