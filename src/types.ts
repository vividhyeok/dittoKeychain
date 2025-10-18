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
  bgColor?: string; // 배경 단색 (hex)
  tx: number;
  ty: number;
  scale: number;
  rot: number;
};

export type PartSpec = {
  part:
    | 'cd-disc'
    | 'case-front' // 기존 단일 프론트(40x40)
    | 'case-back' // 기존 단일 백(49x37)
    | 'cd-front-left' // 새: 앞면 좌(40x40)
    | 'cd-front-right' // 새: 앞면 우(40x40)
    | 'cd-back-outside' // 새: 뒷면 바깥 49x37
    | 'cd-spine-1' // 새: 옆면 0.5x3.7(5x37mm)
    | 'cd-spine-2'
    | 'cd-spine-3'
    | 'cd-back-inside' // 새: 뒷면 안쪽 44x37
    | '4x5-front'
    | '4x5-back';
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
  // 선택 사항: 패널 단위 앞/뒤 구성(신규)
  frontPanels?: {
    left: PartSpec; // part: 'cd-front-left'
    right: PartSpec; // part: 'cd-front-right'
  };
  backPanels?: {
    outside: PartSpec; // part: 'cd-back-outside'
    spine1: PartSpec; // part: 'cd-spine-1'
    spine2: PartSpec; // part: 'cd-spine-2'
    spine3: PartSpec; // part: 'cd-spine-3'
    inside: PartSpec; // part: 'cd-back-inside'
  };
};

export type Payload = Payload4x5 | PayloadCd;