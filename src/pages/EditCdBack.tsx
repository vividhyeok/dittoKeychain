import { useRef } from 'react';
import ImageEditor, { ImageEditorHandle } from '../components/ImageEditor';
import { PartSpec } from '../types';

const EditCdBack: React.FC = () => {
  const initialSpecs: Record<string, PartSpec> = {
    'cd-back-outside': { part: 'cd-back-outside', tx: 0, ty: 0, scale: 1, rot: 0 },
    'cd-spine-1': { part: 'cd-spine-1', tx: 0, ty: 0, scale: 1, rot: 0 },
    'cd-spine-2': { part: 'cd-spine-2', tx: 0, ty: 0, scale: 1, rot: 0 },
    'cd-spine-3': { part: 'cd-spine-3', tx: 0, ty: 0, scale: 1, rot: 0 },
    'cd-back-inside': { part: 'cd-back-inside', tx: 0, ty: 0, scale: 1, rot: 0 },
  };
  const editorRef = useRef<ImageEditorHandle>(null);
  const qrPayload = (specs: Record<string, PartSpec>) => ({
    v: 1,
    tpl: 'cd-back',
    backPanels: {
      outside: specs['cd-back-outside'],
      spine1: specs['cd-spine-1'],
      spine2: specs['cd-spine-2'],
      spine3: specs['cd-spine-3'],
      inside: specs['cd-back-inside'],
    },
  });
  return (
    <ImageEditor
      ref={editorRef}
      template="cd3"
      initialSpecs={initialSpecs}
      qrPayload={qrPayload}
    />
  );
};

export default EditCdBack;
