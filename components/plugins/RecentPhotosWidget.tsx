'use client';

import { useState, useEffect } from 'react';
import { Images } from 'lucide-react';
import Link from 'next/link';

interface Photo {
  id: number;
  file_path: string;
  title: string | null;
}

interface RecentPhotosWidgetProps {
  familyId: number;
  maxItems?: number;
}

export default function RecentPhotosWidget({ familyId, maxItems = 8 }: RecentPhotosWidgetProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    async function fetchRecent() {
      try {
        const res = await fetch(`/api/plugins/album/photos?familyId=${familyId}&recent=true&limit=${maxItems}`);
        const data = await res.json();
        
        if (!data.enabled) {
          setEnabled(false);
          setLoading(false);
          return;
        }

        if (data.success) {
          setPhotos(data.photos);
        }
      } catch (error) {
        console.error('[RecentPhotosWidget] Failed to fetch:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecent();
  }, [familyId, maxItems]);

  if (!enabled || photos.length === 0) {
    return null; // 插件禁用或者没有照片，不显示
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="grid grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Images className="w-5 h-5 text-blue-500" />
          最新照片
        </h3>
        <Link 
          href={`/plugins/album?familyId=${familyId}`}
          className="text-sm text-blue-500 hover:underline"
        >
          查看全部 →
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {photos.map(photo => (
          <div key={photo.id} className="aspect-square overflow-hidden rounded-md bg-gray-100">
            <img
              src={photo.file_path}
              alt={photo.title || '照片'}
              className="w-full h-full object-cover hover:scale-105 transition-transform"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
