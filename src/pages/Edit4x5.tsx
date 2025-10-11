import React from 'react';
import ImageEditor from '../components/ImageEditor';
import { PartSpec } from '../types';

const Edit4x5: React.FC = () => {
  const initialSpecs: Record<string, PartSpec> = {
    '4x5-front': { part: '4x5-front', tx: 0, ty: 0, scale: 1, rot: 0 },
    '4x5-back': { part: '4x5-back', tx: 0, ty: 0, scale: 1, rot: 0 },
  };

  const qrPayload = (specs: Record<string, PartSpec>) => ({
    v: 1,
    tpl: '4x5',
    front: specs['4x5-front'],
    back: specs['4x5-back'],
  });

  return <ImageEditor template="4x5" initialSpecs={initialSpecs} qrPayload={qrPayload} />;
};

export default Edit4x5;