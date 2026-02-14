'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { AnnouncementBannerConfig } from '@/types';
import BannerPreview from './BannerPreview';
import Toast from '../Toast';
import { calculateContrastRatio, checkContrastCompliance, getContrastLevel } from '@/utils/colorContrast';

const defaultConfig: AnnouncementBannerConfig = {
  isActive: false,
  title: '',
  description: '',
  titleStyle: {
    color: '#000000',
    backgroundColor: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Arial',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  descriptionStyle: {
    color: '#333333',
    backgroundColor: '#F9FAFB',
    fontSize: 16,
    fontFamily: 'Arial',
    fontWeight: 'normal',
    textAlign: 'left',
  },
};

const fontFamilies = [
  'Arial',
  'Times New Roman',
  'Courier',
  'Georgia',
  'Verdana',
  'Helvetica',
  'Tahoma',
  'Trebuchet MS',
];

const fontWeights: Array<'normal' | 'bold' | 'light'> = ['normal', 'bold', 'light'];
const textAlignments: Array<'left' | 'center' | 'right'> = ['left', 'center', 'right'];

export default function AdminBannerEditor() {
  const [config, setConfig] = useState<AnnouncementBannerConfig>(defaultConfig);
  const [originalConfig, setOriginalConfig] = useState<AnnouncementBannerConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchCurrentConfig();
  }, []);

  useEffect(() => {
    setHasChanges(JSON.stringify(config) !== JSON.stringify(originalConfig));
  }, [config, originalConfig]);

  // Calculate contrast ratios for warnings
  const titleContrastRatio = calculateContrastRatio(
    config.titleStyle.color,
    config.titleStyle.backgroundColor
  );
  const descriptionContrastRatio = calculateContrastRatio(
    config.descriptionStyle.color,
    config.descriptionStyle.backgroundColor
  );

  // Check if title text is large (>= 18pt or >= 14pt bold)
  const isTitleLargeText = config.titleStyle.fontSize >= 24 || 
    (config.titleStyle.fontSize >= 18.67 && config.titleStyle.fontWeight === 'bold');
  
  // Check if description text is large
  const isDescriptionLargeText = config.descriptionStyle.fontSize >= 24 || 
    (config.descriptionStyle.fontSize >= 18.67 && config.descriptionStyle.fontWeight === 'bold');

  const titleContrastSufficient = checkContrastCompliance(
    config.titleStyle.color,
    config.titleStyle.backgroundColor,
    isTitleLargeText
  );

  const descriptionContrastSufficient = checkContrastCompliance(
    config.descriptionStyle.color,
    config.descriptionStyle.backgroundColor,
    isDescriptionLargeText
  );

  const fetchCurrentConfig = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/admin/announcement-banner');
      if (response.data?.data) {
        setConfig(response.data.data);
        setOriginalConfig(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching banner config:', error);
      setToast({
        message: 'Eroare la încărcarea configurației banner-ului',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const validateConfig = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    // Title length
    if (config.title.length > 200) {
      newErrors.title = 'Titlul nu poate depăși 200 de caractere';
    }

    // Description length
    if (config.description.length > 1000) {
      newErrors.description = 'Descrierea nu poate depăși 1000 de caractere';
    }

    // Color format validation
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;
    
    if (!hexColorRegex.test(config.titleStyle.color)) {
      newErrors.titleColor = 'Culoarea trebuie să fie în format hex (#RRGGBB)';
    }
    if (!hexColorRegex.test(config.titleStyle.backgroundColor)) {
      newErrors.titleBgColor = 'Culoarea de fundal trebuie să fie în format hex (#RRGGBB)';
    }
    if (!hexColorRegex.test(config.descriptionStyle.color)) {
      newErrors.descColor = 'Culoarea trebuie să fie în format hex (#RRGGBB)';
    }
    if (!hexColorRegex.test(config.descriptionStyle.backgroundColor)) {
      newErrors.descBgColor = 'Culoarea de fundal trebuie să fie în format hex (#RRGGBB)';
    }

    // Font size ranges
    if (config.titleStyle.fontSize < 12 || config.titleStyle.fontSize > 48) {
      newErrors.titleFontSize = 'Mărimea fontului trebuie să fie între 12 și 48 px';
    }
    if (config.descriptionStyle.fontSize < 12 || config.descriptionStyle.fontSize > 32) {
      newErrors.descFontSize = 'Mărimea fontului trebuie să fie între 12 și 32 px';
    }

    return newErrors;
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setErrors({});

      // Client-side validation
      const validationErrors = validateConfig();
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setToast({
          message: 'Vă rugăm să corectați erorile de validare',
          type: 'error',
        });
        return;
      }

      // API call
      await apiClient.put('/api/admin/announcement-banner', config);

      // Success feedback
      setToast({
        message: 'Banner salvat cu succes!',
        type: 'success',
      });
      setOriginalConfig(config);
    } catch (error: any) {
      // Handle API errors
      if (error.response?.data?.error) {
        setToast({
          message: error.response.data.error.message || 'Eroare la salvarea banner-ului',
          type: 'error',
        });
      } else {
        setToast({
          message: 'Eroare la salvarea banner-ului',
          type: 'error',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Editor Banner Anunțuri</h2>

        {/* Active Toggle */}
        <div className="mb-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.isActive}
              onChange={(e) => setConfig({ ...config, isActive: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Banner Activ (vizibil pe pagina principală)
            </span>
          </label>
        </div>

        {/* Content Section */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Conținut</h3>
          
          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titlu
              <span className="text-gray-500 ml-2">({config.title.length}/200)</span>
            </label>
            <input
              type="text"
              value={config.title}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
              className={`w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Introduceți titlul banner-ului"
              maxLength={200}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descriere
              <span className="text-gray-500 ml-2">({config.description.length}/1000)</span>
            </label>
            <textarea
              value={config.description}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
              className={`w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Introduceți descrierea banner-ului"
              rows={4}
              maxLength={1000}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>
        </div>

        {/* Title Style Section */}
        <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800">Stil Titlu</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title Text Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Culoare Text
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={config.titleStyle.color}
                  onChange={(e) => setConfig({
                    ...config,
                    titleStyle: { ...config.titleStyle, color: e.target.value }
                  })}
                  className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={config.titleStyle.color}
                  onChange={(e) => setConfig({
                    ...config,
                    titleStyle: { ...config.titleStyle, color: e.target.value }
                  })}
                  className={`flex-1 border rounded px-3 py-2 ${
                    errors.titleColor ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="#000000"
                />
              </div>
              {errors.titleColor && (
                <p className="text-red-500 text-sm mt-1">{errors.titleColor}</p>
              )}
            </div>

            {/* Title Background Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Culoare Fundal
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={config.titleStyle.backgroundColor}
                  onChange={(e) => setConfig({
                    ...config,
                    titleStyle: { ...config.titleStyle, backgroundColor: e.target.value }
                  })}
                  className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={config.titleStyle.backgroundColor}
                  onChange={(e) => setConfig({
                    ...config,
                    titleStyle: { ...config.titleStyle, backgroundColor: e.target.value }
                  })}
                  className={`flex-1 border rounded px-3 py-2 ${
                    errors.titleBgColor ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="#FFFFFF"
                />
              </div>
              {errors.titleBgColor && (
                <p className="text-red-500 text-sm mt-1">{errors.titleBgColor}</p>
              )}
            </div>

            {/* Title Font Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mărime Font: {config.titleStyle.fontSize}px
              </label>
              <input
                type="range"
                min="12"
                max="48"
                value={config.titleStyle.fontSize}
                onChange={(e) => setConfig({
                  ...config,
                  titleStyle: { ...config.titleStyle, fontSize: parseInt(e.target.value) }
                })}
                className="w-full"
              />
              {errors.titleFontSize && (
                <p className="text-red-500 text-sm mt-1">{errors.titleFontSize}</p>
              )}
            </div>

            {/* Title Font Family */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Familie Font
              </label>
              <select
                value={config.titleStyle.fontFamily}
                onChange={(e) => setConfig({
                  ...config,
                  titleStyle: { ...config.titleStyle, fontFamily: e.target.value }
                })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                {fontFamilies.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            {/* Title Font Weight */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Greutate Font
              </label>
              <select
                value={config.titleStyle.fontWeight}
                onChange={(e) => setConfig({
                  ...config,
                  titleStyle: { ...config.titleStyle, fontWeight: e.target.value as 'normal' | 'bold' | 'light' }
                })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                {fontWeights.map((weight) => (
                  <option key={weight} value={weight}>
                    {weight === 'normal' ? 'Normal' : weight === 'bold' ? 'Bold' : 'Light'}
                  </option>
                ))}
              </select>
            </div>

            {/* Title Text Alignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aliniere Text
              </label>
              <div className="flex gap-2">
                {textAlignments.map((align) => (
                  <button
                    key={align}
                    type="button"
                    onClick={() => setConfig({
                      ...config,
                      titleStyle: { ...config.titleStyle, textAlign: align }
                    })}
                    className={`flex-1 px-4 py-2 rounded border transition ${
                      config.titleStyle.textAlign === align
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {align === 'left' ? 'Stânga' : align === 'center' ? 'Centru' : 'Dreapta'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Contrast Warning for Title */}
          {titleContrastRatio !== null && !titleContrastSufficient && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <span className="text-yellow-600 text-lg">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  Contrast insuficient pentru titlu
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Raport contrast: {titleContrastRatio.toFixed(2)}:1 ({getContrastLevel(titleContrastRatio)})
                  <br />
                  {isTitleLargeText 
                    ? 'Minim recomandat pentru text mare: 3:1 (WCAG AA)'
                    : 'Minim recomandat pentru text normal: 4.5:1 (WCAG AA)'}
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Contrastul scăzut poate face textul greu de citit pentru utilizatori.
                </p>
              </div>
            </div>
          )}
          {titleContrastRatio !== null && titleContrastSufficient && (
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-green-600 text-lg">✓</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">
                  Contrast bun pentru titlu
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Raport contrast: {titleContrastRatio.toFixed(2)}:1 ({getContrastLevel(titleContrastRatio)})
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Description Style Section */}
        <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800">Stil Descriere</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Description Text Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Culoare Text
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={config.descriptionStyle.color}
                  onChange={(e) => setConfig({
                    ...config,
                    descriptionStyle: { ...config.descriptionStyle, color: e.target.value }
                  })}
                  className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={config.descriptionStyle.color}
                  onChange={(e) => setConfig({
                    ...config,
                    descriptionStyle: { ...config.descriptionStyle, color: e.target.value }
                  })}
                  className={`flex-1 border rounded px-3 py-2 ${
                    errors.descColor ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="#333333"
                />
              </div>
              {errors.descColor && (
                <p className="text-red-500 text-sm mt-1">{errors.descColor}</p>
              )}
            </div>

            {/* Description Background Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Culoare Fundal
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={config.descriptionStyle.backgroundColor}
                  onChange={(e) => setConfig({
                    ...config,
                    descriptionStyle: { ...config.descriptionStyle, backgroundColor: e.target.value }
                  })}
                  className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={config.descriptionStyle.backgroundColor}
                  onChange={(e) => setConfig({
                    ...config,
                    descriptionStyle: { ...config.descriptionStyle, backgroundColor: e.target.value }
                  })}
                  className={`flex-1 border rounded px-3 py-2 ${
                    errors.descBgColor ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="#F9FAFB"
                />
              </div>
              {errors.descBgColor && (
                <p className="text-red-500 text-sm mt-1">{errors.descBgColor}</p>
              )}
            </div>

            {/* Description Font Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mărime Font: {config.descriptionStyle.fontSize}px
              </label>
              <input
                type="range"
                min="12"
                max="32"
                value={config.descriptionStyle.fontSize}
                onChange={(e) => setConfig({
                  ...config,
                  descriptionStyle: { ...config.descriptionStyle, fontSize: parseInt(e.target.value) }
                })}
                className="w-full"
              />
              {errors.descFontSize && (
                <p className="text-red-500 text-sm mt-1">{errors.descFontSize}</p>
              )}
            </div>

            {/* Description Font Family */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Familie Font
              </label>
              <select
                value={config.descriptionStyle.fontFamily}
                onChange={(e) => setConfig({
                  ...config,
                  descriptionStyle: { ...config.descriptionStyle, fontFamily: e.target.value }
                })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                {fontFamilies.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            {/* Description Font Weight */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Greutate Font
              </label>
              <select
                value={config.descriptionStyle.fontWeight}
                onChange={(e) => setConfig({
                  ...config,
                  descriptionStyle: { ...config.descriptionStyle, fontWeight: e.target.value as 'normal' | 'bold' | 'light' }
                })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                {fontWeights.map((weight) => (
                  <option key={weight} value={weight}>
                    {weight === 'normal' ? 'Normal' : weight === 'bold' ? 'Bold' : 'Light'}
                  </option>
                ))}
              </select>
            </div>

            {/* Description Text Alignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aliniere Text
              </label>
              <div className="flex gap-2">
                {textAlignments.map((align) => (
                  <button
                    key={align}
                    type="button"
                    onClick={() => setConfig({
                      ...config,
                      descriptionStyle: { ...config.descriptionStyle, textAlign: align }
                    })}
                    className={`flex-1 px-4 py-2 rounded border transition ${
                      config.descriptionStyle.textAlign === align
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {align === 'left' ? 'Stânga' : align === 'center' ? 'Centru' : 'Dreapta'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Contrast Warning for Description */}
          {descriptionContrastRatio !== null && !descriptionContrastSufficient && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <span className="text-yellow-600 text-lg">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  Contrast insuficient pentru descriere
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Raport contrast: {descriptionContrastRatio.toFixed(2)}:1 ({getContrastLevel(descriptionContrastRatio)})
                  <br />
                  {isDescriptionLargeText 
                    ? 'Minim recomandat pentru text mare: 3:1 (WCAG AA)'
                    : 'Minim recomandat pentru text normal: 4.5:1 (WCAG AA)'}
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Contrastul scăzut poate face textul greu de citit pentru utilizatori.
                </p>
              </div>
            </div>
          )}
          {descriptionContrastRatio !== null && descriptionContrastSufficient && (
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-green-600 text-lg">✓</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">
                  Contrast bun pentru descriere
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Raport contrast: {descriptionContrastRatio.toFixed(2)}:1 ({getContrastLevel(descriptionContrastRatio)})
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            {hasChanges && (
              <span className="text-sm text-amber-600">
                Aveți modificări nesalvate
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className={`px-6 py-2 rounded font-medium transition ${
              isSaving || !hasChanges
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSaving ? 'Se salvează...' : 'Salvează Banner'}
          </button>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Preview Live</h3>
        <BannerPreview config={config} />
      </div>
    </div>
  );
}
