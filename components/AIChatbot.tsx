'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X, MessageCircle, Send, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatbot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true); // Controlează vizibilitatea butonului
  const [allowedPages, setAllowedPages] = useState<string[]>(['all']); // Paginile pe care poate apărea butonul
  const [shouldShow, setShouldShow] = useState(true); // Verifică dacă butonul este permis pe pagina curentă
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Bună! Cu ce te pot ajuta astăzi? 😊',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Verifică dacă butonul de chat este vizibil în setările UI
  useEffect(() => {
    const checkVisibility = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        console.log('🔵 [AIChatbot] Checking chat visibility from:', `${apiUrl}/api/public/ui-elements`);
        // Adaugă un timestamp pentru a evita cache-ul fără să folosim header-uri CORS
        const timestamp = new Date().getTime();
        const response = await fetch(`${apiUrl}/api/public/ui-elements?_t=${timestamp}`);
        
        if (response.ok) {
          const elements = await response.json();
          console.log('🔵 [AIChatbot] UI Elements received:', elements);
          
          // Caută elementul "Chat AI"
          const chatElement = elements.find((el: any) => 
            el.label === 'Chat AI' || (el.type === 'button' && el.icon === '💬')
          );
          
          console.log('🔵 [AIChatbot] Chat AI element found:', chatElement);
          
          if (chatElement) {
            // Salvează paginile permise
            setAllowedPages(chatElement.page || ['all']);
            // Setează vizibilitatea
            const newVisibility = chatElement.isVisible;
            console.log('🔵 [AIChatbot] Setting visibility to:', newVisibility);
            console.log('🔵 [AIChatbot] Current visibility:', isVisible);
            setIsVisible(newVisibility);
            console.log('🔵 [AIChatbot] Allowed pages:', chatElement.page);
          } else {
            console.log('🔵 [AIChatbot] Chat AI element NOT found, hiding button');
            setIsVisible(false);
            setAllowedPages([]);
          }
        } else {
          console.warn('🔵 [AIChatbot] API response not OK:', response.status);
          setIsVisible(false);
        }
      } catch (error) {
        console.error('🔵 [AIChatbot] Error checking chat visibility:', error);
        setIsVisible(false);
      }
    };

    // Verifică imediat la montare
    checkVisibility();
    
    // Verifică din nou la fiecare 10 secunde (backup pentru cazuri extreme)
    const interval = setInterval(checkVisibility, 10000);
    
    // Ascultă pentru Custom Event (actualizare instantanee în același tab)
    const handleCustomEvent = () => {
      console.log('🔵 [AIChatbot] 🔔 UI elements changed event received (same tab)');
      checkVisibility();
    };
    
    // Ascultă pentru schimbări în localStorage (notificări de la alte tab-uri)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ui-elements-updated') {
        console.log('🔵 [AIChatbot] 🔔 UI elements updated notification received (other tab)');
        checkVisibility();
      }
    };
    
    window.addEventListener('ui-elements-changed', handleCustomEvent as EventListener);
    window.addEventListener('storage', handleStorageChange);
    
    // Curăță interval-ul și listener-ele la demontare
    return () => {
      clearInterval(interval);
      window.removeEventListener('ui-elements-changed', handleCustomEvent as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(
        `${apiUrl}/api/ai/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.message },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.error || 'Îmi pare rău, am întâmpinat o eroare. Te rog încearcă din nou.',
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Îmi pare rău, nu m-am putut conecta la server. Verifică conexiunea și încearcă din nou.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Verifică dacă butonul este permis pe pagina curentă
  useEffect(() => {
    let currentPage = pathname?.split('/').filter(p => p).pop() || 'dashboard';
    if (!currentPage || currentPage === '') {
      currentPage = 'dashboard';
    }
    const isAllowedOnCurrentPage = allowedPages.includes('all') || allowedPages.includes(currentPage);
    
    console.log('🔵 [AIChatbot] ===== PAGE CHECK =====');
    console.log('🔵 [AIChatbot] Full pathname:', pathname);
    console.log('🔵 [AIChatbot] Pathname parts:', pathname?.split('/'));
    console.log('🔵 [AIChatbot] Current page (extracted):', currentPage);
    console.log('🔵 [AIChatbot] Allowed pages:', allowedPages);
    console.log('🔵 [AIChatbot] Is allowed on current page:', isAllowedOnCurrentPage);
    console.log('🔵 [AIChatbot] Is visible:', isVisible);
    console.log('🔵 [AIChatbot] ========================');
    
    setShouldShow(isVisible && isAllowedOnCurrentPage);
  }, [pathname, allowedPages, isVisible]);
  
  if (!shouldShow) {
    console.log('🔵 [AIChatbot] ❌ HIDING BUTTON');
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
          aria-label="Open AI Chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <h3 className="font-semibold">Asistent AI</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-700 p-1 rounded"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Scrie mesajul tău..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
