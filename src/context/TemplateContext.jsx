import React, { createContext, useContext, useState, useCallback } from 'react';
import * as templateApi from '../services/templateApi';

const TemplateContext = createContext();

export const TemplateProvider = ({ children }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await templateApi.fetchTemplates();
    if (result.success) {
      setTemplates(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
    return result;
  }, []);

  const getTemplateById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    const result = await templateApi.fetchTemplateById(id);
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
    return result;
  }, []);

  const createTemplate = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    const result = await templateApi.createTemplate(payload);
    if (result.success) {
      setTemplates(prev => [...prev, result.data]);
    } else {
      setError(result.error);
    }
    setLoading(false);
    return result;
  }, []);

  const updateTemplate = useCallback(async (id, payload) => {
    setLoading(true);
    setError(null);
    const result = await templateApi.updateTemplate(id, payload);
    if (result.success) {
      setTemplates(prev => prev.map(t => t.id === id ? result.data : t));
    } else {
      setError(result.error);
    }
    setLoading(false);
    return result;
  }, []);

  const deleteTemplate = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    const result = await templateApi.deleteTemplate(id);
    if (result.success) {
      setTemplates(prev => prev.filter(t => t.id !== id));
    } else {
      setError(result.error);
    }
    setLoading(false);
    return result;
  }, []);

  return (
    <TemplateContext.Provider
      value={{
        templates,
        loading,
        error,
        fetchTemplates,
        getTemplateById,
        createTemplate,
        updateTemplate,
        deleteTemplate,
      }}
    >
      {children}
    </TemplateContext.Provider>
  );
};

export const useTemplates = () => {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useTemplates must be used within a TemplateProvider');
  }
  return context;
};
