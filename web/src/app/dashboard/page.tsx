export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Statistiken */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Statistiken</h2>
          <div className="space-y-2">
            <p>Gesamte Buchungen: 0</p>
            <p>Offene Buchungen: 0</p>
            <p>Bewertungen: 0</p>
          </div>
        </div>

        {/* Letzte Aktivitäten */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Letzte Aktivitäten</h2>
          <div className="space-y-2">
            <p>Keine aktuellen Aktivitäten</p>
          </div>
        </div>

        {/* Schnellaktionen */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Schnellaktionen</h2>
          <div className="space-y-2">
            <button className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Profil bearbeiten
            </button>
            <button className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              Neue Buchung
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}