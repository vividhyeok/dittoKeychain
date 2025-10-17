import React from 'react';
import ImageEditor from '../components/ImageEditor';
import { PartSpec } from '../types';

const EditCd3: React.FC = () => {
  const initialSpecs: Record<string, PartSpec> = {
    'cd-disc': { part: 'cd-disc', tx: 0, ty: 0, scale: 1, rot: 0 },
    'cd-front-left': { part: 'cd-front-left', tx: 0, ty: 0, scale: 1, rot: 0 },
    'cd-front-right': { part: 'cd-front-right', tx: 0, ty: 0, scale: 1, rot: 0 },
    'cd-back-outside': { part: 'cd-back-outside', tx: 0, ty: 0, scale: 1, rot: 0 },
    'cd-spine-1': { part: 'cd-spine-1', tx: 0, ty: 0, scale: 1, rot: 0 },
    'cd-spine-2': { part: 'cd-spine-2', tx: 0, ty: 0, scale: 1, rot: 0 },
    'cd-spine-3': { part: 'cd-spine-3', tx: 0, ty: 0, scale: 1, rot: 0 },
    'cd-back-inside': { part: 'cd-back-inside', tx: 0, ty: 0, scale: 1, rot: 0 },
  };

  const qrPayload = (specs: Record<string, PartSpec>) => ({
    v: 1,
    tpl: 'cd',
    disc: specs['cd-disc'],
    // 레거시 호환을 위해 대표 앞/뒤 값을 채우고, panel 상세는 별도 필드에 포함
    front: specs['cd-front-left'],
    back: specs['cd-back-outside'],
    frontPanels: {
      left: specs['cd-front-left'],
      right: specs['cd-front-right'],
    },
    backPanels: {
      outside: specs['cd-back-outside'],
      spine1: specs['cd-spine-1'],
      spine2: specs['cd-spine-2'],
      spine3: specs['cd-spine-3'],
      inside: specs['cd-back-inside'],
    },
  });

  return <ImageEditor template="cd3" initialSpecs={initialSpecs} qrPayload={qrPayload} />;
};

export default EditCd3;