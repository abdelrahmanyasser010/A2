export type MediaAsset = {
  key: string;
  url: string;
  name: string;
  size: number;
  mimeType: string;
  updatedAt: string;
  storage: "local" | "s3";
};
