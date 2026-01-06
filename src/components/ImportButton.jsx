import React, { useState } from "react";
import { Button, Modal, Input, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useBuilder } from "../context/BuilderContext";
import { augmentDocDef } from "../utils/importHelpers";

const ImportButton = () => {
  const { dispatch } = useBuilder();
  const [visible, setVisible] = useState(false);
  const [jsonContent, setJsonContent] = useState("");
  const [error, setError] = useState(null);

  const handleImport = () => {
    try {
      let parsed;
      try {
        parsed = JSON.parse(jsonContent);
      } catch {
        try {
          const func = new Function("return " + jsonContent);
          parsed = func();
        } catch (evalErr) {
          throw new Error(
            "Could not parse as JSON or JS Object: " + evalErr.message
          );
        }
      }

      const augmented = augmentDocDef(parsed);

      dispatch({
        type: "SET_STATE",
        payload: {
          docDef: augmented,
          selectedId: null,
        },
      });

      setVisible(false);
      setJsonContent("");
      setError(null);
      message.success("Document imported successfully!");
    } catch (e) {
      console.error("Import Error:", e);
      setError(e.message);
    }
  };

  return (
    <>
      <Button icon={<UploadOutlined />} onClick={() => setVisible(true)}>
        Import JSON
      </Button>
      <Modal
        title="Import PDFMake JSON"
        open={visible}
        onCancel={() => {
          setVisible(false);
          setError(null);
        }}
        onOk={handleImport}
        okText="Import"
        width={800}
      >
        <div style={{ marginBottom: 10 }}>
          {/* <p>
            Paste your PDFMake JSON definition below. The builder will attempt
            to parse it and add necessary internal IDs.
          </p> */}
          <p style={{ fontSize: 12, color: "#999" }}>
            Note: This will replace your current document.
          </p>
        </div>

        <Input.TextArea
          rows={15}
          value={jsonContent}
          onChange={(e) => setJsonContent(e.target.value)}
          placeholder='{ "content": [ ... ] }'
          style={{ fontFamily: "monospace" }}
        />

        {error && <div style={{ color: "red", marginTop: 10 }}>{error}</div>}
      </Modal>
    </>
  );
};

export default ImportButton;
