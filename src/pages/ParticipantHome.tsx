import { Link } from 'react-router-dom';

const ParticipantHome = () => {
  return (
    <div className="min-h-screen bg-gray-800 text-white flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-8">참가자 모드</h1>
      <div className="space-y-4">
        <Link to="/p/4x5" className="block bg-gray-700 text-white px-6 py-3 rounded">4×5 키링 편집</Link>
        <Link to="/p/cd3" className="block bg-gray-700 text-white px-6 py-3 rounded">CD형 키링 편집</Link>
      </div>
    </div>
  );
};

export default ParticipantHome;