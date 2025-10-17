import { useRef } from 'react';
import ImageEditor, { ImageEditorHandle } from '../components/ImageEditor';
import { PartSpec } from '../types';

const EditCdDisc: React.FC = () => {
  const initialSpecs: Record<string, PartSpec> = {
    'cd-disc': { part: 'cd-disc', tx: 0, ty: 0, scale: 1, rot: 0 },
  };
  const editorRef = useRef<ImageEditorHandle>(null);
  const qrPayload = (specs: Record<string, PartSpec>) => ({
    v: 1,
    tpl: 'cd-disc',
    disc: specs['cd-disc'],
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

export default EditCdDisc;
