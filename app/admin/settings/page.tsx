'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  Settings as SettingsIcon, 
  Save, 
  HelpCircle,
  Cpu,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Settings State
  const [globalDefaultPrompt, setGlobalDefaultPrompt] = useState('');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini');
  const [contentLengthPreference, setContentLengthPreference] = useState<'short' | 'medium' | 'long'>('medium');
  const [publishingMode, setPublishingMode] = useState<'manual' | 'automatic'>('manual');

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (!res.ok) throw new Error('Ayarlar yüklenemedi.');
      const data = await res.json();
      
      setGlobalDefaultPrompt(data.global_default_prompt);
      setOpenaiModel(data.openai_model);
      setContentLengthPreference(data.content_length_preference);
      setPublishingMode(data.publishing_mode);
    } catch (e) {
      toast.error('Ayarlar yüklenirken hata oluştu.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      global_default_prompt: globalDefaultPrompt,
      openai_model: openaiModel,
      content_length_preference: contentLengthPreference,
      publishing_mode: publishingMode,
    };

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Kaydetme başarısız.');
      toast.success('Sistem ayarları başarıyla güncellendi!');
      fetchSettings();
    } catch (error: any) {
      toast.error(error.message || 'Ayarlar kaydedilemedi.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-40">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
            <SettingsIcon className="text-emerald-400 w-8 h-8" />
            Sistem Ayarları
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Global varsayılan promptları, OpenAI yapay zeka modellerini ve içerik üretim ayarlarını yapılandırın.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Prompt configuration */}
        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800/60">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Yapay Zeka İçerik Promptu
            </h2>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Global Varsayılan prompt (Resul Ersürer İçerik Promptu)
            </label>
            <textarea
              value={globalDefaultPrompt}
              onChange={(e) => setGlobalDefaultPrompt(e.target.value)}
              className="w-full h-44 bg-slate-955 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm resize-none"
              placeholder="Yapay zeka promptunu girin..."
              required
            />
          </div>
        </div>

        {/* AI Engine Settings */}
        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-6 space-y-6">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800/60">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Yapay Zeka Motor Ayarları
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Model preference */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                OpenAI GPT Modeli
              </label>
              <select
                value={openaiModel}
                onChange={(e) => setOpenaiModel(e.target.value)}
                className="w-full bg-slate-955 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
              >
                <option value="gpt-4o-mini">gpt-4o-mini (Hızlı ve Ekonomik)</option>
                <option value="gpt-4o">gpt-4o (Gelişmiş Akıl Yürütme)</option>
              </select>
            </div>

            {/* Length preference */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Varsayılan İçerik Uzunluğu
              </label>
              <select
                value={contentLengthPreference}
                onChange={(e) => setContentLengthPreference(e.target.value as any)}
                className="w-full bg-slate-955 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
              >
                <option value="short">Kısa (Özet Makale)</option>
                <option value="medium">Orta (Standart Analiz)</option>
                <option value="long">Uzun (Detaylı Kılavuz)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Workflow Configuration */}
        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-6 space-y-6">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800/60">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Akış ve Yayınlama Modu
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              İçerik Yayınlama Modeli
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`border rounded-xl p-4 flex items-start space-x-3 cursor-pointer transition-all ${
                publishingMode === 'manual'
                  ? 'border-emerald-500/55 bg-emerald-500/5 text-slate-200 shadow-md'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-955/40 text-slate-400'
              }`}>
                <input
                  type="radio"
                  name="publishingMode"
                  value="manual"
                  checked={publishingMode === 'manual'}
                  onChange={() => setPublishingMode('manual')}
                  className="mt-1 text-emerald-500 focus:ring-emerald-500/55 w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold block text-slate-200">Manuel Onaylı (Önerilen)</span>
                  <span className="text-[10px] leading-relaxed block mt-1">
                    AI taslağı oluşturur ve onay kutuları ile yayına hazır yapılmayı bekler. Admin "Yayınla" demedikçe public sitede görünmez.
                  </span>
                </div>
              </label>

              <label className={`border rounded-xl p-4 flex items-start space-x-3 cursor-pointer transition-all ${
                publishingMode === 'automatic'
                  ? 'border-emerald-500/55 bg-emerald-500/5 text-slate-200 shadow-md'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-955/40 text-slate-400'
              }`}>
                <input
                  type="radio"
                  name="publishingMode"
                  value="automatic"
                  checked={publishingMode === 'automatic'}
                  onChange={() => setPublishingMode('automatic')}
                  className="mt-1 text-emerald-500 focus:ring-emerald-500/55 w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold block text-slate-200">Otomatik Taslak</span>
                  <span className="text-[10px] leading-relaxed block mt-1">
                    AI taslakları otomatik oluşturup listeye yerleştirir. Doğrudan taslak listesinden hızlı onaylanarak yayına sürülebilir.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Prompt Hierarchy Explanation Info Box */}
        <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 flex items-start space-x-3.5">
          <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-350 uppercase tracking-wider">Prompt Öncelik Akışı</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              İçerik üretiminde promptlar şu öncelik sırasına göre ezilmektedir:
            </p>
            <ol className="list-decimal pl-4 text-[10px] text-slate-500 space-y-1">
              <li><strong>Haber Özel Promptu:</strong> AI ile taslak oluştururken editörün o habere özel yazdığı prompt (En öncelikli).</li>
              <li><strong>Kaynak Promptu:</strong> Haber kaynağını eklerken veya düzenlerken yazdığınız kaynağa özel varsayılan prompt.</li>
              <li><strong>Global Varsayılan Prompt:</strong> Yukarıdaki "İçerik Promptu" kutusunda yer alan sistem genelindeki varsayılan prompt (En az öncelikli).</li>
            </ol>
          </div>
        </div>

        {/* Save button footer */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-955 font-bold px-6 py-2.5 rounded-xl transition-all text-xs shadow-lg shadow-emerald-500/10 flex items-center space-x-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Ayarlar Kaydediliyor...' : 'Ayarları Kaydet'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
