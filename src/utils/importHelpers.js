import { v4 as uuidv4 } from "uuid";

// Helper to determine the type of a node
const inferType = (node) => {
  if (typeof node === "string") return "text";
  if (node.text !== undefined) return "text";
  if (node.columns !== undefined) return "columns";
  if (node.stack !== undefined) return "stack";
  if (node.table !== undefined) return "table";
  if (node.image !== undefined) return "image";
  if (node.qr !== undefined) return "qr";
  if (node.ul !== undefined) return "ul"; // Unordered list - treat as list
  if (node.ol !== undefined) return "ol"; // Ordered list - treat as list
  if (node.canvas !== undefined) return "canvas"; // Not fully supported but keep type
  if (node.svg !== undefined) return "svg";
  return "unknown"; // default
};

// Main function to augment the node tree
export const augmentNode = (node) => {
  if (node === undefined || node === null) return null;

  // Handle string nodes (e.g. in stacks or text arrays)
  if (typeof node === "string") {
    return {
      _id: uuidv4(),
      type: "text",
      text: node,
      name: "Text",
    };
  }

  // Handle array nodes (rarely technically a node itself unless it's the root content array,
  // but usually we process objects. If we get an array, map it.)
  if (Array.isArray(node)) {
    return node.map(augmentNode).filter((n) => n !== null);
  }

  // It's an object
  const newNode = { ...node };
  if (!newNode._id) newNode._id = uuidv4();
  if (!newNode.type) newNode.type = inferType(newNode);
  if (!newNode.name)
    newNode.name = newNode.type.charAt(0).toUpperCase() + newNode.type.slice(1);

  // Recursively process children
  if (newNode.columns) {
    // Columns is an array of nodes
    newNode.columns = newNode.columns.map(augmentNode);
  }

  if (newNode.stack) {
    // Stack is an array of nodes
    newNode.stack = newNode.stack.map(augmentNode);
  }

  if (newNode.table && newNode.table.body) {
    // Table body is array of rows (arrays) of cells (nodes)
    newNode.table.body = newNode.table.body.map((row) => {
      // row is likely an array
      if (Array.isArray(row)) {
        return row.map(augmentNode).filter((c) => c !== null);
      }
      return row; // Should be array
    });
  }

  // Future support for lists if we expand builder capabilities
  if (newNode.ul) {
    const listItems = Array.isArray(newNode.ul) ? newNode.ul : [];
    newNode.ul = listItems.map((item) => {
      if (typeof item === "string") return item;
      return augmentNode(item);
    });
  }
  if (newNode.ol) {
    const listItems = Array.isArray(newNode.ol) ? newNode.ol : [];
    newNode.ol = listItems.map((item) => {
      if (typeof item === "string") return item;
      return augmentNode(item);
    });
  }

  return newNode;
};

export const augmentDocDef = (jsonObj) => {
  if (!jsonObj) return null;

  const newDoc = { ...jsonObj };

  // Augment content
  if (newDoc.content) {
    if (Array.isArray(newDoc.content)) {
      newDoc.content = newDoc.content.map(augmentNode);
    } else {
      // Content could be a single object
      newDoc.content = [augmentNode(newDoc.content)];
    }
  } else {
    newDoc.content = [];
  }

  // Ensure defaults if missing
  if (!newDoc.pageSize) newDoc.pageSize = "A4";
  if (!newDoc.pageMargins) newDoc.pageMargins = [40, 60, 40, 60];
  if (!newDoc.styles) newDoc.styles = {};

  return newDoc;
};
