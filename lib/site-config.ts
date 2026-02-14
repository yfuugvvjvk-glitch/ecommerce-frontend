// Configurare globală pentru site
export const SITE_CONFIG = {
  name: 'Din grădina mea la voi',
  shortName: 'Din grădina mea la voi',
  description: 'Produse proaspete direct din grădina noastră la tine acasă',
  year: new Date().getFullYear(),
  // Funcție pentru a obține data completă formatată
  getFullDate: () => {
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleDateString('ro-RO', { month: 'long' });
    const year = now.getFullYear();
    return `${day} ${month} ${year}`;
  },
  // Funcție pentru a obține data scurtă formatată (zi.lună.an)
  getShortDate: () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}.${month}.${year}`;
  },
};
