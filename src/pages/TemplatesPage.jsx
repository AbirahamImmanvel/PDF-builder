import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Button, 
  Empty, 
  Spin, 
  Modal, 
  Typography, 
  Tooltip,
  message 
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  FileTextOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useTemplates } from '../context/TemplateContext';
import './TemplatesPage.css';

const { Title, Text, Paragraph } = Typography;

const TemplatesPage = () => {
  const navigate = useNavigate();
  const { templates, loading, fetchTemplates, deleteTemplate } = useTemplates();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleDelete = async () => {
    if (templateToDelete) {
      const result = await deleteTemplate(templateToDelete.id);
      if (result.success) {
        message.success('Template deleted successfully');
      } else {
        message.error('Failed to delete template');
      }
      setDeleteModalVisible(false);
      setTemplateToDelete(null);
    }
  };

  const confirmDelete = (template, e) => {
    e.stopPropagation();
    setTemplateToDelete(template);
    setDeleteModalVisible(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (loading && templates.length === 0) {
    return (
      <div className="templates-page">
        <div className="templates-loading">
          <Spin size="large" />
          <Text type="secondary">Loading templates...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="templates-page">
      <div className="templates-header">
        <div className="templates-header-content">
          <Title level={2} style={{ margin: 0 }}>Your Templates</Title>
          <Paragraph type="secondary" style={{ margin: 0 }}>
            Create, manage, and generate PDFs from your templates
          </Paragraph>
        </div>
        <Button 
          type="primary" 
          size="large"
          icon={<PlusOutlined />}
          onClick={() => navigate('/builder')}
          className="create-template-btn"
        >
          Create Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="templates-empty">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="empty-description">
                <Title level={4}>No templates yet</Title>
                <Text type="secondary">
                  Create your first PDF template to get started
                </Text>
              </div>
            }
          >
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => navigate('/builder')}
            >
              Create Your First Template
            </Button>
          </Empty>
        </div>
      ) : (
        <div className="templates-grid">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="template-card"
              hoverable
              onClick={() => navigate(`/view/${template.id}`)}
            >
              <div className="template-card-icon">
                <FileTextOutlined />
              </div>
              <div className="template-card-content">
                <Title level={5} className="template-card-title" ellipsis={{ rows: 1 }}>
                  {template.name}
                </Title>
                {template.description && (
                  <Paragraph 
                    type="secondary" 
                    className="template-card-description"
                    ellipsis={{ rows: 2 }}
                  >
                    {template.description}
                  </Paragraph>
                )}
                <div className="template-card-meta">
                  <ClockCircleOutlined />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatDate(template.updatedAt)}
                  </Text>
                </div>
              </div>
              <div className="template-card-actions">
                <Tooltip title="View & Generate">
                  <Button 
                    type="text" 
                    icon={<EyeOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/view/${template.id}`);
                    }}
                  />
                </Tooltip>
                <Tooltip title="Edit Template">
                  <Button 
                    type="text" 
                    icon={<EditOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/builder/${template.id}`);
                    }}
                  />
                </Tooltip>
                <Tooltip title="Delete">
                  <Button 
                    type="text" 
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => confirmDelete(template, e)}
                  />
                </Tooltip>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        title="Delete Template"
        open={deleteModalVisible}
        onOk={handleDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setTemplateToDelete(null);
        }}
        okText="Delete"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete "{templateToDelete?.name}"?</p>
        <p style={{ color: '#666' }}>This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default TemplatesPage;
