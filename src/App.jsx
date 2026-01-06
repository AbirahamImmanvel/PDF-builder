import React from "react";
import { Layout, Button, Space } from "antd";
import { BuilderProvider } from "./context/BuilderContext";
import Sidebar from "./components/Sidebar";
import EditorCanvas from "./components/Editor/EditorCanvas";
import PropertiesPanel from "./components/Properties/PropertiesPanel";
import PDFPreview from "./components/Preview/PDFPreview";
import ExportButton from "./components/ExportButton";
import ImportButton from "./components/ImportButton";

const { Header, Content, Sider } = Layout;

const AppContent = () => {
  return (
    <Layout style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <Header
        style={{
          background: "#fff",
          borderBottom: "1px solid #f0f0f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 20px",
          height: 64,
          flexShrink: 0,
        }}
      >
        <h2 style={{ margin: 0 }}>PDF Builder</h2>
        <Space>
          <ImportButton />
          <ExportButton />
        </Space>
      </Header>
      
      {/* Horizontal Toolbox */}
      <div style={{ flexShrink: 0 }}>
        <Sidebar />
      </div>

      <Layout style={{ flex: 1, overflow: "hidden" }}>
        {/* Left: Properties */}
        <Sider 
          width={320} 
          theme="light" 
          style={{ borderRight: "1px solid #f0f0f0", overflowY: "auto" }}
        >
          <PropertiesPanel />
        </Sider>

        {/* Center: Editor */}
        <Content
          style={{ 
            background: "#fafafa", 
            padding: "20px", 
            overflow: "auto",
            display: "flex",
            flexDirection: "column"
          }}
        >
          <EditorCanvas />
        </Content>

        {/* Right: Preview */}
        <Sider
          width="40%"
          theme="light"
          style={{ borderLeft: "1px solid #f0f0f0", padding: 0 }}
        >
          <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ 
                padding: "10px 16px", 
                borderBottom: "1px solid #f0f0f0",
                fontWeight: 600
            }}>
                Live Preview
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
                <PDFPreview />
            </div>
          </div>
        </Sider>
      </Layout>
    </Layout>
  );
};

const App = () => {
  return (
    <BuilderProvider>
      <AppContent />
    </BuilderProvider>
  );
};

export default App;
