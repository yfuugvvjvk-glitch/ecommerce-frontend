import UserCardsManagement from '@/components/UserCardsManagement';

export default function MyCardsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">💳 Cardurile Mele</h1>
        <p className="text-gray-600">
          Gestionează cardurile tale reale și folosește cardurile de test pentru simulări
        </p>
      </div>
      
      <UserCardsManagement />
    </div>
  );
}