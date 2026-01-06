export const findNode = (nodes, id) => {
  for (const node of nodes) {
    if (!node) continue;
    if (node._id === id) return node;
    let found = null;
    if (node.columns) found = findNode(node.columns, id);
    if (!found && node.stack) found = findNode(node.stack, id);
    if (!found && node.table && node.table.body) {
      for (let row of node.table.body) {
        for (let cell of row) {
          if (cell._id === id) return cell;
          // Recurse
          if (cell.stack) {
            const f = findNode(cell.stack, id);
            if (f) return f;
          }
          if (cell.columns) {
            const f = findNode(cell.columns, id);
            if (f) return f;
          }
          if (cell._id === id) return cell;
          // Fallback recursion for arbitrary nesting if we change data structure
          // But standard pdfmake is stack/columns inside cells.
          // If we converted a cell to a stack, it's covered above.
        }
      }
    }
    if (found) return found;
  }
  return null;
};

// Returns { node, parent, path: [], tableInfo: { tableId, rowIndex, colIndex } }
export const findNodeInfo = (nodes, id, parent = null, tableInfo = null) => {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!node) continue;

    if (node._id === id) {
      return { node, parent, tableInfo };
    }

    let result = null;

    if (node.columns) {
      result = findNodeInfo(node.columns, id, node, tableInfo);
    }
    if (!result && node.stack) {
      result = findNodeInfo(node.stack, id, node, tableInfo);
    }

    if (!result && node.table && node.table.body) {
      for (let r = 0; r < node.table.body.length; r++) {
        const row = node.table.body[r];
        for (let c = 0; c < row.length; c++) {
          const cell = row[c];
          // Cell checks
          if (cell._id === id) {
            return {
              node: cell,
              parent: node, // The table is the parent logic-wise? Or the row?
              // Rows are Arrays, not objects with IDs. So Parent is Table.
              tableInfo: { tableId: node._id, rowIndex: r, colIndex: c },
            };
          }

          // Recurse into cell
          // New context for children: they are inside this table/cell
          // But strictly speaking, the 'tableInfo' is for the CELL itself to perform row ops.
          // Children of the cell don't define the row/col of the parent table directly on themselves?
          // Actually logic: If I select an image inside a cell, I probably want to know I'm in a table.
          // So pass down tableInfo?
          // Depends on if we want "Delete Row" button to appear when selecting a child image.
          // Probably yes.
          const cellTableInfo = {
            tableId: node._id,
            rowIndex: r,
            colIndex: c,
            cellId: cell._id,
          };

          if (cell.stack) {
            result = findNodeInfo(cell.stack, id, cell, cellTableInfo);
          }
          if (!result && cell.columns) {
            result = findNodeInfo(cell.columns, id, cell, cellTableInfo);
          }
          if (result) return result;
        }
      }
    }

    if (result) return result;
  }
  return null;
};
