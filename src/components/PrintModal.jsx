import React, { useState } from 'react';
import { Modal, Button } from 'antd';
import { PrinterOutlined, DownloadOutlined, CloseOutlined } from '@ant-design/icons';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import './PrintModal.css';

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

const PrintModal = ({ open, onClose, docDef, title = 'Print Preview' }) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generatePdfUrl = React.useCallback(async () => {
    if (!docDef) {
      setError('No document definition provided');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const pdfDocGenerator = pdfMake.createPdf(docDef);
      
      const getDataUrlPromise = new Promise((resolve, reject) => {
        const id = setTimeout(() => {
          reject(new Error("PDF Generation timed out (15s)."));
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
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to generate PDF');
      setLoading(false);
    }
  }, [docDef]);

  React.useEffect(() => {
    if (open && docDef) {
      generatePdfUrl();
    } else {
      setPdfUrl(null);
      setError(null);
    }
  }, [open, docDef, generatePdfUrl]);

  const handlePrint = () => {
    if (pdfUrl) {
      // Create an iframe to print from
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = pdfUrl;
      document.body.appendChild(iframe);
      
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.print();
          // Remove iframe after a delay
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 100);
      };
    }
  };

  const handleDownload = () => {
    if (docDef) {
      const pdfDocGenerator = pdfMake.createPdf(docDef);
      pdfDocGenerator.download(`${title.replace(/\s+/g, '_')}.pdf`);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <div className="print-modal-header">
          <span>{title}</span>
        </div>
      }
      width="80%"
      style={{ top: 20 }}
      footer={
        <div className="print-modal-footer">
          <Button icon={<CloseOutlined />} onClick={onClose}>
            Close
          </Button>
          <div className="print-modal-actions">
            <Button 
              icon={<DownloadOutlined />} 
              onClick={handleDownload}
              disabled={!pdfUrl}
            >
              Download PDF
            </Button>
            <Button 
              type="primary" 
              icon={<PrinterOutlined />} 
              onClick={handlePrint}
              disabled={!pdfUrl}
              className="print-btn"
            >
              Print
            </Button>
          </div>
        </div>
      }
      className="print-modal"
    >
      <div className="print-modal-content">
        {loading ? (
          <div className="print-modal-loading">
            <div className="loading-spinner"></div>
            <p>Generating PDF...</p>
          </div>
        ) : error ? (
          <div className="print-modal-error">
            <p>{error}</p>
          </div>
        ) : pdfUrl ? (
          <iframe
            src={pdfUrl}
            title="PDF Preview"
            className="print-modal-iframe"
          />
        ) : (
          <div className="print-modal-error">
            <p>Preparing document...</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PrintModal;
