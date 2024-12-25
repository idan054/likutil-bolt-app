import React, { useState, useEffect, useCallback } from 'react';
import { X, Loader2, Trash2 } from 'lucide-react';
import type { DeliveryIntegration } from '../../../../../../types/delivery';

interface IntegrationFormProps {
  integration: DeliveryIntegration;
  onSave: (id: string, data: Record<string, string>) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onTest: (id: string, key: string) => Promise<boolean>;
  onClose: () => void;
  isLoading: boolean;
  isTesting: boolean;
  isRemoving: boolean;
  initialData?: Record<string, string>;
}

export const IntegrationForm: React.FC<IntegrationFormProps> = ({
  integration,
  onSave,
  onRemove,
  onTest,
  onClose,
  isLoading,
  isTesting,
  isRemoving,
  initialData = {}
}) => {
  const [formData, setFormData] = useState<Record<string, string>>(initialData);

  // Only update form data when initialData changes
  useEffect(() => {
    if (Object.keys(initialData).length > 0) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(integration.id, formData);
  }, [integration.id, formData, onSave]);

  const handleTest = useCallback(async () => {
    await onTest(integration.id, formData.key || '');
  }, [integration.id, formData.key, onTest]);

  const handleRemove = useCallback(async () => {
    if (window.confirm('האם אתה בטוח שברצונך להסיר את החיבור?')) {
      await onRemove(integration.id);
    }
  }, [integration.id, onRemove]);

  const handleInputChange = useCallback((fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  }, []);

  return (
    <div className="bg-gray-50 rounded-lg p-6 mt-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">הגדרות {integration.name}</h3>
        <div className="flex items-center gap-2">
          {integration.isConnected && (
            <button
              onClick={handleRemove}
              disabled={isRemoving}
              className="text-red-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              title="הסר חיבור"
            >
              {isRemoving ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Trash2 size={20} />
              )}
            </button>
          )}
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {integration.fields.map(field => (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            <input
              type={field.type}
              value={formData[field.id] || ''}
              onChange={e => handleInputChange(field.id, e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder={field.placeholder}
              required
            />
            {field.supportText && (
              <p className="mt-1 text-sm text-gray-500">
                {field.supportText}
                {field.supportPhone && (
                  <>
                    {' - '}
                    <a 
                      href={`tel:${field.supportPhone}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {field.supportPhone}
                    </a>
                  </>
                )}
              </p>
            )}
          </div>
        ))}

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={handleTest}
            disabled={isTesting || isLoading}
            className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
          >
            {isTesting ? (
              <>
                <Loader2 className="inline-block animate-spin mr-2" size={16} />
                בודק...
              </>
            ) : (
              'בדיקת חיבור'
            )}
          </button>

          <button
            type="submit"
            disabled={isLoading || isTesting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="inline-block animate-spin mr-2" size={16} />
                שומר...
              </>
            ) : (
              'שמור'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};