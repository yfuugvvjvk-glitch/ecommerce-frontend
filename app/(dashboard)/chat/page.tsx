import ChatSystem from '@/components/chat/ChatSystem';

export default function ChatPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">💬 Chat & Mesagerie</h1>
        <p className="text-gray-600">
          Comunică în timp real cu alți utilizatori, creează grupuri sau contactează suportul
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Sistemul de Chat</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Folosește butonul de chat din colțul din dreapta jos pentru a începe o conversație, 
            a crea grupuri sau a contacta suportul.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-8">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="text-3xl mb-3">👥</div>
              <h3 className="font-semibold text-blue-800 mb-2">Chat Direct</h3>
              <p className="text-sm text-blue-600">
                Conversații private cu alți utilizatori
              </p>
            </div>
            
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-3xl mb-3">🎧</div>
              <h3 className="font-semibold text-green-800 mb-2">Support</h3>
              <p className="text-sm text-green-600">
                Contactează echipa de suport pentru ajutor
              </p>
            </div>
            
            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <div className="text-3xl mb-3">👨‍👩‍👧‍👦</div>
              <h3 className="font-semibold text-purple-800 mb-2">Grupuri</h3>
              <p className="text-sm text-purple-600">
                Creează și participă la grupuri de discuții
              </p>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              💡 <strong>Tip:</strong> Toate mesajele sunt în timp real și poți vedea când cineva scrie.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}