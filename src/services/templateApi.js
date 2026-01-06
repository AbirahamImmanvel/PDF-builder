/**
 * Template API Service
 * ====================
 * Centralized API for template CRUD operations.
 * Currently uses localStorage as a dummy backend.
 * Replace fetch calls with real API endpoints later.
 * 
 * ============================================================
 * API ENDPOINTS STRUCTURE (for backend implementation)
 * ============================================================
 * 
 * GET /api/templates
 * Response: { success: true, data: Template[] }
 * 
 * GET /api/templates/:id
 * Response: { success: true, data: Template }
 * 
 * POST /api/templates
 * Request:  { name: string, description?: string, docDef: object }
 * Response: { success: true, data: Template }
 * 
 * PUT /api/templates/:id
 * Request:  { name?: string, description?: string, docDef?: object }
 * Response: { success: true, data: Template }
 * 
 * DELETE /api/templates/:id
 * Response: { success: true, data: { id: string } }
 * 
 * ============================================================
 * TEMPLATE SCHEMA
 * ============================================================
 * Template {
 *   id: string (UUID)
 *   name: string
 *   description: string | null
 *   docDef: object (pdfmake document definition)
 *   createdAt: string (ISO date)
 *   updatedAt: string (ISO date)
 * }
 */

import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'pdf-builder-templates';
const API_BASE_URL = '/api'; // TODO: Replace with actual backend URL

// Simulate network delay for realistic behavior
const simulateDelay = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to get templates from localStorage
const getStoredTemplates = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// Helper to save templates to localStorage
const saveStoredTemplates = (templates) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
};

/**
 * Fetch all templates
 * GET /api/templates
 * @returns {Promise<{ success: boolean, data: Template[], error?: string }>}
 */
export const fetchTemplates = async () => {
  await simulateDelay();
  
  // TODO: Replace with real API call
  // const response = await fetch(`${API_BASE_URL}/templates`);
  // return response.json();
  
  try {
    const templates = getStoredTemplates();
    return { success: true, data: templates };
  } catch (error) {
    return { success: false, data: [], error: error.message };
  }
};

/**
 * Fetch a single template by ID
 * GET /api/templates/:id
 * @param {string} id - Template ID
 * @returns {Promise<{ success: boolean, data: Template | null, error?: string }>}
 */
export const fetchTemplateById = async (id) => {
  await simulateDelay();
  
  // TODO: Replace with real API call
  // const response = await fetch(`${API_BASE_URL}/templates/${id}`);
  // return response.json();
  
  try {
    const templates = getStoredTemplates();
    const template = templates.find(t => t.id === id);
    if (!template) {
      return { success: false, data: null, error: 'Template not found' };
    }
    return { success: true, data: template };
  } catch (error) {
    return { success: false, data: null, error: error.message };
  }
};

/**
 * Create a new template
 * POST /api/templates
 * @param {Object} payload - { name: string, description?: string, docDef: object }
 * @returns {Promise<{ success: boolean, data: Template | null, error?: string }>}
 */
export const createTemplate = async (payload) => {
  await simulateDelay();
  
  // TODO: Replace with real API call
  // const response = await fetch(`${API_BASE_URL}/templates`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(payload),
  // });
  // return response.json();
  
  try {
    const { name, description = '', docDef } = payload;
    const now = new Date().toISOString();
    const newTemplate = {
      id: uuidv4(),
      name,
      description,
      docDef,
      createdAt: now,
      updatedAt: now,
    };
    
    const templates = getStoredTemplates();
    templates.push(newTemplate);
    saveStoredTemplates(templates);
    
    return { success: true, data: newTemplate };
  } catch (error) {
    return { success: false, data: null, error: error.message };
  }
};

/**
 * Update an existing template
 * PUT /api/templates/:id
 * @param {string} id - Template ID
 * @param {Object} payload - { name?: string, description?: string, docDef?: object }
 * @returns {Promise<{ success: boolean, data: Template | null, error?: string }>}
 */
export const updateTemplate = async (id, payload) => {
  await simulateDelay();
  
  // TODO: Replace with real API call
  // const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
  //   method: 'PUT',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(payload),
  // });
  // return response.json();
  
  try {
    const templates = getStoredTemplates();
    const index = templates.findIndex(t => t.id === id);
    
    if (index === -1) {
      return { success: false, data: null, error: 'Template not found' };
    }
    
    const updatedTemplate = {
      ...templates[index],
      ...payload,
      updatedAt: new Date().toISOString(),
    };
    
    templates[index] = updatedTemplate;
    saveStoredTemplates(templates);
    
    return { success: true, data: updatedTemplate };
  } catch (error) {
    return { success: false, data: null, error: error.message };
  }
};

/**
 * Delete a template
 * DELETE /api/templates/:id
 * @param {string} id - Template ID
 * @returns {Promise<{ success: boolean, data: { id: string } | null, error?: string }>}
 */
export const deleteTemplate = async (id) => {
  await simulateDelay();
  
  // TODO: Replace with real API call
  // const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
  //   method: 'DELETE',
  // });
  // return response.json();
  
  try {
    const templates = getStoredTemplates();
    const index = templates.findIndex(t => t.id === id);
    
    if (index === -1) {
      return { success: false, data: null, error: 'Template not found' };
    }
    
    templates.splice(index, 1);
    saveStoredTemplates(templates);
    
    return { success: true, data: { id } };
  } catch (error) {
    return { success: false, data: null, error: error.message };
  }
};

export default {
  fetchTemplates,
  fetchTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};
