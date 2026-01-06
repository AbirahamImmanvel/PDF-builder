import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Layout, 
  Card, 
  Form, 
  Input, 
  Button, 
  Spin, 
  Typography, 
  Divider,
  Table,
  Space,
  Modal,
  message 
} from 'antd';
import { 
  ArrowLeftOutlined, 
  PrinterOutlined, 
  DownloadOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined
} from '@ant-design/icons';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import bwipjs from 'bwip-js';
import { useTemplates } from '../context/TemplateContext';
import './ViewTemplatePage.css';

// Initialize pdfMake fonts - EXACT SAME as PDFPreview.jsx
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if (pdfFonts && pdfFonts.vfs) {
  pdfMake.vfs = pdfFonts.vfs;
} else if (window && window.pdfMake && window.pdfMake.vfs) {
  // Already set globally - no action needed
} else {
  try {
     pdfMake.vfs = pdfFonts;
  } catch (e) {
     console.warn("Could not assign pdfFonts", e);
  }
}

const { Content, Sider } = Layout;
const { Title, Text } = Typography;

// Helper to find all named fields and repeatable tables in docDef
const extractDynamicElements = (docDef) => {
  const namedFields = [];
  const repeatableTables = [];

  const processNode = (node, path = []) => {
    if (!node || typeof node !== 'object') return;

    // Check for named text field
    if (node.name && (node.text !== undefined || typeof node === 'object')) {
      namedFields.push({
        name: node.name,
        defaultValue: node.text || '',
        path: [...path],
      });
    }

    // Check for repeatable table
    if (node.repeatable && node.table) {
      repeatableTables.push({
        id: node._id,
        name: node.name || 'Table',
        path: [...path],
        columns: node.table.widths?.length || node.table.body?.[0]?.length || 2,
        headers: node.table.body?.[0]?.map(cell => 
          typeof cell === 'string' ? cell : cell.text || 'Column'
        ) || [],
        headerRows: node.table.headerRows || 1,
      });
    }

    // Recursively process nested structures
    if (node.columns) {
      node.columns.forEach((col, i) => processNode(col, [...path, 'columns', i]));
    }
    if (node.stack) {
      node.stack.forEach((item, i) => processNode(item, [...path, 'stack', i]));
    }
    if (node.table?.body) {
      node.table.body.forEach((row, ri) => {
        row.forEach((cell, ci) => processNode(cell, [...path, 'table', 'body', ri, ci]));
      });
    }
    if (node.content) {
      node.content.forEach((item, i) => processNode(item, [...path, 'content', i]));
    }
  };

  if (docDef.content) {
    docDef.content.forEach((item, i) => processNode(item, ['content', i]));
  }

  return { namedFields, repeatableTables };
};

// Deep clone and apply values
const applyValuesToDocDef = (docDef, fieldValues, tableData) => {
  const clone = JSON.parse(JSON.stringify(docDef));

  const processNode = (node) => {
    if (!node || typeof node !== 'object') return;

    // Replace named field values
    if (node.name && fieldValues[node.name] !== undefined) {
      node.text = fieldValues[node.name];
    }

    // Handle repeatable tables
    if (node.repeatable && node.table && tableData[node._id]) {
      const rows = tableData[node._id];
      const headerRows = node.table.headerRows || 1;
      const headers = node.table.body.slice(0, headerRows);
      
      // Create new body with headers + data rows
      const newRows = rows.map(row => 
        row.map(cellValue => ({ text: cellValue || '' }))
      );
      
      node.table.body = [...headers, ...newRows];
    }

    // Recursively process
    if (node.columns) node.columns.forEach(processNode);
    if (node.stack) node.stack.forEach(processNode);
    if (node.table?.body) {
      node.table.body.forEach(row => row.forEach(processNode));
    }
    if (node.content) node.content.forEach(processNode);
  };

  if (clone.content) {
    clone.content.forEach(processNode);
  }

  return clone;
};

