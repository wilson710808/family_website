'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import {
  BookOpen, Plus, Heart, MessageCircle, Share2, ArrowLeft,
  BookMarked, Edit3, Quote, Lightbulb, Users
} from 'lucide-react';
import ElderFriendlyButton from '@/components/ElderFriendlyButton';

interface BookItem {
  id: number;
  book_name: string;
  author: string;
  category: string;
  description: string;
  recommend_reason: string;
  likes_count: number;
  recommender_name: string;
  recommender_avatar: string;
  created_at: string;
}

interface NoteItem {
  id: number;
  book_name: string;
  chapter: string;
  note_type: string;
  content: string;
  page_number: number;
  likes_count: number;
  author_name: string;
  author_avatar: string;
  created_at: string;
}

interface Props {
  user: { id: number; name: string; avatar: string };
  families: { id: number; name: string }[];
  initialData: {
    books: BookItem[];
    notes: NoteItem[];
    stats: { bookCount: number; noteCount: number };
  } | null;
  initialFamilyId: number | null;
}

const NOTE_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  thought: { label: '心得', icon: <Lightbulb className="w-4 h-4" />, color: 'text-blue-500' },
  quote: { label: '摘錄', icon: <Quote className="w-4 h-4" />, color: 'text-green-500' },
  summary: { label: '總結', icon: <BookMarked className="w-4 h-4" />, color: 'text-purple-500' },
};

