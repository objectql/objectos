import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface ObjectMetadata {
  name: string;
  label: string;
  icon?: string;
  description?: string;
}

const Home: React.FC = () => {
  const [objects, setObjects] = useState<ObjectMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const fetchObjects = async () => {
      try {
        // Fetch list of available objects from server
        const response = await apiClient.get('/metadata/objects');
        setObjects(response.data);
      } catch (err) {
        console.error('Failed to fetch objects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchObjects();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">ObjectOS - AMIS</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">欢迎, {user?.name || user?.email}</span>
              <button
                onClick={signOut}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold mb-6">系统对象</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {objects.map((obj) => (
            <Link
              key={obj.name}
              to={`/object/${obj.name}`}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 block"
            >
              <div className="flex items-center mb-2">
                {obj.icon && (
                  <span className="text-2xl mr-3">{obj.icon}</span>
                )}
                <h3 className="text-lg font-semibold">{obj.label}</h3>
              </div>
              {obj.description && (
                <p className="text-gray-600 text-sm">{obj.description}</p>
              )}
              <div className="mt-4 text-blue-500 text-sm">
                查看详情 →
              </div>
            </Link>
          ))}
        </div>

        {objects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">暂无可用对象</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
