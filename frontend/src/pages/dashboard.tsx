import { useUserData } from "../hooks/useUserData";

const Dashboard: React.FC = () => {
  const { userInfo, error, loading, refetch } = useUserData();

  if (loading) {
    return <div className="text-center text-gray-700">Lade Benutzerdaten...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  if (!userInfo) {
    return <div className="text-center text-gray-700">Keine Benutzerdaten verfügbar.</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <img src={userInfo.avatar} alt="Profilbild" className="w-24 h-24 rounded-full shadow-lg mb-4" />
      <h1 className="text-2xl font-semibold text-gray-900">{userInfo.globalname}</h1>
      <p className="text-gray-700">{userInfo.email}</p>
      <p className="text-gray-700">{userInfo.discordId}</p>
      <button 
        onClick={refetch} 
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Daten aktualisieren
      </button>
    </div>
  );
};

export default Dashboard;
