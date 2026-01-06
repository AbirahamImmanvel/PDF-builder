import React from "react";
import { useBuilder } from "../../context/BuilderContext";
import { Card, Tag } from "antd";

const getMarginStyle = (margin) => {
  if (!margin) return undefined;
  if (typeof margin === "number") return `${margin}px`;
  if (Array.isArray(margin)) {
    return `${margin[1]}px ${margin[2]}px ${margin[3]}px ${margin[0]}px`;
  }
  return undefined;
};

const renderTextContent = (content) => {
  if (typeof content === "string" || typeof content === "number") {
    return content;
  }
  if (Array.isArray(content)) {
    return content.map((item, idx) => (
      <React.Fragment key={idx}>{renderTextContent(item)}</React.Fragment>
    ));
  }
  if (typeof content === "object" && content !== null) {
    if (content.text !== undefined) {
      return (
        <span
          style={{
            color: content.color,
            fontSize: content.fontSize,
            fontWeight: content.bold ? "bold" : "normal",
            fontStyle: content.italics ? "italic" : "normal",
            textDecoration: content.decoration,
            backgroundColor: content.background,
          }}
        >
          {renderTextContent(content.text)}
        </span>
      );
    }
    return null;
  }
  return null;
};

const ElementRenderer = ({ element }) => {
  const { state, dispatch } = useBuilder();
  if (!element) return null;
  const isSelected = state.selectedId === element._id;

  const handleSelect = (e) => {
    e.stopPropagation();
    dispatch({ type: "SELECT_ELEMENT", payload: element._id });
  };

  const wrapperStyle = {
    border: isSelected ? "2px solid #1890ff" : "1px dashed #d9d9d9",
    padding: "8px",
    margin: getMarginStyle(element.margin) || "4px",
    cursor: "pointer",
    backgroundColor: isSelected ? "#e6f7ff" : "#fff",
    minHeight: element.height ? `${element.height}px` : "30px",
    width: element.width ? `${element.width}px` : undefined,
    maxWidth: element.width ? `${element.width}px` : undefined,
    position: "relative",
    boxSizing: "border-box",
    overflow: "hidden",
  };

  const labelStyle = {
    fontSize: "10px",
    color: "#999",
    position: "absolute",
    right: 2,
    top: 2,
    pointerEvents: "none",
  };

  const renderContent = () => {
    if (element.text !== undefined) {
      return (
        <div
          style={{
            fontSize: element.fontSize || 12,
            fontWeight: element.bold ? "bold" : "normal",
            fontStyle: element.italics ? "italic" : "normal",
            textAlign: element.alignment || "left",
            color: element.color || "#000",
          }}
        >
          {renderTextContent(element.text)}
        </div>
      );
    }

    if (element.columns) {
      return (
        <div
          style={{
            display: "flex",
            gap: element.columnGap || 10,
            overflowX: "auto",
          }}
        >
          {element.columns.map((col, idx) => {
            const isColumnSelected = state.selectedId === col._id;
            return (
              <div
                key={col._id || idx}
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: "SELECT_ELEMENT", payload: col._id });
                }}
                style={{
                  flex: col.width === "*" ? 1 : "none",
                  width:
                    col.width === "*" || col.width === "auto"
                      ? "auto"
                      : typeof col.width === "number"
                      ? `${col.width}px`
                      : col.width,
                  minWidth: "50px",
                  border: isColumnSelected
                    ? "2px solid #52c41a"
                    : "1px dotted #ccc",
                  backgroundColor: isColumnSelected ? "#f6ffed" : "transparent",
                  padding: 4,
                  minHeight: "40px",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                {isColumnSelected && (
                  <span
                    style={{
                      fontSize: "9px",
                      color: "#52c41a",
                      position: "absolute",
                      right: 2,
                      top: 2,
                      pointerEvents: "none",
                    }}
                  >
                    Col {idx + 1}
                  </span>
                )}
                {/* Render column content - can be text, stack, or other element */}
                {col.text !== undefined ? (
                  <ElementRenderer element={col} />
                ) : col.stack ? (
                  col.stack.length === 0 ? (
                    <div
                      style={{
                        color: "#ccc",
                        fontSize: "10px",
                        fontStyle: "italic",
                      }}
                    >
                      Empty column - add elements
                    </div>
                  ) : (
                    <ElementRenderer element={col} />
                  )
                ) : col.columns ||
                  col.table ||
                  col.image ||
                  col.qr ||
                  col.barcode ? (
                  <ElementRenderer element={col} />
                ) : (
                  <div
                    style={{
                      color: "#ccc",
                      fontSize: "10px",
                      fontStyle: "italic",
                    }}
                  >
                    Empty column - add elements
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    if (element.stack) {
      return (
        <div>
          {element.stack.length === 0 ? (
            <div
              style={{ color: "#ccc", fontSize: "10px", fontStyle: "italic" }}
            >
              Empty stack - add elements
            </div>
          ) : (
            element.stack.map((item, idx) => (
              <div
                key={item._id || idx}
                style={{
                  marginBottom: 4,
                  paddingBottom: 4,
                  borderBottom:
                    idx < element.stack.length - 1 ? "1px dashed #eee" : "none",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    fontSize: "8px",
                    color: "#bbb",
                    position: "absolute",
                    left: -15,
                    top: 0,
                  }}
                >
                  {idx + 1}
                </span>
                <ElementRenderer element={item} />
              </div>
            ))
          )}
        </div>
      );
    }

    if (element.table) {
      const { body } = element.table;

      const coveredCells = new Set();

      return (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #ddd",
          }}
        >
          <tbody>
            {body.map((row, rIdx) => (
              <tr key={rIdx}>
                {row.map((cell, cIdx) => {
                  if (!cell) {
                    return <td key={cIdx} />;
                  }

                  const cellKey = `${rIdx}-${cIdx}`;

                  if (coveredCells.has(cellKey)) {
                    return null;
                  }

                  const colSpan = cell.colSpan || 1;
                  const rowSpan = cell.rowSpan || 1;

                  for (let r = 0; r < rowSpan; r++) {
                    for (let c = 0; c < colSpan; c++) {
                      if (r !== 0 || c !== 0) {
                        coveredCells.add(`${rIdx + r}-${cIdx + c}`);
                      }
                    }
                  }

                  return (
                    <td
                      key={cIdx}
                      colSpan={colSpan}
                      rowSpan={rowSpan}
                      style={{ border: "1px solid #ddd", padding: 4 }}
                    >
                      <ElementRenderer element={cell} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (element.image) {
      return (
        <img
          src={element.image}
          alt="img"
          style={{
            width: element.width ? `${element.width}px` : undefined,
            height: element.height ? `${element.height}px` : undefined,
            maxWidth: element.width ? `${element.width}px` : "100%",
            maxHeight: element.height ? `${element.height}px` : 100,
          }}
        />
      );
    }

    if (element.qr) {
      return <div>QR: {element.qr}</div>;
    }

    if (element.barcode) {
      return (
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "11px",
            display: "block",
            position: "relative",
          }}
        >
          Barcode: {element.barcode} ({element.type || "CODE128"})
        </div>
      );
    }

    if (element.ul) {
      return (
        <ul style={{ margin: "4px 0", paddingLeft: "20px" }}>
          {element.ul.map((item, idx) => (
            <li key={idx}>
              {typeof item === "object" ? (
                <ElementRenderer element={item} />
              ) : (
                item
              )}
            </li>
          ))}
        </ul>
      );
    }

    if (element.ol) {
      return (
        <ol style={{ margin: "4px 0", paddingLeft: "20px" }}>
          {element.ol.map((item, idx) => (
            <li key={idx}>
              {typeof item === "object" ? (
                <ElementRenderer element={item} />
              ) : (
                item
              )}
            </li>
          ))}
        </ol>
      );
    }

    return <div>Unknown Element</div>;
  };

  return (
    <div style={wrapperStyle} onClick={handleSelect}>
      <span style={labelStyle}>{element.type || "Element"}</span>
      {renderContent()}
    </div>
  );
};

export default ElementRenderer;
