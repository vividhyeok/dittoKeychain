export type TextSpec = {
  text: string;
  font: number;
  size: number;
  weight?: 0 | 1 | 2;
  color: number;
  effect: 0 | 1 | 2 | 3;
  tx: number;
  ty: number;
  scale: number;
  rot: number;
  curve?: boolean;
  vert?: boolean;
};

export type ImageSpec = {
  img?: string; // 이미지 URL (텍스트 전용이면 생략)
  imgWidth?: number; // 이미지 실제 너비 (px)
  imgHeight?: number; // 이미지 실제 높이 (px)
  tx: number;
  ty: number;
  scale: number;
  rot: number;
};

export type PartSpec = {
  part: 'cd-disc' | 'case-front' | 'case-back' | '4x5-front' | '4x5-back';
} & ImageSpec;

export type Payload4x5 = {
  v: 1;
  tpl: '4x5';
  front: PartSpec;
  back: PartSpec;
};

export type PayloadCd = {
  v: 1;
  tpl: 'cd';
  disc: PartSpec;
  front: PartSpec;
  back: PartSpec;
};

export type Payload = Payload4x5 | PayloadCd;