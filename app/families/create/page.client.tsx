'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, FileText, Plus } from 'lucide-react';
import LargeInput from '@/components/LargeInput';
import LargeTextarea from '@/components/LargeTextarea';
import ElderFriendlyButton from '@/components/ElderFriendlyButton';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';

export default function CreateFamilyClient() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/families/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/families');
      } else {
        setError(data.error || t('error_occurred'));
      }
    } catch (err) {
      setError(t('network_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout user={{ id: 0, name: '', avatar: '', is_admin: 0 }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center">
          <Link href="/families" className="p-2 rounded-lg hover:bg-gray-100 mr-4">
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{t('create_new_family_title')}</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8 text-lg font-medium">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <LargeInput
              label={t('family_name')}
              type="text"
              value={formData.name}
              onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
              placeholder={t('family_name_placeholder')}
              required
              maxLength={50}
              icon={<Users className="h-7 w-7" />}
            />

            <LargeTextarea
              label={t('family_description')}
              value={formData.description}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              placeholder={t('family_description_placeholder')}
              rows={4}
              maxLength={200}
            />

            <div className="pt-4">
              <ElderFriendlyButton
                type="submit"
                disabled={loading || !formData.name.trim()}
                fullWidth
                size="lg"
              >
                <span className="flex items-center justify-center">
                  <Plus className="h-6 w-6 mr-2" />
                  {loading ? t('creating') : t('create_family_btn')}
                </span>
              </ElderFriendlyButton>
            </div>
          </form>

          <div className="mt-10 p-8 bg-gray-50 rounded-xl border-2 border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">{t('after_create_you_can')}</h3>
            <ul className="space-y-4 text-xl text-gray-600">
              <li className="flex items-start">
                <svg className="h-7 w-7 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('invite_family_members')}
              </li>
              <li className="flex items-start">
                <svg className="h-7 w-7 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('publish_announcements')}
              </li>
              <li className="flex items-start">
                <svg className="h-7 w-7 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('share_life_notes')}
              </li>
              <li className="flex items-start">
                <svg className="h-7 w-7 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('chat_with_family')}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
