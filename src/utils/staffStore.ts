import { Payload4x5, PayloadCd } from '../types';

const KEYS = {
  fourUp: 'staff.fourup',
  cd: 'staff.cd',
};

export const staffStore = {
  setFourUp(payloads: Payload4x5[]) {
    sessionStorage.setItem(KEYS.fourUp, JSON.stringify(payloads));
  },
  getFourUp(): Payload4x5[] | null {
    const raw = sessionStorage.getItem(KEYS.fourUp);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },
  clearFourUp() { sessionStorage.removeItem(KEYS.fourUp); },

  setCd(payload: PayloadCd) {
    sessionStorage.setItem(KEYS.cd, JSON.stringify(payload));
  },
  getCd(): PayloadCd | null {
    const raw = sessionStorage.getItem(KEYS.cd);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },
  clearCd() { sessionStorage.removeItem(KEYS.cd); },
};
