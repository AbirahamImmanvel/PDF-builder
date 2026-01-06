import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout, Button, Space, Input, Modal, message } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { BuilderProvider, useBuilder } from '../context/BuilderContext';
import { useTemplates } from '../context/TemplateContext';
import Sidebar from '../components/Sidebar';
import EditorCanvas from '../components/Editor/EditorCanvas';
import PropertiesPanel from '../components/Properties/PropertiesPanel';
import PDFPreview from '../components/Preview/PDFPreview';
import ExportButton from '../components/ExportButton';
import ImportButton from '../components/ImportButton';
import './BuilderPage.css';

const { Header, Content, Sider } = Layout;

const BuilderContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useBuilder();
  const { getTemplateById, createTemplate, updateTemplate } = useTemplates();
  
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] = useState(null);

  // Load template if editing
  useEffect(() => {
    const loadTemplate = async () => {
      if (id) {
        const result = await getTemplateById(id);
        if (result.success && result.data) {
          setTemplateName(result.data.name);
          setTemplateDescription(result.data.description || '');
          setIsEditMode(true);
          setCurrentTemplateId(id);
          dispatch({
            type: 'SET_STATE',
            payload: {
              docDef: result.data.docDef,
              selectedId: null,
            },
          });
        } else {
          message.error('Template not found');
          navigate('/');
        }
      }
    };
    loadTemplate();
  }, [id, getTemplateById, dispatch, navigate]);

  const handleSaveClick = () => {
    setSaveModalVisible(true);
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      message.error('Please enter a template name');
      return;
    }

    setSaving(true);
    
    const payload = {
      name: templateName.trim(),
      description: templateDescription.trim(),
      docDef: state.docDef,
    };

    let result;
    if (isEditMode && currentTemplateId) {
      result = await updateTemplate(currentTemplateId, payload);
    } else {
      result = await createTemplate(payload);
    }

    setSaving(false);
    setSaveModalVisible(false);

    if (result.success) {
      message.success(isEditMode ? 'Template updated successfully' : 'Template saved successfully');
      navigate('/');
    } else {
      message.error('Failed to save template');
    }
  };

  return (
    <Layout className="builder-layout">
      <Header className="builder-header">
        <div className="builder-header-left">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/')}
            type="text"
          >
            Back
          </Button>
          <h2 className="builder-title">
            {isEditMode ? `Editing: ${templateName}` : 'New Template'}
          </h2>
        </div>
        <Space>
          <ImportButton />
          <ExportButton />
          <Button 
            type="primary" 
            icon={<SaveOutlined />}
            onClick={handleSaveClick}
            className="save-btn"
          >
            Save Template
          </Button>
        </Space>
      </Header>

      {/* Horizontal Toolbox */}
      <div className="builder-toolbox">
        <Sidebar />
      </div>

      <Layout className="builder-content-layout">
        {/* Left: Properties */}
        <Sider 
          width={320} 
          theme="light" 
          className="builder-sider properties-sider"
        >
          <PropertiesPanel />
        </Sider>

        {/* Center: Editor */}
        <Content className="builder-editor">
          <EditorCanvas />
        </Content>

        {/* Right: Preview */}
        <Sider
          width="40%"
          theme="light"
          className="builder-sider preview-sider"
        >
          <div className="preview-container">
            <div className="preview-header">Live Preview</div>
            <div className="preview-content">
              <PDFPreview />
            </div>
          </div>
        </Sider>
      </Layout>

      <Modal
        title={isEditMode ? 'Update Template' : 'Save Template'}
        open={saveModalVisible}
        onOk={handleSave}
        onCancel={() => setSaveModalVisible(false)}
        confirmLoading={saving}
        okText={isEditMode ? 'Update' : 'Save'}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Template Name *
          </label>
          <Input
            placeholder="Enter template name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Description (optional)
          </label>
          <Input.TextArea
            placeholder="Enter a description for this template"
            value={templateDescription}
            onChange={(e) => setTemplateDescription(e.target.value)}
            rows={3}
          />
        </div>
      </Modal>
    </Layout>
  );
};

const BuilderPage = () => {
  return (
    <BuilderProvider>
      <BuilderContent />
    </BuilderProvider>
  );
};

export default BuilderPage;