// Helper to fetch images/SVG (same as PDFPreview)
const fetchImageOrSVG = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Failed to fetch image: ${response.statusText}`);

    const contentType = response.headers.get("content-type");
    
    if (contentType?.includes("svg") || url.toLowerCase().endsWith(".svg")) {
        const text = await response.text();
        return { type: "svg", content: text };
    }

    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === "string" && result.startsWith("data:image")) {
          resolve({ type: "image", content: result });
        } else {
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("Failed to load image/svg", url, e);
    return null;
  }
};

// Preprocess for pdfmake (same as PDFPreview)
const convertBarcodeToImage = (barcodeData) => {
  try {
    const canvas = document.createElement("canvas");
    const barcodeType = barcodeData.type || "code128";

    const typeMap = {
      CODE128: "code128",
      CODE39: "code39",
      EAN13: "ean13",
      EAN8: "ean8",
      UPC: "upca",
      UPCA: "upca",
      UPCE: "upce",
    };

    const bcid = typeMap[barcodeType.toUpperCase()] || "code128";

    bwipjs.toCanvas(canvas, {
      bcid: bcid,
      text: barcodeData.barcode || "123456789",
      scale: 2,
      height: 8,
      includetext: true,
      textxalign: "center",
    });

    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
};

const preProcessDocDef = async (docDef) => {
  const clone = JSON.parse(JSON.stringify(docDef));

  const processNode = async (node) => {
    if (!node) return;
    if (typeof node === "object") {
      delete node._id;
      delete node.type;
      delete node.name;
      delete node.repeatable;

      if (node.barcode) {
        const barcodeImage = convertBarcodeToImage(node);
        if (barcodeImage) {
          delete node.barcode;
          node.image = barcodeImage;
          if (!node.width && !node.fit) {
            node.width = 150;
          } else if (node.fit) {
            node.width = node.fit;
            delete node.fit;
          }
        }
      }

      if (node.image && typeof node.image === "string") {
        let imgUrl = node.image;
        if (!imgUrl.startsWith("http") && !imgUrl.startsWith("data:")) {
           imgUrl = "https://" + imgUrl;
        }

        if (imgUrl.startsWith("http")) {
            const result = await fetchImageOrSVG(imgUrl);
            if (result) {
                if (result.type === 'svg') {
                    delete node.image;
                    node.svg = result.content;
                } else {
                    node.image = result.content;
                }
            } else {
                delete node.image;
                node.text = `[Image Load Failed: ${imgUrl}]`;
                node.color = "red";
                node.fontSize = 10;
            }
        }
      }

      if (node.columns) await Promise.all(node.columns.map(processNode));
      if (node.stack) await Promise.all(node.stack.map(processNode));
      // List items don't need recursive processing
      if (node.table && node.table.body) {
        for (let row of node.table.body) {
          await Promise.all(row.map(processNode));
        }
      }
    }
  };

  if (clone.content) {
    await Promise.all(clone.content.map(processNode));
  }

  return clone;
};

const ViewTemplatePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getTemplateById } = useTemplates();
  
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fieldValues, setFieldValues] = useState({});
  const [tableData, setTableData] = useState({});
  const [pdfUrl, setPdfUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [downloadFilename, setDownloadFilename] = useState('');

  // Load template
  useEffect(() => {
    const loadTemplate = async () => {
      setLoading(true);
      const result = await getTemplateById(id);
      if (result.success && result.data) {
        setTemplate(result.data);
        
        // Initialize field values and table data
        const { namedFields, repeatableTables } = extractDynamicElements(result.data.docDef);
        
        const initialFieldValues = {};
        namedFields.forEach(field => {
          initialFieldValues[field.name] = field.defaultValue;
        });
        setFieldValues(initialFieldValues);
        
        const initialTableData = {};
        repeatableTables.forEach(table => {
          initialTableData[table.id] = [Array(table.columns).fill('')];
        });
        setTableData(initialTableData);
      } else {
        message.error('Template not found');
        navigate('/');
      }
      setLoading(false);
    };
    loadTemplate();
  }, [id, getTemplateById, navigate]);

  // Extract dynamic elements
  const { namedFields, repeatableTables } = useMemo(() => {
    if (!template?.docDef) return { namedFields: [], repeatableTables: [] };
    return extractDynamicElements(template.docDef);
  }, [template]);

  // Generate PDF preview - EXACT SAME PATTERN as PDFPreview.jsx
  const generatePreview = useCallback(async () => {
    if (!template?.docDef) return;
    
    setGenerating(true);
    setPreviewError(null);
    
    try {
      const updatedDocDef = applyValuesToDocDef(template.docDef, fieldValues, tableData);
      const processed = await preProcessDocDef(updatedDocDef);
      
      const pdfDocGenerator = pdfMake.createPdf(processed);
      
      const getDataUrlPromise = new Promise((resolve, reject) => {
        const id = setTimeout(() => {
          reject(new Error("PDF Generation timed out (15s). Check console for details."));
        }, 15000);

        try {
          const potentialPromise = pdfDocGenerator.getDataUrl((dataUrl) => {
            clearTimeout(id);
            resolve(dataUrl);
          });
          
          if (potentialPromise && typeof potentialPromise.then === 'function') {
            potentialPromise.then((dataUrl) => {
              clearTimeout(id);
              resolve(dataUrl);
            });
          }
        } catch (err) {
          clearTimeout(id);
          reject(err);
        }
      });
      
      const url = await getDataUrlPromise;
      setPdfUrl(url);
      setGenerating(false);
    } catch (error) {
      setPreviewError(error.message || 'Failed to generate PDF');
      setGenerating(false);
    }
  }, [template, fieldValues, tableData]);

  // Generate preview on changes
  useEffect(() => {
    const timer = setTimeout(generatePreview, 500);
    return () => clearTimeout(timer);
  }, [generatePreview]);

  // Handle field value change
  const handleFieldChange = (name, value) => {
    setFieldValues(prev => ({ ...prev, [name]: value }));
  };

  // Handle table row operations
  const handleTableRowChange = (tableId, rowIndex, colIndex, value) => {
    setTableData(prev => {
      const newData = { ...prev };
      if (!newData[tableId]) newData[tableId] = [];
      if (!newData[tableId][rowIndex]) newData[tableId][rowIndex] = [];
      newData[tableId][rowIndex][colIndex] = value;
      return newData;
    });
  };

  const addTableRow = (tableId, colCount) => {
    setTableData(prev => ({
      ...prev,
      [tableId]: [...(prev[tableId] || []), Array(colCount).fill('')],
    }));
  };

  const removeTableRow = (tableId, rowIndex) => {
    setTableData(prev => {
      const rows = prev[tableId] || [];
      if (rows.length <= 1) return prev;
      return {
        ...prev,
        [tableId]: rows.filter((_, i) => i !== rowIndex),
      };
    });
  };

  // Open download modal
  const handleDownload = () => {
    setDownloadFilename(template.name || 'document');
    setDownloadModalOpen(true);
  };

  // Confirm download with filename
  const confirmDownload = async () => {
    if (!downloadFilename.trim()) {
      message.warning('Please enter a filename');
      return;
    }
    
    try {
      const updatedDocDef = applyValuesToDocDef(template.docDef, fieldValues, tableData);
      const processed = await preProcessDocDef(updatedDocDef);
      const pdfDocGenerator = pdfMake.createPdf(processed);
      pdfDocGenerator.download(`${downloadFilename.replace(/\s+/g, '_')}.pdf`);
      setDownloadModalOpen(false);
    } catch {
      message.error('Failed to download PDF');
    }
  };

  // Open browser print dialog
  const handlePrint = () => {
    if (!pdfUrl) {
      message.warning('Please wait for preview to load first');
      return;
    }
    
    // Convert data URL to Blob URL for better browser support
    const byteString = atob(pdfUrl.split(',')[1]);
    const mimeType = pdfUrl.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);
    
    // Open PDF in new window and trigger print
    const printWindow = window.open(blobUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    } else {
      message.error('Could not open print window. Please check popup blocker.');
      URL.revokeObjectURL(blobUrl);
    }
  };

  if (loading) {
    return (
      <div className="view-page-loading">
        <Spin size="large" />
        <Text type="secondary">Loading template...</Text>
      </div>
    );
  }

  if (!template) {
    return null;
  }

  const hasDynamicElements = namedFields.length > 0 || repeatableTables.length > 0;

  return (
    <Layout className="view-page-layout">
      <div className="view-page-header">
        <div className="view-page-header-left">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/')}
            type="text"
          >
            Back
          </Button>
          <div className="view-page-title-section">
            <Title level={4} style={{ margin: 0 }}>{template.name}</Title>
            {template.description && (
              <Text type="secondary">{template.description}</Text>
            )}
          </div>
        </div>
        <Space>
          <Button 
            icon={<EditOutlined />}
            onClick={() => navigate(`/builder/${id}`)}
          >
            Edit Template
          </Button>
          <Button 
            icon={<DownloadOutlined />}
            onClick={handleDownload}
          >
            Download
          </Button>
          <Button 
            type="primary" 
            icon={<PrinterOutlined />}
            onClick={handlePrint}
            className="print-btn"
          >
            Print
          </Button>
        </Space>
      </div>

      <Layout className="view-page-content">
        {hasDynamicElements && (
          <Sider width={400} theme="light" className="view-page-form-sider">
            <div className="view-page-form-container">
              <Title level={5}>Customize Values</Title>
              
              {namedFields.length > 0 && (
                <>
                  <Divider orientation="left" plain>Text Fields</Divider>
                  <Form layout="vertical">
                    {namedFields.map(field => (
                      <Form.Item 
                        key={field.name} 
                        label={field.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      >
                        <Input
                          value={fieldValues[field.name] || ''}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          placeholder={`Enter ${field.name}`}
                        />
                      </Form.Item>
                    ))}
                  </Form>
                </>
              )}

              {repeatableTables.map(table => (
                <div key={table.id} className="repeatable-table-section">
                  <Divider orientation="left" plain>{table.name}</Divider>
                  <Table
                    dataSource={(tableData[table.id] || []).map((row, i) => ({
                      key: i,
                      rowIndex: i,
                      ...row.reduce((acc, val, ci) => ({ ...acc, [`col${ci}`]: val }), {}),
                    }))}
                    columns={[
                      ...table.headers.map((header, ci) => ({
                        title: header,
                        dataIndex: `col${ci}`,
                        key: `col${ci}`,
                        render: (_, record) => (
                          <Input
                            size="small"
                            value={tableData[table.id]?.[record.rowIndex]?.[ci] || ''}
                            onChange={(e) => handleTableRowChange(table.id, record.rowIndex, ci, e.target.value)}
                            placeholder={header}
                          />
                        ),
                      })),
                      {
                        title: '',
                        key: 'action',
                        width: 50,
                        render: (_, record) => (
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => removeTableRow(table.id, record.rowIndex)}
                            disabled={(tableData[table.id]?.length || 0) <= 1}
                          />
                        ),
                      },
                    ]}
                    pagination={false}
                    size="small"
                  />
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => addTableRow(table.id, table.columns)}
                    style={{ width: '100%', marginTop: 8 }}
                  >
                    Add Row
                  </Button>
                </div>
              ))}
            </div>
          </Sider>
        )}

        <Content className="view-page-preview">
          <div className="preview-wrapper">
            <div className="preview-label">PDF Preview</div>
            {generating ? (
              <div className="preview-generating">
                <Spin />
                <Text type="secondary">Updating preview...</Text>
              </div>
            ) : previewError ? (
              <div className="preview-empty" style={{ color: 'red' }}>
                <Text type="danger">{previewError}</Text>
              </div>
            ) : pdfUrl ? (
              <iframe
                src={pdfUrl}
                title="PDF Preview"
                className="preview-iframe"
              />
            ) : (
              <div className="preview-empty">
                <Text type="secondary">Preview will appear here</Text>
              </div>
            )}
          </div>
        </Content>
      </Layout>

      {/* Download Filename Modal */}
      <Modal
        title="Download PDF"
        open={downloadModalOpen}
        onCancel={() => setDownloadModalOpen(false)}
        onOk={confirmDownload}
        okText="Download"
        cancelText="Cancel"
      >
        <div style={{ marginBottom: 16 }}>
          <Text>Enter filename for your PDF:</Text>
        </div>
        <Input
          value={downloadFilename}
          onChange={(e) => setDownloadFilename(e.target.value)}
          placeholder="Enter filename"
          suffix=".pdf"
          onPressEnter={confirmDownload}
        />
      </Modal>
    </Layout>
  );
};

export default ViewTemplatePage;
