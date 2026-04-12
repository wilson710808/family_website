'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import {
  Folder, File, Upload, Plus, Trash2, Download, Search,
  ChevronRight, FileText, Image, FileSpreadsheet, FileArchive, ArrowLeft
} from 'lucide-react';
import ElderFriendlyButton from '@/components/ElderFriendlyButton';

interface FolderItem {
  id: number;
  name: string;
  created_at: string;
  creator_name: string;
}

interface FileItem {
  id: number;
  name: string;
  original_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
  uploader_name: string;
}

interface Stats {
  totalFiles: number;
  totalSize: number;
}

interface Props {
  user: { id: number; name: string; avatar: string };
  families: { id: number; name: string }[];
}

const FILE_TYPE_ICONS: Record<string, React.ReactNode> = {
  'image': <Image className="w-8 h-8 text-green-500" />,
  'pdf': <FileText className="w-8 h-8 text-red-500" />,
  'spreadsheet': <FileSpreadsheet className="w-8 h-8 text-green-600" />,
  'archive': <FileArchive className="w-8 h-8 text-yellow-600" />,
  'default': <File className="w-8 h-8 text-gray-400" />,
};

function getFileIcon(mimeType: string): React.ReactNode {
  if (mimeType.startsWith('image/')) return FILE_TYPE_ICONS.image;
  if (mimeType.includes('pdf')) return FILE_TYPE_ICONS.pdf;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FILE_TYPE_ICONS.spreadsheet;
  if (mimeType.includes('zip') || mimeType.includes('rar')) return FILE_TYPE_ICONS.archive;
  return FILE_TYPE_ICONS.default;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export default function DocumentsClient({ user, families }: Props) {
  const [selectedFamily, setSelectedFamily] = useState(families[0]?.id || null);
  const [currentFolder, setCurrentFolder] = useState<number | null>(null);
  const [folderPath, setFolderPath] = useState<{ id: number | null; name: string }[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [stats, setStats] = useState<Stats>({ totalFiles: 0, totalSize: 0 });
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (selectedFamily) {
      loadDocuments();
    }
  }, [selectedFamily, currentFolder]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        familyId: String(selectedFamily),
        folderId: currentFolder ? String(currentFolder) : '',
      });
      const res = await fetch(`/api/plugins/documents?${params}`);
      const data = await res.json();
      if (data.success) {
        setFolders(data.folders || []);
        setFiles(data.files || []);
        setStats(data.stats || { totalFiles: 0, totalSize: 0 });
      }
    } catch (error) {
      console.error('加载文档失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const res = await fetch('/api/plugins/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'folder',
          familyId: selectedFamily,
          name: newFolderName,
          parentId: currentFolder,
          userId: user.id,
        }),
      });

      if (res.ok) {
        setNewFolderName('');
        setShowNewFolderModal(false);
        loadDocuments();
      }
    } catch (error) {
      console.error('创建文件夹失败:', error);
    }
  };

  const handleDeleteFolder = async (id: number) => {
    if (!confirm('確定要刪除此文件夾及其所有內容嗎？')) return;

    try {
      await fetch(`/api/plugins/documents?type=folder&id=${id}`, { method: 'DELETE' });
      loadDocuments();
    } catch (error) {
      console.error('删除文件夹失败:', error);
    }
  };

  const handleDeleteFile = async (id: number) => {
    if (!confirm('確定要刪除此文件嗎？')) return;

    try {
      await fetch(`/api/plugins/documents?type=file&id=${id}`, { method: 'DELETE' });
      loadDocuments();
    } catch (error) {
      console.error('删除文件失败:', error);
    }
  };

  const navigateToFolder = (folderId: number | null, folderName: string) => {
    setCurrentFolder(folderId);
    if (folderId === null) {
      setFolderPath([]);
    } else {
      setFolderPath([...folderPath, { id: folderId, name: folderName }]);
    }
  };

  const navigateBack = () => {
    if (folderPath.length === 0) return;
    const newPath = folderPath.slice(0, -1);
    setFolderPath(newPath);
    setCurrentFolder(newPath.length > 0 ? newPath[newPath.length - 1].id : null);
  };

  const filteredFiles = files.filter(file =>
    file.original_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (families.length === 0) {
    return (
      <Layout user={user}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Folder className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">請先加入家族</h2>
            <p className="text-gray-500 mb-6">需要加入家族後才能使用文檔庫</p>
            <Link href="/families">
              <ElderFriendlyButton variant="primary" size="lg">前往家族頁面</ElderFriendlyButton>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/plugins">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📁 家族文檔庫</h1>
              <p className="text-gray-500 mt-1">
                共 {stats.totalFiles} 個文件，{formatFileSize(stats.totalSize)}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <ElderFriendlyButton variant="secondary" size="md" onClick={() => setShowNewFolderModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              新建文件夾
            </ElderFriendlyButton>
            <ElderFriendlyButton variant="primary" size="md" onClick={() => setShowUploadModal(true)}>
              <Upload className="w-4 h-4 mr-2" />
              上傳文件
            </ElderFriendlyButton>
          </div>
        </div>

        {/* Family Selector */}
        {families.length > 1 && (
          <div className="flex gap-2">
            {families.map(family => (
              <button
                key={family.id}
                onClick={() => {
                  setSelectedFamily(family.id);
                  setCurrentFolder(null);
                  setFolderPath([]);
                }}
                className={`px-4 py-2 rounded-lg font-medium ${
                  selectedFamily === family.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {family.name}
              </button>
            ))}
          </div>
        )}

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => navigateToFolder(null, '根目錄')}
            className="text-blue-600 hover:underline"
          >
            根目錄
          </button>
          {folderPath.map((folder, index) => (
            <span key={folder.id || index} className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">{folder.name}</span>
            </span>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索文件..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm">
            {/* Folders */}
            {folders.length > 0 && (
              <div className="p-4 border-b">
                <h3 className="text-sm font-medium text-gray-500 mb-3">文件夾</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {folders.map(folder => (
                    <div
                      key={folder.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer group"
                      onClick={() => navigateToFolder(folder.id, folder.name)}
                    >
                      <div className="flex items-center gap-2">
                        <Folder className="w-6 h-6 text-yellow-500" />
                        <span className="text-gray-900 truncate">{folder.name}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(folder.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Files */}
            {filteredFiles.length > 0 ? (
              <div className="divide-y">
                {filteredFiles.map(file => (
                  <div key={file.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      {getFileIcon(file.file_type)}
                      <div>
                        <p className="font-medium text-gray-900">{file.original_name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.file_size)} · {file.uploader_name} · {new Date(file.created_at).toLocaleDateString('zh-TW')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="p-2 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : folders.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <File className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>此文件夾為空</p>
              </div>
            ) : null}
          </div>
        )}

        {/* New Folder Modal */}
        {showNewFolderModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">新建文件夾</h3>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="文件夾名稱"
                className="w-full px-4 py-3 border rounded-lg mb-4"
              />
              <div className="flex gap-3">
                <ElderFriendlyButton variant="secondary" size="md" className="flex-1" onClick={() => setShowNewFolderModal(false)}>
                  取消
                </ElderFriendlyButton>
                <ElderFriendlyButton variant="primary" size="md" className="flex-1" onClick={handleCreateFolder}>
                  創建
                </ElderFriendlyButton>
              </div>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">上傳文件</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">點擊或拖拽文件到此處上傳</p>
                <p className="text-sm text-gray-400 mt-1">支持所有文件類型</p>
              </div>
              <div className="flex gap-3">
                <ElderFriendlyButton variant="secondary" size="md" className="flex-1" onClick={() => setShowUploadModal(false)}>
                  關閉
                </ElderFriendlyButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
