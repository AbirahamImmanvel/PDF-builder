import React, { useEffect } from "react";
import {
  Form,
  Input,
  InputNumber,
  Switch,
  Button,
  Divider,
  Select,
  Collapse,
  Tag,
  Row,
  Col,
  Space,
} from "antd";
import { DeleteOutlined, PlusOutlined, MinusOutlined } from "@ant-design/icons";
import { useBuilder } from "../../context/BuilderContext";
import { findNode, findNodeInfo } from "../../utils/treeHelpers";

const { Panel } = Collapse;
const { Option } = Select;

const MarginInput = ({ value, onChange }) => {
  const margins = Array.isArray(value)
    ? value
    : [value || 0, value || 0, value || 0, value || 0];

  const handleChange = (idx, val) => {
    const newMargins = [...margins];
    newMargins[idx] = val;
    onChange(newMargins);
  };

  return (
    <Row gutter={4}>
      <Col span={6}>
        <div style={{ fontSize: 9, textAlign: "center" }}>Left</div>
        <InputNumber
          size="small"
          value={margins[0]}
          onChange={(v) => handleChange(0, v)}
        />
      </Col>
      <Col span={6}>
        <div style={{ fontSize: 9, textAlign: "center" }}>Top</div>
        <InputNumber
          size="small"
          value={margins[1]}
          onChange={(v) => handleChange(1, v)}
        />
      </Col>
      <Col span={6}>
        <div style={{ fontSize: 9, textAlign: "center" }}>Right</div>
        <InputNumber
          size="small"
          value={margins[2]}
          onChange={(v) => handleChange(2, v)}
        />
      </Col>
      <Col span={6}>
        <div style={{ fontSize: 9, textAlign: "center" }}>Bottom</div>
        <InputNumber
          size="small"
          value={margins[3]}
          onChange={(v) => handleChange(3, v)}
        />
      </Col>
    </Row>
  );
};

