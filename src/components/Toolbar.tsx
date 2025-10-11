import { useIsMobile } from '../hooks/useIsMobile';

interface ToolbarProps {
  title: string;
  onCover: () => void;
  onFitW: () => void;
  onFitH: () => void;
  onCenter: () => void;
  scale: number;
  onScale: (s: number) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ title, onCover, onFitW, onFitH, onCenter, scale, onScale }) => {
  const isMobile = useIsMobile();
  const btn = 'px-3 py-2 rounded bg-gray-200 hover:bg-gray-300';
  return (
    <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center space-x-2'} p-3 bg-white rounded shadow`}> 
      <div className="font-bold">{title}</div>
      <div className={`flex ${isMobile ? 'space-x-2' : 'space-x-2'}`}>
        <button className={btn} onClick={onCover}>가득 채우기</button>
        <button className={btn} onClick={onFitW}>가로 맞춤</button>
        <button className={btn} onClick={onFitH}>세로 맞춤</button>
        <button className={btn} onClick={onCenter}>중앙</button>
      </div>
      <div className="flex items-center space-x-2">
        <button className={btn} onClick={() => onScale(Math.max(0.1, +(scale - 0.05).toFixed(2)))}>-</button>
        <input type="number" step={0.05} value={scale.toFixed(2)} onChange={(e)=>onScale(parseFloat(e.target.value)||1)} className="border p-2 w-20 text-center" />
        <button className={btn} onClick={() => onScale(+(scale + 0.05).toFixed(2))}>+</button>
        {[0.5,1.0,1.5,2.0].map(s => (
          <button key={s} className={btn} onClick={()=>onScale(s)}>{s}x</button>
        ))}
      </div>
    </div>
  );
};

export default Toolbar;