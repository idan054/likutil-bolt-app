import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../../../../config/firebase';
import type { DeliveryField, DeliveryIntegration } from '../../../../../../types/delivery';

export enum DeliveryProgramType {
    BALDAR = 'baldar',
    RUN = 'run',
    LION_WHEEL = 'lionWheel',
    GET_PACKAGE = 'getPackage',
    UNKNOWN = 'unknown'
  }

interface AddDeliveryCompanyFormData {
  provider: string;
  name: string;
  description: string;
  logoUrl: string;
  programType: DeliveryProgramType;  
  controlPanelLink: string;
  fields: Array<DeliveryField>;
}

interface AddDeliveryCompanyCardProps {
  editingIntegration?: DeliveryIntegration;
  onSubmit?: () => void;
}

export const AddDeliveryCompanyCard: React.FC<AddDeliveryCompanyCardProps> = ({
  editingIntegration,
  onSubmit
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<AddDeliveryCompanyFormData>({
    provider: '',
    name: '',
    description: '',
    logoUrl: '',
    programType: DeliveryProgramType.UNKNOWN, 
    controlPanelLink: '',
    fields: [{
    //   id: 'key',
    // type: 'text',
      label: '',
      placeholder: ''
    }]
  });

  useEffect(() => {
    if (editingIntegration) {
      setIsFormOpen(true);
      setFormData({
        provider: editingIntegration.provider,
        name: editingIntegration.name,
        description: editingIntegration.description,
        logoUrl: editingIntegration.logoUrl,
        programType: editingIntegration.programType,
        controlPanelLink: editingIntegration.controlPanelLink,
        fields: [{
          label: '',
          placeholder: ''
        }]
      });
    }
  }, [editingIntegration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const deliveryCompany: DeliveryIntegration = {
        ...formData,
        isConnected: editingIntegration?.isConnected ?? false
      };

      const docRef = doc(db, 'delivery_companies', formData.provider);
      await setDoc(docRef, deliveryCompany);
      
      setIsFormOpen(false);
      setFormData({
        provider: '',
        name: '',
        description: '',
        logoUrl: '',
        programType: DeliveryProgramType.UNKNOWN,
        controlPanelLink: '',
        fields: [{
        //   id: 'key',
        //   type: 'text',
          label: '',
          placeholder: ''
        }]
      });
      onSubmit?.();
    } catch (error) {
      console.error('Failed to add delivery company:', error);
    }
  };

  const addField = () => {
    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, {
        id: `field_${prev.fields.length + 1}`,
        label: '',
        type: 'text',
        placeholder: ''
      }]
    }));
  };

  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    if (isFormOpen) {
      return (
        <div className="p-6 rounded-lg border-2 border-gray-300 bg-white relative">
          <div className="absolute -top-3 right-4 px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-md border border-amber-200">
            למפתחים בלבד
          </div>
          <h3 className="font-semibold text-lg mb-4 text-amber-900">
            {editingIntegration ? `עריכת חברת משלוחים - ${editingIntegration.name}` : 'הוסף חברת משלוחים חדשה'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">מזהה</label>
              <input
                type="text"
                value={formData.provider}
                onChange={e => setFormData(prev => ({ ...prev, id: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
                disabled={!!editingIntegration}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">שם</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">תיאור</label>
              <input
                type="text"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">לוגו URL</label>
              <input
                type="text"
                value={formData.logoUrl}
                onChange={e => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">קישור לפאנל ניהול</label>
              <input
                type="text"
                value={formData.controlPanelLink}
                onChange={e => setFormData(prev => ({ ...prev, controlPanelLink: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">סוג חברת משלוחים</label>
              <select
                value={formData.programType}
                onChange={e => setFormData(prev => ({ ...prev, programType: e.target.value as DeliveryProgramType }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {Object.values(DeliveryProgramType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
 
            
            {/* <div className="space-y-4">
              <h4 className="font-medium text-gray-700">שדות</h4>
              {formData.fields.map((field, index) => (
                <div key={index} className="space-y-2">
                  <input
                    type="text"
                    value={field.label}
                    onChange={e => {
                      const newFields = [...formData.fields];
                      newFields[index] = { ...field, label: e.target.value };
                      setFormData(prev => ({ ...prev, fields: newFields }));
                    }}
                    placeholder="תווית"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={field.placeholder}
                    onChange={e => {
                      const newFields = [...formData.fields];
                      newFields[index] = { ...field, placeholder: e.target.value };
                      setFormData(prev => ({ ...prev, fields: newFields }));
                    }}
                    placeholder="טקסט מקדים"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              ))}
              
              <button
                type="button"
                onClick={addField}
                className="mt-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                + הוסף שדה
              </button>
            </div> */}
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setFormData({
                    provider: '',
                    name: '',
                    description: '',
                    logoUrl: '',
                    programType: DeliveryProgramType.UNKNOWN,
                    controlPanelLink: '',
                    fields: [{
                    //   id: 'key',
                    // type: 'text',
                      label: '',
                      placeholder: ''
                    }]
                  });
                  onSubmit?.();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
              >
                {editingIntegration ? 'בטל עריכה' : 'ביטול'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500"
              >
                {editingIntegration ? 'שמור שינויים' : 'שמור'}
              </button>
            </div>
          </form>
        </div>
      );
    }

    return (
      <div
        onClick={() => setIsFormOpen(true)}
        className="p-4 rounded-lg border-2 border-dashed border-amber-300 hover:border-amber-400 cursor-pointer transition-all hover:bg-amber-50 flex flex-col items-center justify-center text-center min-h-[200px] relative"
      >
        <div className="absolute -top-3 right-4 px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-md border border-amber-200">
        למפתחים בלבד
        </div>
        <div className="bg-amber-100 rounded-full p-3 mb-4">
          <Plus size={24} className="text-amber-600" />
        </div>
        <h3 className="font-semibold text-lg mb-2 text-amber-900">הוסף חברת משלוחים חדשה</h3>
        <p className="text-sm text-amber-700">
          הוסף חברת משלוחים חדשה למערכת
        </p>
      </div>
    );
  }

  return null;
};