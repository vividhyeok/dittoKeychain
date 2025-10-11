import React from 'react';
import ImageEditor from '../components/ImageEditor';
import { PartSpec } from '../types';

const EditCd3: React.FC = () => {
  const initialSpecs: Record<string, PartSpec> = {
    'cd-disc': { part: 'cd-disc', tx: 0, ty: 0, scale: 1, rot: 0 },
    'case-front': { part: 'case-front', tx: 0, ty: 0, scale: 1, rot: 0 },
    'case-back': { part: 'case-back', tx: 0, ty: 0, scale: 1, rot: 0 },
  };

  const qrPayload = (specs: Record<string, PartSpec>) => ({
    v: 1,
    tpl: 'cd3',
    disc: specs['cd-disc'],
    front: specs['case-front'],
    back: specs['case-back'],
  });

  return <ImageEditor template="cd3" initialSpecs={initialSpecs} qrPayload={qrPayload} />;
};

export default EditCd3;