export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Contact</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Informații Contact</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">📧 Email</h3>
                <a 
                  href="mailto:crys.cristi@yahoo.com" 
                  className="text-blue-600 hover:text-blue-800 hover:underline block"
                >
                  crys.cristi@yahoo.com
                </a>
                <a 
                  href="mailto:crys.cristi@yahoo.com" 
                  className="text-blue-600 hover:text-blue-800 hover:underline block"
                >
                  crys.cristi@yahoo.com
                </a>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">📞 Telefon</h3>
                <a 
                  href="tel:+0753615752" 
                  className="text-blue-600 hover:text-blue-800 hover:underline block"
                >
                  0753615742
                </a>
                <p className="text-gray-600">Magazin fizic Luni - Vineri: 9:00 - 18:00</p>
                  <p className="text-gray-600">Magazin online Non-stop</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">📍 Adresă</h3>
                <p className="text-gray-600">
                  Str. Gari nr. 69<br />
                  Galati, România<br />
                  Cod poștal: 08001
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">🕐 Program</h3>
                <p className="text-gray-600">
                  Magazin fizic<br />
                  Luni - Vineri: 9:00 - 18:00<br />
                  Sâmbătă: 10:00 - 14:00<br />
                  Duminică: Închis
                </p>
                <p className="text-gray-600 mt-2">
                  Magazin online<br />
                  Non stop
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Trimite-ne un Mesaj</h2>
            
            <form className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nume
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Numele tău"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subiect
                </label>
                <input
                  type="text"
                  id="subject"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Subiectul mesajului"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Mesaj
                </label>
                <textarea
                  id="message"
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Scrie mesajul tău aici..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Trimite Mesaj
              </button>
            </form>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Întrebări Frecvente</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Cum pot plasa o comandă?</h3>
              <p className="text-gray-600">
                Adaugă produsele dorite în coș, mergi la checkout și completează datele de livrare.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Care sunt metodele de plată acceptate?</h3>
              <p className="text-gray-600">
                Acceptăm plata cu cardul, transfer bancar și ramburs la livrare.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Cât durează livrarea?</h3>
              <p className="text-gray-600">
                Livrarea standard durează 2-3 zile lucrătoare. Oferim și livrare express în 24h.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Pot returna un produs?</h3>
              <p className="text-gray-600">
                Da, ai 30 de zile pentru a returna produsele în stare originală.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
