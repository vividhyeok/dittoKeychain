import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RoleSelect from './pages/RoleSelect';
import CdParticipantHome from './pages/CdParticipantHome';
import FourFiveParticipantHome from './pages/FourFiveParticipantHome';
import StaffHome from './pages/StaffHome';
import Edit4x5 from './pages/Edit4x5';
import EditCd3 from './pages/EditCd3';
import Scan2 from './pages/Scan2';
import Scan4 from './pages/Scan4';
import ScanLoad from './pages/ScanLoad';
import FourUp from './pages/FourUp';
import StaffCd from './pages/StaffCd';
import Guide from './pages/Guide';
import Navbar from './components/Navbar';

function App() {
  return (
    <Router>
      <Navbar />
      <div style={{ paddingTop: '56px' }}>
        <Routes>
          <Route path="/" element={<RoleSelect />} />
          <Route path="/p/cd" element={<CdParticipantHome />} />
          <Route path="/p/cd/edit" element={<EditCd3 />} />
          <Route path="/p/4x5" element={<FourFiveParticipantHome />} />
          <Route path="/p/4x5/edit" element={<Edit4x5 />} />
          <Route path="/s" element={<StaffHome />} />
          <Route path="/s/scan2" element={<Scan2 />} />
          <Route path="/s/scan4" element={<Scan4 />} />
          <Route path="/s/load" element={<ScanLoad />} />
          <Route path="/s/4up" element={<FourUp />} />
          <Route path="/s/cd" element={<StaffCd />} />
          <Route path="/s/guide" element={<Guide />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;