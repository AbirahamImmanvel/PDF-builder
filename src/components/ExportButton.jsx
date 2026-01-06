import React, { useState } from "react";
import { Button, Modal } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { useBuilder } from "../context/BuilderContext";
import bwipjs from "bwip-js";

const convertImgToBase64 = async (url) => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

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
  } catch (e) {
    console.error("Barcode generation error:", e);
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

      if (
        node.image &&
        typeof node.image === "string" &&
        node.image.startsWith("http")
      ) {
        const b64 = await convertImgToBase64(node.image);
        if (b64) node.image = b64;
      }

      if (node.columns) await Promise.all(node.columns.map(processNode));
      if (node.stack) await Promise.all(node.stack.map(processNode));
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

const ExportButton = () => {
  const { state } = useBuilder();
  const [visible, setVisible] = useState(false);
  const [processedJson, setProcessedJson] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    setVisible(true);
    const processed = await preProcessDocDef(state.docDef);
    const jsonStr = JSON.stringify(processed, null, 2);
    setProcessedJson(jsonStr);
    setLoading(false);
  };

  return (
    <>
      <Button
        icon={<DownloadOutlined />}
        onClick={handleExport}
        loading={loading}
      >
        Export JSON
      </Button>
      <Modal
        title="Export Document Definition (pdfmake-ready)"
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        width={800}
      >
        <div style={{ marginBottom: 10, fontSize: 12, color: "#666" }}>
          This JSON is preprocessed and ready to use with pdfmake. Barcodes are
          converted to base64 images and internal metadata is removed.
        </div>
        <pre
          style={{
            maxHeight: "600px",
            overflow: "auto",
            backgroundColor: "#f5f5f5",
            padding: 10,
          }}
        >
          {processedJson || "Processing..."}
        </pre>
      </Modal>
    </>
  );
};

export default ExportButton;