const PropertiesPanel = () => {
  const { state, dispatch } = useBuilder();
  const { selectedId, docDef } = state;
  const [form] = Form.useForm();
  const [cellForm] = Form.useForm(); // Separate form for cell props

  const [pageSize, setPageSize] = React.useState(
    typeof docDef.pageSize === "object" ? "CUSTOM" : docDef.pageSize
  );

  const selectedElementInfo = selectedId
    ? findNodeInfo(docDef.content, selectedId)
    : null;

  const selectedElement = selectedElementInfo ? selectedElementInfo.node : null;
  const tableContext = selectedElementInfo
    ? selectedElementInfo.tableInfo
    : null;

  const effectiveCellId =
    tableContext?.cellId || (tableContext ? selectedElement._id : null);

  const cellNode = effectiveCellId
    ? findNode(docDef.content, effectiveCellId)
    : null;

  const pxToPoints = React.useCallback((px) => px * 0.75, []);
  const pointsToPx = React.useCallback((pt) => Math.round(pt / 0.75), []);

  useEffect(() => {
    if (selectedElement) {
      form.setFieldsValue({
        text: selectedElement.text ?? null,
        fontSize: selectedElement.fontSize ?? null,
        bold: selectedElement.bold ?? null,
        italics: selectedElement.italics ?? null,
        alignment: selectedElement.alignment ?? null,
        margin: selectedElement.margin ?? null,
        color: selectedElement.color ?? null,
        image: selectedElement.image ?? null,
        width: selectedElement.width ?? null,
        height: selectedElement.height ?? null,
        fit: selectedElement.fit ?? null,
        qr: selectedElement.qr ?? null,
        barcode: selectedElement.barcode ?? null,
        type: selectedElement.type ?? null,
        fillColor: selectedElement.fillColor ?? null,
        name: selectedElement.name ?? null,
        repeatable: selectedElement.repeatable ?? false,
      });
    } else if (!selectedId) {
      const isCustom = typeof docDef.pageSize === "object";
      form.setFieldsValue({
        pageSize: isCustom ? "CUSTOM" : docDef.pageSize,
        customWidth: isCustom ? pointsToPx(docDef.pageSize.width) : 794,
        customHeight: isCustom ? pointsToPx(docDef.pageSize.height) : 1123,
        marginTop: docDef.pageMargins[1],
        marginRight: docDef.pageMargins[2],
        marginBottom: docDef.pageMargins[3],
        marginLeft: docDef.pageMargins[0],
      });
    }
  }, [selectedId, selectedElement, docDef, form, pointsToPx]);

  React.useEffect(() => {
    const newPageSize =
      typeof docDef.pageSize === "object" ? "CUSTOM" : docDef.pageSize;
    setPageSize(newPageSize);
  }, [docDef.pageSize]);

  useEffect(() => {
    if (cellNode) {
      cellForm.resetFields();
      cellForm.setFieldsValue({
        rowSpan: cellNode.rowSpan,
        colSpan: cellNode.colSpan,
        height: cellNode.height,
        fillColor: cellNode.fillColor,
        margin: cellNode.margin,
        alignment: cellNode.alignment,
      });
    }
  }, [effectiveCellId, cellForm]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleValuesChange = (changedValues, allValues) => {
    if (selectedId) {
      dispatch({
        type: "UPDATE_ELEMENT",
        payload: { id: selectedId, updates: changedValues },
      });
    } else {
      const newMargins = [
        allValues.marginLeft,
        allValues.marginTop,
        allValues.marginRight,
        allValues.marginBottom,
      ];

      let pageSizeValue = allValues.pageSize;
      if (allValues.pageSize === "CUSTOM") {
        pageSizeValue = {
          width: pxToPoints(allValues.customWidth || 794),
          height: pxToPoints(allValues.customHeight || 1123),
        };
      }

      dispatch({
        type: "UPDATE_ELEMENT",
        payload: {
          id: "root",
          updates: {
            pageSize: pageSizeValue,
            pageMargins: newMargins,
          },
        },
      });
    }
  };

  const handleCellValuesChange = (changedValues) => {
    if (effectiveCellId) {
      dispatch({
        type: "UPDATE_ELEMENT",
        payload: { id: effectiveCellId, updates: changedValues },
      });
    }
  };

  const handleDelete = () => {
    if (selectedId) {
      dispatch({ type: "DELETE_ELEMENT", payload: selectedId });
    }
  };

  if (!selectedId) {
    const isCustomSize = pageSize === "CUSTOM";

    return (
      <div style={{ padding: 16 }}>
        <h3>Page Configuration</h3>
        <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
          <Form.Item name="pageSize" label="Page Size">
            <Select onChange={(value) => setPageSize(value)}>
              <Option value="A4">A4</Option>
              <Option value="LETTER">Letter</Option>
              <Option value="CUSTOM">Custom</Option>
            </Select>
          </Form.Item>

          {isCustomSize && (
            <>
              <Divider>Custom Size (pixels)</Divider>
              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item name="customWidth" label="Width (px)">
                    <InputNumber min={133} max={2667} step={1} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="customHeight" label="Height (px)">
                    <InputNumber min={133} max={2667} step={1} />
                  </Form.Item>
                </Col>
              </Row>
              <div style={{ fontSize: 11, color: "#999", marginTop: -10 }}>
                Common: A4 = 794×1123px, Letter = 816×1056px
              </div>
            </>
          )}

          <Divider>Margins</Divider>
          <Form.Item name="marginTop" label="Top">
            <InputNumber />
          </Form.Item>
          <Form.Item name="marginRight" label="Right">
            <InputNumber />
          </Form.Item>
          <Form.Item name="marginBottom" label="Bottom">
            <InputNumber />
          </Form.Item>
          <Form.Item name="marginLeft" label="Left">
            <InputNumber />
          </Form.Item>
        </Form>
      </div>
    );
  }

  if (!selectedElement) return <div>Element not found</div>;

  return (
    <div style={{ padding: 16, height: "100%", overflowY: "auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3>Properties</h3>
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={handleDelete}
          size="small"
        />
      </div>

      {/* If inside a table, show Parent Cell Properties SEPARATELY */}
      {cellNode && (
        <div
          style={{
            backgroundColor: "#fafafa",
            padding: 8,
            borderRadius: 4,
            marginBottom: 16,
            border: "1px solid #eee",
            marginTop: 10,
          }}
        >
          <div
            style={{
              marginBottom: 8,
              fontWeight: 500,
              borderBottom: "1px solid #ddd",
            }}
          >
            Parent Cell Properties
          </div>
          <Form
            form={cellForm}
            layout="vertical"
            onValuesChange={handleCellValuesChange}
          >
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item name="rowSpan" label="Row Span">
                  <InputNumber min={0} size="small" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="colSpan" label="Col Span">
                  <InputNumber min={0} size="small" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="height" label="Cell Height (px)">
              <InputNumber
                min={0}
                size="small"
                placeholder="auto"
                style={{ width: "100%" }}
              />
            </Form.Item>
            <Form.Item name="fillColor" label="Fill Color">
              <Input type="color" size="small" style={{ width: "100%" }} />
            </Form.Item>
            
            {/* If the selected element IS the cell, margin/alignment are already in the main form */}
            {selectedId !== effectiveCellId && (
              <>
                <Form.Item name="margin" label="Cell Margin">
                  <MarginInput />
                </Form.Item>
                <Form.Item name="alignment" label="Cell Align">
                  <Select size="small">
                    <Option value="left">Left</Option>
                    <Option value="center">Center</Option>
                    <Option value="right">Right</Option>
                    <Option value="justify">Justify</Option>
                  </Select>
                </Form.Item>
              </>
            )}
          </Form>
        </div>
      )}

      {/* Primary Element Form */}
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
        initialValues={selectedElement}
      >
        <Form.Item label="Type" style={{ marginBottom: 10 }}>
          <Tag color="blue">{selectedElement.type || "Element"}</Tag>
          <span style={{ fontSize: 10, color: "#ccc" }}>
            {selectedElement._id}
          </span>
        </Form.Item>

        <Form.Item 
          name="name" 
          label="Field Name"
          tooltip="Named fields become customizable when generating PDFs"
        >
          <Input placeholder="e.g. customer_name, invoice_number" />
        </Form.Item>

        {selectedElement.table && (
          <div
            style={{
              border: "1px solid #f0f0f0",
              padding: 8,
              marginBottom: 10,
              borderRadius: 4,
            }}
          >
            <h4>Table Actions</h4>
            <Row gutter={8}>
              <Col span={12}>
                <Button
                  block
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() =>
                    dispatch({
                      type: "ADD_TABLE_ROW",
                      payload: { tableId: selectedElement._id },
                    })
                  }
                >
                  Row
                </Button>
              </Col>
              <Col span={12}>
                <Button
                  block
                  size="small"
                  icon={<MinusOutlined />}
                  onClick={() =>
                    dispatch({
                      type: "REMOVE_TABLE_ROW",
                      payload: { tableId: selectedElement._id },
                    })
                  }
                >
                  Row
                </Button>
              </Col>
            </Row>
            <Row gutter={8} style={{ marginTop: 5 }}>
              <Col span={12}>
                <Button
                  block
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() =>
                    dispatch({
                      type: "ADD_TABLE_COLUMN",
                      payload: { tableId: selectedElement._id },
                    })
                  }
                >
                  Col
                </Button>
              </Col>
              <Col span={12}>
                <Button
                  block
                  size="small"
                  icon={<MinusOutlined />}
                  onClick={() =>
                    dispatch({
                      type: "REMOVE_TABLE_COLUMN",
                      payload: { tableId: selectedElement._id },
                    })
                  }
                >
                  Col
                </Button>
              </Col>
            </Row>

            <Divider style={{ margin: "12px 0" }}>Table Width</Divider>
            <Form.Item label="Table Width">
              <Input
                value={selectedElement.table.width || "auto"}
                placeholder="auto, 100%, 500"
                onChange={(e) => {
                  dispatch({
                    type: "UPDATE_ELEMENT",
                    payload: {
                      id: selectedElement._id,
                      updates: {
                        table: {
                          ...selectedElement.table,
                          width: e.target.value,
                        },
                      },
                    },
                  });
                }}
              />
              <div style={{ fontSize: 10, color: "#999", marginTop: 4 }}>
                Examples: auto, 100%, 500 (px), *
              </div>
            </Form.Item>

            <Divider style={{ margin: "12px 0" }}>Column Widths</Divider>
            {selectedElement.table.widths?.map((width, idx) => (
              <Form.Item
                key={idx}
                label={`Column ${idx + 1}`}
                style={{ marginBottom: 8 }}
              >
                <Input
                  size="small"
                  value={width}
                  placeholder="*, auto, 100, 20%"
                  onChange={(e) => {
                    const newWidths = [...selectedElement.table.widths];
                    let value = e.target.value.trim();
                    if (!isNaN(value) && value !== "") {
                      value = Number(value);
                    }
                    newWidths[idx] = value || "*";
                    dispatch({
                      type: "UPDATE_ELEMENT",
                      payload: {
                        id: selectedElement._id,
                        updates: {
                          table: {
                            ...selectedElement.table,
                            widths: newWidths,
                          },
                        },
                      },
                    });
                  }}
                />
              </Form.Item>
            ))}
            <div style={{ fontSize: 10, color: "#999", marginTop: -4 }}>
              * = flexible, auto = fit content, number = px, % = percentage
            </div>

            <Divider style={{ margin: "12px 0" }}>Dynamic Data</Divider>
            
            <Form.Item 
              name="name" 
              label="Table Name"
              tooltip="Unique identifier for this table when generating PDFs"
            >
              <Input placeholder="e.g. invoice_items, products" />
            </Form.Item>
            
            <div style={{ 
              backgroundColor: "#f0f7ff", 
              padding: 12, 
              borderRadius: 6, 
              marginBottom: 10,
              border: "1px solid #d0e4ff"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Form.Item 
                  name="repeatable" 
                  valuePropName="checked" 
                  style={{ marginBottom: 0 }}
                  noStyle
                >
                  <Switch />
                </Form.Item>
                <span style={{ fontWeight: 500 }}>Enable Add Rows</span>
              </div>
              <div style={{ fontSize: 11, color: "#666" }}>
                When ON, users can add/remove data rows in the Generate page.
                Header row stays fixed, only data rows can be added.
              </div>
            </div>
          </div>
        )}

        {tableContext && (
          <div style={{ marginBottom: 10 }}>
            <Button
              block
              danger
              size="small"
              style={{ marginBottom: 5 }}
              onClick={() => {
                dispatch({
                  type: "REMOVE_TABLE_ROW",
                  payload: {
                    tableId: tableContext.tableId,
                    rowIndex: tableContext.rowIndex,
                  },
                });
                dispatch({ type: "SELECT_ELEMENT", payload: null });
              }}
            >
              Delete Row {tableContext.rowIndex + 1}
            </Button>
            <Button
              block
              danger
              size="small"
              onClick={() => {
                dispatch({
                  type: "REMOVE_TABLE_COLUMN",
                  payload: {
                    tableId: tableContext.tableId,
                    colIndex: tableContext.colIndex,
                  },
                });
                dispatch({ type: "SELECT_ELEMENT", payload: null });
              }}
            >
              Delete Col {tableContext.colIndex + 1}
            </Button>
          </div>
        )}

        {selectedElement.text !== undefined && (
          <>
            <Divider>Text Style</Divider>
            <Form.Item name="text" label="Content">
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item name="fontSize" label="Font Size">
              <InputNumber />
            </Form.Item>
            <Form.Item name="margin" label="Margin">
              <MarginInput />
            </Form.Item>
            <Form.Item name="bold" valuePropName="checked" label="Bold">
              <Switch />
            </Form.Item>
            <Form.Item name="italics" valuePropName="checked" label="Italics">
              <Switch />
            </Form.Item>
            <Form.Item name="alignment" label="Alignment">
              <Select>
                <Option value="left">Left</Option>
                <Option value="center">Center</Option>
                <Option value="right">Right</Option>
                <Option value="justify">Justify</Option>
              </Select>
            </Form.Item>
          </>
        )}

        {selectedElement.stack && (
          <div
            style={{
              border: "1px solid #f0f0f0",
              padding: 8,
              marginBottom: 10,
              borderRadius: 4,
            }}
          >
            <h4>Stack Management</h4>
            <div style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>
              Items: {selectedElement.stack.length}
            </div>
            <div
              style={{
                fontSize: 10,
                color: "#999",
                fontStyle: "italic",
                marginBottom: 10,
                padding: 8,
                backgroundColor: "#f9f9f9",
                borderRadius: 4,
              }}
            >
              💡 To add items: Select this stack, then click any element from
              the toolbox (Text, Columns, Table, Barcode, etc.)
            </div>

            <Divider style={{ margin: "12px 0" }}>Stack Items</Divider>
            {selectedElement.stack.length === 0 ? (
              <div
                style={{
                  fontSize: 11,
                  color: "#999",
                  fontStyle: "italic",
                  textAlign: "center",
                  padding: 10,
                }}
              >
                No items in stack. Select this stack and click elements from the
                toolbox to add.
              </div>
            ) : (
              <div style={{ maxHeight: 300, overflowY: "auto" }}>
                {selectedElement.stack.map((item, idx) => (
                  <div
                    key={item._id || idx}
                    style={{
                      border: "1px solid #e8e8e8",
                      padding: 6,
                      marginBottom: 6,
                      borderRadius: 4,
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <Row gutter={4} align="middle">
                      <Col flex="auto">
                        <div style={{ fontSize: 11, fontWeight: 500 }}>
                          {idx + 1}. {item.type || "element"}
                        </div>
                        <div
                          style={{ fontSize: 10, color: "#999", marginTop: 2 }}
                        >
                          {item.text
                            ? item.text.length > 30
                              ? item.text.substring(0, 30) + "..."
                              : item.text
                            : item.image
                            ? "Image"
                            : item.table
                            ? "Table"
                            : item.qr
                            ? "QR Code"
                            : item.barcode
                            ? "Barcode"
                            : item.stack
                            ? `Stack (${item.stack.length} items)`
                            : item.columns
                            ? `Columns (${item.columns.length} cols)`
                            : "Element"}
                        </div>
                      </Col>
                      <Col>
                        <Space.Compact size="small">
                          <Button
                            size="small"
                            disabled={idx === 0}
                            onClick={() =>
                              dispatch({
                                type: "REORDER_STACK_ITEM",
                                payload: {
                                  stackId: selectedElement._id,
                                  itemIndex: idx,
                                  direction: "up",
                                },
                              })
                            }
                            title="Move up"
                          >
                            ↑
                          </Button>
                          <Button
                            size="small"
                            disabled={idx === selectedElement.stack.length - 1}
                            onClick={() =>
                              dispatch({
                                type: "REORDER_STACK_ITEM",
                                payload: {
                                  stackId: selectedElement._id,
                                  itemIndex: idx,
                                  direction: "down",
                                },
                              })
                            }
                            title="Move down"
                          >
                            ↓
                          </Button>
                          <Button
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() =>
                              dispatch({
                                type: "REMOVE_STACK_ITEM",
                                payload: {
                                  stackId: selectedElement._id,
                                  itemIndex: idx,
                                },
                              })
                            }
                            title="Delete item"
                          />
                        </Space.Compact>
                      </Col>
                    </Row>
                  </div>
                ))}
              </div>
            )}

            <Divider style={{ margin: "12px 0" }}>Stack Properties</Divider>
            <Form.Item name="margin" label="Margin">
              <MarginInput />
            </Form.Item>
            <Form.Item
              name="unbreakable"
              valuePropName="checked"
              label="Unbreakable"
            >
              <Switch />
            </Form.Item>
            <div style={{ fontSize: 10, color: "#999", marginTop: -10 }}>
              Keep all items on the same page in PDF
            </div>
          </div>
        )}

        {selectedElement.image !== undefined && (
          <>
            <Form.Item name="image" label="Image URL / Base64">
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item name="width" label="Width">
              <InputNumber />
            </Form.Item>
            <Form.Item name="height" label="Height">
              <InputNumber />
            </Form.Item>
            <Form.Item name="margin" label="Margin">
              <MarginInput />
            </Form.Item>
            <Form.Item name="alignment" label="Alignment">
              <Select>
                <Option value="left">Left</Option>
                <Option value="center">Center</Option>
                <Option value="right">Right</Option>
              </Select>
            </Form.Item>
          </>
        )}

        {selectedElement.columns && (
          <div
            style={{
              border: "1px solid #f0f0f0",
              padding: 8,
              marginBottom: 10,
              borderRadius: 4,
            }}
          >
            <h4>Columns Actions</h4>
            <Row gutter={8} style={{ marginBottom: 10 }}>
              <Col span={12}>
                <Button
                  block
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() =>
                    dispatch({
                      type: "ADD_COLUMN",
                      payload: { columnsId: selectedElement._id },
                    })
                  }
                >
                  Add Column
                </Button>
              </Col>
              <Col span={12}>
                <Button
                  block
                  size="small"
                  icon={<MinusOutlined />}
                  onClick={() =>
                    dispatch({
                      type: "REMOVE_COLUMN",
                      payload: { columnsId: selectedElement._id },
                    })
                  }
                >
                  Remove Column
                </Button>
              </Col>
            </Row>

            <Divider style={{ margin: "12px 0" }}>Column Gap</Divider>
            <Form.Item name="columnGap" label="Gap between columns">
              <InputNumber min={0} placeholder="10" />
            </Form.Item>

            <Divider style={{ margin: "12px 0" }}>Column Widths</Divider>
            {selectedElement.columns?.map((col, idx) => (
              <Form.Item
                key={idx}
                label={`Column ${idx + 1}`}
                style={{ marginBottom: 8 }}
              >
                <Space.Compact style={{ width: "100%" }}>
                  <Input
                    size="small"
                    value={col.width || "*"}
                    placeholder="*, auto, 100, 20%"
                    onChange={(e) => {
                      const newColumns = [...selectedElement.columns];
                      let value = e.target.value.trim();
                      if (!isNaN(value) && value !== "") {
                        value = Number(value);
                      }
                      newColumns[idx] = {
                        ...newColumns[idx],
                        width: value || "*",
                      };
                      dispatch({
                        type: "UPDATE_ELEMENT",
                        payload: {
                          id: selectedElement._id,
                          updates: {
                            columns: newColumns,
                          },
                        },
                      });
                    }}
                  />
                  <Button
                    danger
                    size="small"
                    icon={<MinusOutlined />}
                    onClick={() => {
                      dispatch({
                        type: "REMOVE_COLUMN",
                        payload: {
                          columnsId: selectedElement._id,
                          columnIndex: idx,
                        },
                      });
                    }}
                  />
                </Space.Compact>
              </Form.Item>
            ))}
            <div style={{ fontSize: 10, color: "#999", marginTop: -4 }}>
              * = flexible, auto = fit content, number = px, % = percentage
            </div>
          </div>
        )}

        {selectedElement.qr && (
          <>
            <Form.Item name="qr" label="QR Content">
              <Input />
            </Form.Item>
            <Form.Item name="fit" label="Size (Fit)">
              <InputNumber />
            </Form.Item>
            <Form.Item name="margin" label="Margin">
              <MarginInput />
            </Form.Item>
            <Form.Item name="alignment" label="Alignment">
              <Select>
                <Option value="left">Left</Option>
                <Option value="center">Center</Option>
                <Option value="right">Right</Option>
              </Select>
            </Form.Item>
          </>
        )}

        {selectedElement.barcode && (
          <>
            <Divider>Barcode</Divider>
            <Form.Item name="barcode" label="Barcode Content">
              <Input placeholder="Enter barcode value" />
            </Form.Item>
            <Form.Item name="type" label="Barcode Type">
              <Select>
                <Option value="CODE128">CODE128</Option>
                <Option value="CODE39">CODE39</Option>
                <Option value="EAN13">EAN13</Option>
                <Option value="EAN8">EAN8</Option>
                <Option value="UPC">UPC</Option>
              </Select>
            </Form.Item>
            <Form.Item name="fit" label="Fit Width">
              <InputNumber />
            </Form.Item>
            <Form.Item name="margin" label="Margin">
              <MarginInput />
            </Form.Item>
            <Form.Item name="alignment" label="Alignment">
              <Select>
                <Option value="left">Left</Option>
                <Option value="center">Center</Option>
                <Option value="right">Right</Option>
              </Select>
            </Form.Item>
          </>
        )}

        {(selectedElement.ul || selectedElement.ol) && (
          <>
            <Divider>
              {selectedElement.ul ? "Unordered" : "Ordered"} List
            </Divider>
            <Form.Item label="List Items">
              <div>
                {(selectedElement.ul || selectedElement.ol).map((item, idx) => (
                  <div
                    key={idx}
                    style={{ display: "flex", marginBottom: 8, gap: 4 }}
                  >
                    <Input
                      value={item}
                      onChange={(e) => {
                        const listKey = selectedElement.ul ? "ul" : "ol";
                        const newList = [...selectedElement[listKey]];
                        newList[idx] = e.target.value;
                        dispatch({
                          type: "UPDATE_ELEMENT",
                          payload: {
                            id: selectedId,
                            updates: { [listKey]: newList },
                          },
                        });
                      }}
                    />
                    <Button
                      danger
                      size="small"
                      icon={<MinusOutlined />}
                      onClick={() => {
                        const listKey = selectedElement.ul ? "ul" : "ol";
                        const newList = [...selectedElement[listKey]];
                        newList.splice(idx, 1);
                        dispatch({
                          type: "UPDATE_ELEMENT",
                          payload: {
                            id: selectedId,
                            updates: { [listKey]: newList },
                          },
                        });
                      }}
                    />
                  </div>
                ))}
                <Button
                  block
                  icon={<PlusOutlined />}
                  onClick={() => {
                    const listKey = selectedElement.ul ? "ul" : "ol";
                    const newList = [...selectedElement[listKey], "New item"];
                    dispatch({
                      type: "UPDATE_ELEMENT",
                      payload: {
                        id: selectedId,
                        updates: { [listKey]: newList },
                      },
                    });
                  }}
                >
                  Add Item
                </Button>
              </div>
            </Form.Item>
            <Form.Item name="margin" label="Margin">
              <MarginInput />
            </Form.Item>
          </>
        )}
      </Form>
    </div>
  );
};

export default PropertiesPanel;
