'use client';

import { useState, useEffect } from 'react';
import { Images, Plus, Trash2, Edit2, Image as ImageIcon, Heart, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface Album {
  id: number;
  family_id: number;
  title: string;
  description: string | null;
  cover_image: string | null;
  created_by: number;
  is_public: number;
  created_at: string;
  updated_at: string;
}

interface Photo {
  id: number;
  album_id: number;
  family_id: number;
  file_path: string;
  file_name: string;
  title: string | null;
}

export default function FamilyAlbumPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [showAddAlbum, setShowAddAlbum] = useState(false);
  
  const [familyId, setFamilyId] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return Number(params.get('familyId')) || 1;
    }
    return 1;
  });

  const [newAlbum, setNewAlbum] = useState({
    title: '',
    description: ''
  });

  useEffect(() => {
    if (familyId) {
      fetchAlbums();
    }
  }, [familyId]);

  async function fetchAlbums() {
    try {
      const res = await fetch(`/api/plugins/album/albums?familyId=${familyId}`);
      const data = await res.json();
      
      if (!data.enabled) {
        setEnabled(false);
        setLoading(false);
        return;
      }

      if (data.success) {
        setAlbums(data.albums);
      }
    } catch (error) {
      console.error('Failed to fetch albums:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAlbumPhotos(albumId: number) {
    try {
      const res = await fetch(`/api/plugins/album/photos?albumId=${albumId}&limit=50`);
      const data = await res.json();
      
      if (data.success) {
        setPhotos(data.photos);
      }
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    }
  }

  async function handleCreateAlbum(e: React.FormEvent) {
    e.preventDefault();
    
    const res = await fetch('/api/plugins/album/albums', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        family_id: familyId,
        title: newAlbum.title,
        description: newAlbum.description,
        is_public: 1
      })
    });

    const data = await res.json();
    if (data.success) {
      setShowAddAlbum(false);
      setNewAlbum({ title: '', description: '' });
      fetchAlbums();
    }
  }

  async function handleDeleteAlbum(id: number) {
    if (!confirm('确定要删除这个相册吗？所有照片也会被删除。')) return;
    
    const res = await fetch(`/api/plugins/album/albums?id=${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (data.success) {
      if (selectedAlbum?.id === id) {
        setSelectedAlbum(null);
        setPhotos([]);
      }
      fetchAlbums();
    }
  }

  function selectAlbum(album: Album) {
    setSelectedAlbum(album);
    fetchAlbumPhotos(album.id);
  }

  function getDefaultCover(album: Album) {
    if (album.cover_image) return album.cover_image;
    return 'https://placehold.co/400x300/f3f4f6/9ca3af?text=No+Cover';
  }

  if (!enabled) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <Images className="w-12 h-12 mx-auto text-yellow-400 mb-4" />
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">家族相册插件未启用</h2>
          <p className="text-yellow-600">该插件已被禁用，请在环境变量中设置 PLUGIN_FAMILY_ALBUM=true 启用。</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse">加载中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Images className="w-6 h-6 text-blue-500" />
            家族相册
          </h1>
          <p className="text-gray-500 mt-1">存储和分享家族美好回忆 · 插件式设计</p>
        </div>
        <button
          onClick={() => setShowAddAlbum(!showAddAlbum)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
        >
          <Plus className="w-4 h-4" />
          创建相册
        </button>
      </div>

      {/* 创建相册表单 */}
      {showAddAlbum && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">创建新相册</h2>
          <form onSubmit={handleCreateAlbum} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">相册名称</label>
              <input
                type="text"
                placeholder="例如：春节聚会 2026"
                value={newAlbum.title}
                onChange={e => setNewAlbum({...newAlbum, title: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">描述 (可选)</label>
              <textarea
                placeholder="描述一下这个相册..."
                value={newAlbum.description}
                onChange={e => setNewAlbum({...newAlbum, description: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowAddAlbum(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                创建
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 相册列表 */}
      {!selectedAlbum ? (
        <div>
          {albums.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">还没有创建任何相册</p>
              <p className="text-sm mt-1">点击上方 "创建相册" 开始吧</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {albums.map(album => (
                <div 
                  key={album.id} 
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => selectAlbum(album)}
                >
                  <div className="h-48 overflow-hidden bg-gray-100">
                    <img 
                      src={getDefaultCover(album)} 
                      alt={album.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{album.title}</h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAlbum(album.id);
                        }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {album.description && (
                      <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                        {album.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* 相册详情 - 照片列表 */
        <div>
          <div className="flex items-center gap-2 mb-6">
            <button 
              onClick={() => setSelectedAlbum(null)}
              className="text-blue-500 hover:underline"
            >
              ← 返回相册列表
            </button>
            <h2 className="text-xl font-semibold">{selectedAlbum.title}</h2>
          </div>

          {photos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">这个相册还没有照片</p>
              <p className="text-sm mt-1">上传一些照片开始分享回忆吧</p>
              {/* TODO: 照片上传功能 */}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map(photo => (
                <div key={photo.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-square overflow-hidden bg-gray-100">
                    <img 
                      src={photo.file_path} 
                      alt={photo.title || photo.file_name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {(photo.title || photo.title) && (
                    <div className="p-2">
                      <p className="text-sm font-medium line-clamp-1">{photo.title || photo.file_name}</p>
                    </div>
                  )}
                  <div className="px-2 pb-2 flex items-center gap-4 text-gray-500">
                    <div className="flex items-center gap-1 text-xs">
                      <Heart className="w-3 h-3" />
                      <span>0</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <MessageSquare className="w-3 h-3" />
                      <span>0</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer: 插件提示 */}
      <div className="mt-8 text-center text-sm text-gray-400">
        🖼️ 家族相册插件 · 可插拔设计 · 设置环境变量即可禁用
      </div>
    </div>
  );
}
