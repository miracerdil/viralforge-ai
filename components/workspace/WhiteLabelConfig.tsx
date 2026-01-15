'use client';

import { useState, useEffect } from 'react';
import { Palette, Globe, Image, Type, Code, Save, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { WhiteLabelTheme, DEFAULT_THEME, applyTheme, isValidHexColor } from '@/lib/theme/white-label';
import { cn } from '@/lib/utils';

interface WhiteLabelConfigProps {
  locale: string;
}

interface Settings {
  customDomain: string;
  customLogoUrl: string;
  customFaviconUrl: string;
  appName: string;
  supportEmail: string;
  supportUrl: string;
  theme: WhiteLabelTheme;
  hideViralForgeBranding: boolean;
  customCss: string;
  isActive: boolean;
}

export function WhiteLabelConfig({ locale }: WhiteLabelConfigProps) {
  const { currentWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    customDomain: '',
    customLogoUrl: '',
    customFaviconUrl: '',
    appName: 'ViralForge',
    supportEmail: '',
    supportUrl: '',
    theme: DEFAULT_THEME,
    hideViralForgeBranding: false,
    customCss: '',
    isActive: true,
  });

  const t = {
    title: locale === 'tr' ? 'White-Label Ayarları' : 'White-Label Settings',
    subtitle: locale === 'tr' ? 'Markanızı özelleştirin' : 'Customize your branding',
    sections: {
      branding: locale === 'tr' ? 'Marka' : 'Branding',
      domain: locale === 'tr' ? 'Domain' : 'Domain',
      theme: locale === 'tr' ? 'Tema' : 'Theme',
      advanced: locale === 'tr' ? 'Gelişmiş' : 'Advanced',
    },
    fields: {
      appName: locale === 'tr' ? 'Uygulama Adı' : 'App Name',
      customLogo: locale === 'tr' ? 'Özel Logo URL' : 'Custom Logo URL',
      customFavicon: locale === 'tr' ? 'Özel Favicon URL' : 'Custom Favicon URL',
      customDomain: locale === 'tr' ? 'Özel Domain' : 'Custom Domain',
      domainHelp: locale === 'tr' ? 'app.yourcompany.com gibi' : 'e.g. app.yourcompany.com',
      supportEmail: locale === 'tr' ? 'Destek E-postası' : 'Support Email',
      supportUrl: locale === 'tr' ? 'Destek URL' : 'Support URL',
      primaryColor: locale === 'tr' ? 'Ana Renk' : 'Primary Color',
      accentColor: locale === 'tr' ? 'Vurgu Rengi' : 'Accent Color',
      backgroundColor: locale === 'tr' ? 'Arkaplan' : 'Background',
      textColor: locale === 'tr' ? 'Metin Rengi' : 'Text Color',
      borderRadius: locale === 'tr' ? 'Köşe Yarıçapı' : 'Border Radius',
      fontFamily: locale === 'tr' ? 'Yazı Tipi' : 'Font Family',
      customCss: locale === 'tr' ? 'Özel CSS' : 'Custom CSS',
      hideBranding: locale === 'tr' ? 'ViralForge markasını gizle' : 'Hide ViralForge branding',
    },
    save: locale === 'tr' ? 'Kaydet' : 'Save',
    saving: locale === 'tr' ? 'Kaydediliyor...' : 'Saving...',
    preview: locale === 'tr' ? 'Önizle' : 'Preview',
    stopPreview: locale === 'tr' ? 'Önizlemeyi Durdur' : 'Stop Preview',
  };

  useEffect(() => {
    if (currentWorkspace) {
      fetchSettings();
    }
  }, [currentWorkspace]);

  const fetchSettings = async () => {
    if (!currentWorkspace) return;

    try {
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}/white-label`);
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings({
            customDomain: data.settings.customDomain || '',
            customLogoUrl: data.settings.customLogoUrl || '',
            customFaviconUrl: data.settings.customFaviconUrl || '',
            appName: data.settings.appName || 'ViralForge',
            supportEmail: data.settings.supportEmail || '',
            supportUrl: data.settings.supportUrl || '',
            theme: data.settings.theme || DEFAULT_THEME,
            hideViralForgeBranding: data.settings.hideViralForgeBranding || false,
            customCss: data.settings.customCss || '',
            isActive: data.settings.isActive ?? true,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentWorkspace) return;
    setSaving(true);

    try {
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}/white-label`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (previewing) {
      // Stop preview - reload page
      window.location.reload();
    } else {
      applyTheme(settings.theme, settings.customCss);
      setPreviewing(true);
    }
  };

  const updateTheme = (key: keyof WhiteLabelTheme, value: string) => {
    setSettings({
      ...settings,
      theme: { ...settings.theme, [key]: value },
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Branding Section */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Image className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{t.sections.branding}</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.fields.appName}</label>
            <input
              type="text"
              value={settings.appName}
              onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.fields.customLogo}</label>
            <input
              type="url"
              value={settings.customLogoUrl}
              onChange={(e) => setSettings({ ...settings, customLogoUrl: e.target.value })}
              placeholder="https://..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.fields.supportEmail}</label>
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.fields.supportUrl}</label>
            <input
              type="url"
              value={settings.supportUrl}
              onChange={(e) => setSettings({ ...settings, supportUrl: e.target.value })}
              placeholder="https://..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <label className="flex items-center gap-3 mt-6">
          <input
            type="checkbox"
            checked={settings.hideViralForgeBranding}
            onChange={(e) => setSettings({ ...settings, hideViralForgeBranding: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">{t.fields.hideBranding}</span>
        </label>
      </section>

      {/* Domain Section */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{t.sections.domain}</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.fields.customDomain}</label>
          <input
            type="text"
            value={settings.customDomain}
            onChange={(e) => setSettings({ ...settings, customDomain: e.target.value })}
            placeholder={t.fields.domainHelp}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </section>

      {/* Theme Section */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
            <Palette className="w-5 h-5 text-pink-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{t.sections.theme}</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.fields.primaryColor}</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.theme.primaryColor}
                onChange={(e) => updateTheme('primaryColor', e.target.value)}
                className="w-12 h-12 rounded-lg border border-gray-200 cursor-pointer"
              />
              <input
                type="text"
                value={settings.theme.primaryColor}
                onChange={(e) => isValidHexColor(e.target.value) && updateTheme('primaryColor', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.fields.accentColor}</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.theme.accentColor}
                onChange={(e) => updateTheme('accentColor', e.target.value)}
                className="w-12 h-12 rounded-lg border border-gray-200 cursor-pointer"
              />
              <input
                type="text"
                value={settings.theme.accentColor}
                onChange={(e) => isValidHexColor(e.target.value) && updateTheme('accentColor', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.fields.backgroundColor}</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.theme.backgroundColor}
                onChange={(e) => updateTheme('backgroundColor', e.target.value)}
                className="w-12 h-12 rounded-lg border border-gray-200 cursor-pointer"
              />
              <input
                type="text"
                value={settings.theme.backgroundColor}
                onChange={(e) => isValidHexColor(e.target.value) && updateTheme('backgroundColor', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.fields.textColor}</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.theme.textColor}
                onChange={(e) => updateTheme('textColor', e.target.value)}
                className="w-12 h-12 rounded-lg border border-gray-200 cursor-pointer"
              />
              <input
                type="text"
                value={settings.theme.textColor}
                onChange={(e) => isValidHexColor(e.target.value) && updateTheme('textColor', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.fields.borderRadius}</label>
            <select
              value={settings.theme.borderRadius}
              onChange={(e) => updateTheme('borderRadius', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="0">None (0)</option>
              <option value="0.25rem">Small (0.25rem)</option>
              <option value="0.5rem">Medium (0.5rem)</option>
              <option value="0.75rem">Large (0.75rem)</option>
              <option value="1rem">XL (1rem)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.fields.fontFamily}</label>
            <select
              value={settings.theme.fontFamily}
              onChange={(e) => updateTheme('fontFamily', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Poppins">Poppins</option>
              <option value="Montserrat">Montserrat</option>
            </select>
          </div>
        </div>
      </section>

      {/* Advanced Section */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Code className="w-5 h-5 text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{t.sections.advanced}</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.fields.customCss}</label>
          <textarea
            value={settings.customCss}
            onChange={(e) => setSettings({ ...settings, customCss: e.target.value })}
            rows={6}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
            placeholder="/* Custom CSS */"
          />
        </div>
      </section>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant={previewing ? 'outline' : 'ghost'}
          onClick={handlePreview}
        >
          <Eye className="w-4 h-4 mr-2" />
          {previewing ? t.stopPreview : t.preview}
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              {t.saving}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {t.save}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
