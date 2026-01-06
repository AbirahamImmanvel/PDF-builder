import React, { useState, useEffect } from "react";
import { Button, Tooltip, Space } from "antd";
import { 
  ZoomInOutlined, 
  ZoomOutOutlined, 
  CompressOutlined, 
  OneToOneOutlined 
} from "@ant-design/icons";
import { useBuilder } from "../../context/BuilderContext";
import ElementRenderer from "./ElementRenderer";

const EditorCanvas = () => {
  const { state, dispatch } = useBuilder();
  const { pageSize, pageMargins, content } = state.docDef;
  const [zoom, setZoom] = useState(1);
  const containerRef = React.useRef(null);

  const getPageDimensions = (size) => {
    if (typeof size === "object" && size.width && size.height) {
      return { width: Number(size.width), height: Number(size.height) };
    }
    if (size === "A4") return { width: 595.28, height: 841.89 };
    if (size === "LETTER") return { width: 612, height: 792 };
    return { width: 595.28, height: 841.89 };
  };

  const dims = getPageDimensions(pageSize);

  const handleFit = () => {
    if (containerRef.current) {
      const { offsetWidth, offsetHeight } = containerRef.current;
      const padding = 80; // Total vertical padding
      
      const scaleX = (offsetWidth - 40) / dims.width; // 40px horizontal cushion
      const scaleY = (offsetHeight - padding) / dims.height;
      if (scaleX > 0 && scaleY > 0) {
          setZoom(Math.min(scaleX, scaleY, 1.5)); // Cap fit at 1.5
      }
    }
  };

  useEffect(() => {
    handleFit();
  }, [pageSize]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        
        const ZOOM_SENSITIVITY = 0.002;
        const delta = -e.deltaY * ZOOM_SENSITIVITY;
        
        setZoom((prevZoom) => {
          const newZoom = prevZoom + delta;
          return Math.min(Math.max(newZoom, 0.2), 3);
        });
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);

  const handleBgClick = () => {
    dispatch({ type: "SELECT_ELEMENT", payload: null });
  };

  const handleZoomIn = (e) => {
      e.stopPropagation();
      setZoom(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = (e) => {
      e.stopPropagation();
      setZoom(prev => Math.max(prev - 0.1, 0.2));
  };

  const handleReset = (e) => {
      e.stopPropagation();
      setZoom(1);
  };
  
  const handleFitClick = (e) => {
      e.stopPropagation();
      handleFit();
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden", // Toolbar lives here, scroll view is child
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f0f2f5",
      }}
    >
        {/* Zoom Controls Toolbar - Absolute to sit on top of scroll view */}
        <div style={{
            position: "absolute",
            top: 20,
            left: 20,
            zIndex: 100,
            backgroundColor: "white",
            padding: "4px 8px",
            borderRadius: 6,
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            display: "flex",
            alignItems: "center",
            border: "1px solid #e0e0e0"
        }}>
            <Space size={4}>
                <Tooltip title="Zoom Out">
                    <Button icon={<ZoomOutOutlined />} onClick={handleZoomOut} size="small" type="text" />
                </Tooltip>
                <div style={{ fontSize: 13, minWidth: 44, textAlign: "center", userSelect: "none", fontWeight: 500 }}>
                    {Math.round(zoom * 100)}%
                </div>
                <Tooltip title="Zoom In">
                    <Button icon={<ZoomInOutlined />} onClick={handleZoomIn} size="small" type="text" />
                </Tooltip>
                <div style={{ width: 1, height: 16, backgroundColor: "#ddd", margin: "0 4px" }} />
                <Tooltip title="Fit to Screen">
                    <Button icon={<CompressOutlined />} onClick={handleFitClick} size="small" type="text" />
                </Tooltip>
                <Tooltip title="Actual Size (100%)">
                    <Button icon={<OneToOneOutlined />} onClick={handleReset} size="small" type="text" />
                </Tooltip>
            </Space>
        </div>

      {/* Scrollable Container */}
      <div 
        onClick={handleBgClick}
        style={{
            flex: 1,
            overflow: "auto",
            display: "flex",
            alignItems: "flex-start", // align top, justify center handled by margins
            justifyContent: "center",
            padding: "40px"
        }}
      >
        {/* Sizing Wrapper - Forces scrollbars to appear */}
        <div
            style={{
                width: dims.width * zoom,
                height: dims.height * zoom,
                position: "relative",
                flexShrink: 0, // Prevent shrinking
                transition: "width 0.2s, height 0.2s"
            }}
        >
            {/* Scaled Page Container */}
             <div
                style={{
                    width: dims.width,
                    height: dims.height,
                    backgroundColor: "white",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    paddingTop: pageMargins[1],
                    paddingRight: pageMargins[2],
                    paddingBottom: pageMargins[3],
                    paddingLeft: pageMargins[0],
                    boxSizing: "border-box",
                    position: "absolute", // Absolute within the sizing wrapper
                    top: 0,
                    left: 0,
                    transform: `scale(${zoom})`,
                    transformOrigin: "0 0", // Scale from top-left corner
                    transition: "transform 0.2s"
                }}
            >
                {content.map((item, idx) => (
                    <ElementRenderer key={item._id || idx} element={item} />
                ))}

                {content.length === 0 && (
                    <div style={{ textAlign: "center", color: "#ccc", marginTop: 50 }}>
                    Empty Page. Add elements from the toolbox.
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default EditorCanvas;
