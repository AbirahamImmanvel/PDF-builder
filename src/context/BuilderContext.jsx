import React, { createContext, useContext, useReducer } from "react";
import { v4 as uuidv4 } from "uuid";
import { produce } from "immer";

const BuilderContext = createContext();

const initialState = {
  docDef: {
    pageSize: "A4",
    pageOrientation: "portrait",
    pageMargins: [40, 60, 40, 60],
    content: [],
    styles: {},
  },
  selectedId: null,
};

const ensureIds = (node) => {
  if (!node) return;
  if (typeof node === "object") {
    if (!node._id) node._id = uuidv4();
    if (node.columns) node.columns.forEach(ensureIds);
    if (node.stack) node.stack.forEach(ensureIds);
    if (node.table && node.table.body) {
      node.table.body.forEach((row) => row.forEach((cell) => ensureIds(cell)));
    }
  }
  return node;
};

const updateNode = (nodes, id, updateFn) => {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i]._id === id) {
      updateFn(nodes[i]);
      return true;
    }
    if (nodes[i].columns) {
      if (updateNode(nodes[i].columns, id, updateFn)) return true;
    }
    if (nodes[i].stack) {
      if (updateNode(nodes[i].stack, id, updateFn)) return true;
    }
    if (nodes[i].table && nodes[i].table.body) {
      for (let row of nodes[i].table.body) {
        for (let cell of row) {
          if (cell._id === id) {
            updateFn(cell);
            return true;
          }
          if (cell.stack) if (updateNode(cell.stack, id, updateFn)) return true;
          if (cell.columns)
            if (updateNode(cell.columns, id, updateFn)) return true;
        }
      }
    }
  }
  return false;
};

const deleteNode = (nodes, id) => {
  const index = nodes.findIndex((n) => n && n._id === id);
  if (index !== -1) {
    nodes.splice(index, 1);
    return true;
  }

  for (const node of nodes) {
    if (!node) continue;
    if (node.columns) {
      if (deleteNode(node.columns, id)) return true;
    }
    if (node.stack) {
      if (deleteNode(node.stack, id)) return true;
    }
    if (node.table && node.table.body) {
      for (let row of node.table.body) {
        for (let cell of row) {
          if (cell.stack) {
            if (deleteNode(cell.stack, id)) return true;
          }
          if (cell.columns) {
            if (deleteNode(cell.columns, id)) return true;
          }
        }
      }
    }
  }
  return false;
};



