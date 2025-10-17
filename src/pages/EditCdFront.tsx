import { useRef } from 'react';
import ImageEditor, { ImageEditorHandle } from '../components/ImageEditor';
import { PartSpec } from '../types';

const EditCdFront: React.FC = () => {
  const initialSpecs: Record<string, PartSpec> = {
    'cd-front-left': { part: 'cd-front-left', tx: 0, ty: 0, scale: 1, rot: 0 },
    'cd-front-right': { part: 'cd-front-right', tx: 0, ty: 0, scale: 1, rot: 0 },
  };
  const editorRef = useRef<ImageEditorHandle>(null);
  const qrPayload = (specs: Record<string, PartSpec>) => ({
    v: 1,
    tpl: 'cd-front',
    frontPanels: { left: specs['cd-front-left'], right: specs['cd-front-right'] },
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

export default EditCdFront;
