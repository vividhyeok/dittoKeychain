import { TextSpec } from '../types';
import { FONTS, COLORS } from '../utils/constants';

interface TextLayerProps {
  spec: TextSpec;
  onUpdate: (spec: TextSpec) => void;
}

const TextLayer: React.FC<TextLayerProps> = ({ spec, onUpdate }) => {
  const style: React.CSSProperties = {
    fontFamily: FONTS[spec.font],
    fontSize: `${spec.size}px`,
    fontWeight: spec.weight === 0 ? 'normal' : spec.weight === 1 ? 'bold' : '900',
    color: COLORS[spec.color],
    position: 'absolute',
    left: `${spec.tx}mm`,
    top: `${spec.ty}mm`,
    transform: `scale(${spec.scale}) rotate(${spec.rot}deg)`,
    transformOrigin: 'center',
    userSelect: 'none',
    touchAction: 'none',
  };

  if (spec.effect === 1) {
    style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
  } else if (spec.effect === 2) {
    style.WebkitTextStroke = '1px black';
  } else if (spec.effect === 3) {
    style.textShadow = '0 0 5px #fff, 0 0 10px #fff, 0 0 15px #fff';
  }

  return (
    <div
      style={style}
      onPointerDown={(e) => {
        // 간단한 드래그 구현
        const startX = e.clientX;
        const startY = e.clientY;
        const startTx = spec.tx;
        const startTy = spec.ty;

        const handleMove = (e: PointerEvent) => {
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;
          onUpdate({ ...spec, tx: startTx + dx / 3.78, ty: startTy + dy / 3.78 }); // px to mm approx
        };

        const handleUp = () => {
          document.removeEventListener('pointermove', handleMove);
          document.removeEventListener('pointerup', handleUp);
        };

        document.addEventListener('pointermove', handleMove);
        document.addEventListener('pointerup', handleUp);
      }}
    >
      {spec.text}
    </div>
  );
};

export default TextLayer;