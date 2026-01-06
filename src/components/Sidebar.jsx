import React from "react";
import { Card, Button, Typography, Space } from "antd";
import {
  FontSizeOutlined,
  ColumnWidthOutlined,
  BarsOutlined,
  TableOutlined,
  FileImageOutlined,
  QrcodeOutlined,
} from "@ant-design/icons";
import { elementTemplates } from "../constants/templates";
import { useBuilder } from "../context/BuilderContext";

const { Title } = Typography;

const iconMap = {
  FontSizeOutlined: <FontSizeOutlined />,
  ColumnWidthOutlined: <ColumnWidthOutlined />,
  BarsOutlined: <BarsOutlined />,
  TableOutlined: <TableOutlined />,
  FileImageOutlined: <FileImageOutlined />,
  QrcodeOutlined: <QrcodeOutlined />,
};

const Sidebar = () => {
  const { state, dispatch } = useBuilder();

  const handleAdd = (template) => {
    const { selectedId } = state;
    dispatch({
      type: "ADD_ELEMENT",
      payload: {
        parentId: selectedId,
        element: JSON.parse(JSON.stringify(template.defaultContent)),
      },
    });
  };

  return (
    <div
      style={{
        padding: "10px 16px",
        borderBottom: "1px solid #f0f0f0",
        backgroundColor: "#fff",
        whiteSpace: "nowrap",
        overflowX: "auto",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <div style={{ fontWeight: 600, marginRight: 8, fontSize: 14 }}>Toolbox:</div>
      {elementTemplates.map((t) => (
        <Button
          key={t.type}
          icon={iconMap[t.icon]}
          onClick={() => handleAdd(t)}
          size="middle"
        >
          {t.label}
        </Button>
      ))}
    </div>
  );
};

export default Sidebar;