export default function GrowthSocialClient({ user, families, initialData, initialFamilyId }: Props) {
  const [selectedFamily, setSelectedFamily] = useState(initialFamilyId);
  const [activeTab, setActiveTab] = useState<'books' | 'notes'>('books');
  const [books, setBooks] = useState<BookItem[]>(initialData?.books || []);
  const [notes, setNotes] = useState<NoteItem[]>(initialData?.notes || []);
  const [stats, setStats] = useState(initialData?.stats || { bookCount: 0, noteCount: 0 });
  const [loading, setLoading] = useState(false);

  // 模态框
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);

  // 表单
  const [bookForm, setBookForm] = useState({
    book_name: '',
    author: '',
    category: '',
    description: '',
    recommend_reason: '',
  });
  const [noteForm, setNoteForm] = useState({
    book_name: '',
    chapter: '',
    note_type: 'thought',
    content: '',
    page_number: '',
    is_shared: true,
  });

  useEffect(() => {
    if (selectedFamily) {
      loadData(selectedFamily);
    }
  }, [selectedFamily]);

  const loadData = async (familyId: number) => {
    setLoading(true);
    try {
      const [booksRes, notesRes, statsRes] = await Promise.all([
        fetch(`/api/plugins/growth-column/social?familyId=${familyId}&type=books`),
        fetch(`/api/plugins/growth-column/social?familyId=${familyId}&type=notes`),
        fetch(`/api/plugins/growth-column/social?familyId=${familyId}&type=stats`),
      ]);

      const booksData = await booksRes.json();
      const notesData = await notesRes.json();
      const statsData = await statsRes.json();

      if (booksData.success) setBooks(booksData.books || []);
      if (notesData.success) setNotes(notesData.notes || []);
      if (statsData.success) setStats(statsData.stats);
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async () => {
    if (!bookForm.book_name) return;

    try {
      const res = await fetch('/api/plugins/growth-column/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'book',
          familyId: selectedFamily,
          userId: user.id,
          ...bookForm,
        }),
      });

      if (res.ok) {
        setBookForm({ book_name: '', author: '', category: '', description: '', recommend_reason: '' });
        setShowAddBookModal(false);
        loadData(selectedFamily!);
      }
    } catch (error) {
      console.error('添加失败:', error);
    }
  };

  const handleAddNote = async () => {
    if (!noteForm.book_name || !noteForm.content) return;

    try {
      const res = await fetch('/api/plugins/growth-column/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'note',
          familyId: selectedFamily,
          userId: user.id,
          ...noteForm,
          page_number: noteForm.page_number ? Number(noteForm.page_number) : null,
        }),
      });

      if (res.ok) {
        setNoteForm({ book_name: '', chapter: '', note_type: 'thought', content: '', page_number: '', is_shared: true });
        setShowAddNoteModal(false);
        loadData(selectedFamily!);
      }
    } catch (error) {
      console.error('添加失败:', error);
    }
  };

  const handleLike = async (type: 'book' | 'note', id: number) => {
    try {
      await fetch('/api/plugins/growth-column/social', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, targetId: id, userId: user.id, action: 'like' }),
      });
      loadData(selectedFamily!);
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  if (families.length === 0) {
    return (
      <Layout user={user}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">請先加入家族</h2>
            <p className="text-gray-500 mb-6">需要加入家族後才能使用社交功能</p>
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/plugins">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📚 家族書房</h1>
              <p className="text-gray-500 mt-1">分享書籍、記錄心得、共同成長</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">家族書單</p>
                <p className="text-2xl font-bold">{stats.bookCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
            <div className="flex items-center gap-3">
              <Edit3 className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">讀書筆記</p>
                <p className="text-2xl font-bold">{stats.noteCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Family Selector */}
        {families.length > 1 && (
          <div className="flex gap-2">
            {families.map(family => (
              <button
                key={family.id}
                onClick={() => setSelectedFamily(family.id)}
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

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('books')}
            className={`px-4 py-3 font-medium ${
              activeTab === 'books'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500'
            }`}
          >
            📖 家族書單
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-3 font-medium ${
              activeTab === 'notes'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500'
            }`}
          >
            ✏️ 讀書筆記
          </button>
        </div>

        {/* Add Button */}
        <div className="flex gap-2">
          {activeTab === 'books' && (
            <ElderFriendlyButton variant="primary" size="md" onClick={() => setShowAddBookModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              推薦書籍
            </ElderFriendlyButton>
          )}
          {activeTab === 'notes' && (
            <ElderFriendlyButton variant="primary" size="md" onClick={() => setShowAddNoteModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              寫筆記
            </ElderFriendlyButton>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
          </div>
        ) : activeTab === 'books' ? (
          <div className="space-y-4">
            {books.length > 0 ? (
              books.map(book => (
                <div key={book.id} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900">{book.book_name}</h3>
                      {book.author && <p className="text-gray-500">作者：{book.author}</p>}
                      {book.category && (
                        <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded">
                          {book.category}
                        </span>
                      )}
                      {book.description && (
                        <p className="text-gray-600 mt-2">{book.description}</p>
                      )}
                      {book.recommend_reason && (
                        <div className="mt-2 p-3 bg-yellow-50 rounded-lg">
                          <p className="text-sm text-yellow-800">💡 推薦理由：{book.recommend_reason}</p>
                        </div>
                      )}
                      <p className="text-sm text-gray-400 mt-2">
                        推薦人：{book.recommender_name} · {new Date(book.created_at).toLocaleDateString('zh-TW')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                    <button
                      onClick={() => handleLike('book', book.id)}
                      className="flex items-center gap-1 text-gray-500 hover:text-red-500"
                    >
                      <Heart className="w-5 h-5" />
                      <span>{book.likes_count}</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>還沒有推薦書籍，快來推薦一本吧！</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {notes.length > 0 ? (
              notes.map(note => {
                const typeInfo = NOTE_TYPE_LABELS[note.note_type] || NOTE_TYPE_LABELS.thought;
                return (
                  <div key={note.id} className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-gray-100 ${typeInfo.color}`}>
                        {typeInfo.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{note.book_name}</h4>
                          <span className={`text-sm ${typeInfo.color}`}>{typeInfo.label}</span>
                        </div>
                        {note.chapter && (
                          <p className="text-sm text-gray-500">章節：{note.chapter}</p>
                        )}
                        <p className="text-gray-700 mt-2">{note.content}</p>
                        {note.page_number && (
                          <p className="text-sm text-gray-400 mt-1">P.{note.page_number}</p>
                        )}
                        <p className="text-sm text-gray-400 mt-2">
                          {note.author_name} · {new Date(note.created_at).toLocaleDateString('zh-TW')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                      <button
                        onClick={() => handleLike('note', note.id)}
                        className="flex items-center gap-1 text-gray-500 hover:text-red-500"
                      >
                        <Heart className="w-5 h-5" />
                        <span>{note.likes_count}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Edit3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>還沒有讀書筆記，快來記錄你的閱讀心得吧！</p>
              </div>
            )}
          </div>
        )}

        {/* Add Book Modal */}
        {showAddBookModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📖 推薦書籍</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">書名 *</label>
                  <input
                    type="text"
                    value={bookForm.book_name}
                    onChange={e => setBookForm({ ...bookForm, book_name: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg"
                    placeholder="輸入書名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">作者</label>
                  <input
                    type="text"
                    value={bookForm.author}
                    onChange={e => setBookForm({ ...bookForm, author: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg"
                    placeholder="輸入作者名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分類</label>
                  <input
                    type="text"
                    value={bookForm.category}
                    onChange={e => setBookForm({ ...bookForm, category: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg"
                    placeholder="如：文學、歷史、科技"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">簡介</label>
                  <textarea
                    value={bookForm.description}
                    onChange={e => setBookForm({ ...bookForm, description: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg"
                    rows={3}
                    placeholder="書籍簡介"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">推薦理由</label>
                  <textarea
                    value={bookForm.recommend_reason}
                    onChange={e => setBookForm({ ...bookForm, recommend_reason: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg"
                    rows={2}
                    placeholder="為什麼推薦這本書？"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <ElderFriendlyButton variant="secondary" size="md" className="flex-1" onClick={() => setShowAddBookModal(false)}>
                  取消
                </ElderFriendlyButton>
                <ElderFriendlyButton variant="primary" size="md" className="flex-1" onClick={handleAddBook}>
                  推薦
                </ElderFriendlyButton>
              </div>
            </div>
          </div>
        )}

        {/* Add Note Modal */}
        {showAddNoteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-4">✏️ 寫讀書筆記</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">書名 *</label>
                  <input
                    type="text"
                    value={noteForm.book_name}
                    onChange={e => setNoteForm({ ...noteForm, book_name: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg"
                    placeholder="輸入書名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">章節</label>
                  <input
                    type="text"
                    value={noteForm.chapter}
                    onChange={e => setNoteForm({ ...noteForm, chapter: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg"
                    placeholder="如：第三章"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">筆記類型</label>
                  <div className="flex gap-2">
                    {Object.entries(NOTE_TYPE_LABELS).map(([key, info]) => (
                      <button
                        key={key}
                        onClick={() => setNoteForm({ ...noteForm, note_type: key })}
                        className={`px-3 py-2 rounded-lg flex items-center gap-1 ${
                          noteForm.note_type === key
                            ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {info.icon}
                        {info.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">內容 *</label>
                  <textarea
                    value={noteForm.content}
                    onChange={e => setNoteForm({ ...noteForm, content: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg"
                    rows={5}
                    placeholder="寫下你的讀書心得..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">頁碼</label>
                  <input
                    type="text"
                    value={noteForm.page_number}
                    onChange={e => setNoteForm({ ...noteForm, page_number: e.target.value })}
                    className="w-32 px-4 py-3 border rounded-lg"
                    placeholder="P.123"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <ElderFriendlyButton variant="secondary" size="md" className="flex-1" onClick={() => setShowAddNoteModal(false)}>
                  取消
                </ElderFriendlyButton>
                <ElderFriendlyButton variant="primary" size="md" className="flex-1" onClick={handleAddNote}>
                  保存
                </ElderFriendlyButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
