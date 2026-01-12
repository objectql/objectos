import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AmisRenderer from '../components/AmisRenderer';
import apiClient from '../utils/api';
import { buildAmisCRUDSchema } from '../utils/schemaBuilder';

const ObjectPage: React.FC = () => {
  const { objectName } = useParams<{ objectName: string }>();
  const [schema, setSchema] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!objectName) return;
      
      try {
        setLoading(true);
        setError(null);

        // Fetch object metadata from server
        const response = await apiClient.get(`/metadata/${objectName}`);
        const objectMeta = response.data;

        // Build AMIS CRUD schema from metadata
        const amisSchema = buildAmisCRUDSchema(
          objectMeta,
          `/api/data/${objectName}`
        );

        setSchema(amisSchema);
      } catch (err: any) {
        console.error('Failed to fetch metadata:', err);
        setError(err.response?.data?.message || '加载对象元数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [objectName]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">加载失败</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!schema) {
    return null;
  }

  return (
    <div className="h-screen w-full">
      <AmisRenderer schema={schema} />
    </div>
  );
};

export default ObjectPage;
