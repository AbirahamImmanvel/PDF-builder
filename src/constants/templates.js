export const elementTemplates = [
  {
    type: "text",
    label: "Text",
    icon: "FontSizeOutlined",
    defaultContent: {
      text: "New Text",
      fontSize: 12,
      margin: [0, 0, 0, 5],
    },
  },
  {
    type: "columns",
    label: "Columns",
    icon: "ColumnWidthOutlined",
    defaultContent: {
      columns: [
        { stack: [], width: "*" },
        { stack: [], width: "*" },
      ],
      columnGap: 10,
    },
  },
  {
    type: "stack",
    label: "Stack",
    icon: "BarsOutlined",
    defaultContent: {
      stack: [],
      margin: [0, 5, 0, 5],
    },
  },
  {
    type: "table",
    label: "Table",
    icon: "TableOutlined",
    defaultContent: {
      table: {
        headerRows: 1,
        widths: ["*", "*"],
        body: [
          [
            { text: "Header 1", style: "tableHeader" },
            { text: "Header 2", style: "tableHeader" },
          ],
          [{ text: "Value 1" }, { text: "Value 2" }],
        ],
      },
    },
  },
  {
    type: "image",
    label: "Image",
    icon: "FileImageOutlined",
    defaultContent: {
      // Valid 100x100 transparent PNG placeholder for pdfmake
      image:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5QsKDgQaP8vZzgAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAASSURBVHja7cExAQAAAMKg9U9tCy+gAAAAAOBnADMAAAGn62W0AAAAAElFTkSuQmCC",
      width: 150,
    },
  },
  {
    type: "qr",
    label: "QR Code",
    icon: "QrcodeOutlined",
    defaultContent: {
      qr: "text",
      fit: 100,
    },
  },
  {
    type: "ul",
    label: "Unordered List",
    icon: "BarsOutlined",
    defaultContent: {
      ul: ["Item 1", "Item 2", "Item 3"],
      margin: [0, 5, 0, 5],
    },
  },
  {
    type: "ol",
    label: "Ordered List",
    icon: "BarsOutlined",
    defaultContent: {
      ol: ["First item", "Second item", "Third item"],
      margin: [0, 5, 0, 5],
    },
  },
  {
    type: "barcode",
    label: "Barcode",
    icon: "QrcodeOutlined",
    defaultContent: {
      barcode: "123456789",
      type: "CODE128",
      fit: 200,
    },
  },
];