const builderReducer = (state, action) => {
  return produce(state, (draft) => {
    switch (action.type) {
      case "ADD_ELEMENT": {
        const { parentId, element } = action.payload;
        const newElement = JSON.parse(JSON.stringify(element));
        ensureIds(newElement);

        if (!parentId) {
          draft.docDef.content.push(newElement);
        } else {

          const pushToNode = (nodes, pid, el) => {
            for (let node of nodes) {
              if (node._id === pid) {
                if (node.stack) {
                  node.stack.push(el);
                } else if (node.columns) {
                  console.warn(
                    "Cannot add directly to columns element. Please select an individual column first."
                  );
                }
                return true;
              }
              if (node.columns)
                if (pushToNode(node.columns, pid, el)) return true;
              if (node.stack) if (pushToNode(node.stack, pid, el)) return true;
              if (node.table && node.table.body) {
                for (let row of node.table.body) {
                  for (let cell of row) {
                    if (cell._id === pid) {
                      if (!cell.stack && !cell.columns) {
                        const oldContent = { ...cell };
                        Object.keys(cell).forEach((k) => delete cell[k]);
                        cell._id = oldContent._id;
                        cell.stack = [oldContent, el]; // Put old content + new
                      } else if (cell.stack) {
                        cell.stack.push(el);
                      }
                      return true;
                    }
                    if (cell.stack)
                      if (pushToNode(cell.stack, pid, el)) return true;
                    if (cell.columns)
                      if (pushToNode(cell.columns, pid, el)) return true;
                  }
                }
              }
            }
            return false;
          };

          pushToNode(draft.docDef.content, parentId, newElement);
        }
        draft.selectedId = newElement._id;
        break;
      }

      case "UPDATE_ELEMENT": {
        const { id, updates } = action.payload;
        if (id === "root") {
          Object.assign(draft.docDef, updates);
        } else {
          updateNode(draft.docDef.content, id, (node) => {
            Object.assign(node, updates);
          });
        }
        break;
      }

      case "SELECT_ELEMENT": {
        draft.selectedId = action.payload;
        break;
      }

      case "DELETE_ELEMENT": {
        deleteNode(draft.docDef.content, action.payload);
        if (state.selectedId === action.payload) draft.selectedId = null;
        break;
      }

      case "ADD_TABLE_ROW": {
        const { tableId } = action.payload;
        updateNode(draft.docDef.content, tableId, (node) => {
          if (node.table && node.table.body) {
            const colCount = node.table.body[0]?.length || 1;
            const newRow = Array(colCount)
              .fill()
              .map(() => ({
                _id: uuidv4(),
                type: "text",
                text: "-",
              }));
            node.table.body.push(newRow);
          }
        });
        break;
      }

      case "ADD_TABLE_COLUMN": {
        const { tableId } = action.payload;
        updateNode(draft.docDef.content, tableId, (node) => {
          if (node.table && node.table.body) {
            if (!node.table.widths) node.table.widths = ["*"];
            if (Array.isArray(node.table.widths)) node.table.widths.push("*");

            node.table.body.forEach((row) => {
              row.push({
                _id: uuidv4(),
                type: "text",
                text: "-",
              });
            });
          }
        });
        break;
      }

      case "REMOVE_TABLE_ROW": {
        const { tableId, rowIndex } = action.payload;
        updateNode(draft.docDef.content, tableId, (node) => {
          if (node.table && node.table.body && node.table.body.length > 1) {
            if (rowIndex !== undefined && rowIndex >= 0) {
              node.table.body.splice(rowIndex, 1);
            } else {
              node.table.body.pop();
            }
          }
        });
        break;
      }

      case "REMOVE_TABLE_COLUMN": {
        const { tableId, colIndex } = action.payload;
        updateNode(draft.docDef.content, tableId, (node) => {
          if (node.table && node.table.body && node.table.body[0].length > 1) {
            if (Array.isArray(node.table.widths)) {
              if (colIndex !== undefined && colIndex >= 0)
                node.table.widths.splice(colIndex, 1);
              else node.table.widths.pop();
            }

            node.table.body.forEach((row) => {
              if (colIndex !== undefined && colIndex >= 0)
                row.splice(colIndex, 1);
              else row.pop();
            });
          }
        });
        break;
      }

      case "ADD_COLUMN": {
        const { columnsId } = action.payload;
        updateNode(draft.docDef.content, columnsId, (node) => {
          if (node.columns) {
            const newColumn = {
              _id: uuidv4(),
              stack: [],
              width: "*",
            };
            ensureIds(newColumn);
            node.columns.push(newColumn);
          }
        });
        break;
      }

      case "REMOVE_COLUMN": {
        const { columnsId, columnIndex } = action.payload;
        updateNode(draft.docDef.content, columnsId, (node) => {
          if (node.columns && node.columns.length > 1) {
            if (columnIndex !== undefined && columnIndex >= 0) {
              node.columns.splice(columnIndex, 1);
            } else {
              node.columns.pop();
            }
          }
        });
        break;
      }

      case "ADD_STACK_ITEM": {
        const { stackId, item } = action.payload;
        updateNode(draft.docDef.content, stackId, (node) => {
          if (node.stack) {
            const newItem = item || {
              _id: uuidv4(),
              type: "text",
              text: "New item",
              fontSize: 12,
            };
            ensureIds(newItem);
            node.stack.push(newItem);
          }
        });
        break;
      }

      case "REMOVE_STACK_ITEM": {
        const { stackId, itemIndex } = action.payload;
        updateNode(draft.docDef.content, stackId, (node) => {
          if (node.stack && node.stack.length > 0) {
            if (
              itemIndex !== undefined &&
              itemIndex >= 0 &&
              itemIndex < node.stack.length
            ) {
              node.stack.splice(itemIndex, 1);
            }
          }
        });
        break;
      }

      case "REORDER_STACK_ITEM": {
        const { stackId, itemIndex, direction } = action.payload;
        updateNode(draft.docDef.content, stackId, (node) => {
          if (node.stack && itemIndex >= 0 && itemIndex < node.stack.length) {
            const newIndex = direction === "up" ? itemIndex - 1 : itemIndex + 1;
            if (newIndex >= 0 && newIndex < node.stack.length) {
              const item = node.stack.splice(itemIndex, 1)[0];
              node.stack.splice(newIndex, 0, item);
            }
          }
        });
        break;
      }

      case "SET_STATE":
        return action.payload;

      default:
        break;
    }
  });
};

export const BuilderProvider = ({ children }) => {
  const [state, dispatch] = useReducer(builderReducer, initialState);

  return (
    <BuilderContext.Provider value={{ state, dispatch }}>
      {children}
    </BuilderContext.Provider>
  );
};

export const useBuilder = () => useContext(BuilderContext);
