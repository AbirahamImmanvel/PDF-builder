# PDF Builder

A powerful, visual PDF document generator built with **React 19**, **Vite**, and **Ant Design**. This application allows users to visually construct complex PDF layouts and generate them in real-time using `pdfmake`.

![Project Preview](https://via.placeholder.com/800x450.png?text=PDF+Builder+Preview)
_(Replace this link with an actual screenshot of your application)_

## 🚀 Features

### 🎨 Visual Editor

- **Drag-and-Drop / Click-to-Add**: Easily insert elements from a comprehensive toolbox.
- **Real-Time Preview**: See your PDF render instantly as you edit.
- **3-Column Layout**: Intuitive workspaces for properties, editing, and previewing.
- **Manual Zoom & Pan**: Precise controls for zooming in/out and navigating large pages.

### 🧩 Supported Elements

- **Typography**: Rich text editing with bold, italics, font sizes, and alignments.
- **Tables**: Complex table structures with row/col spans, rigid widths, and styling.
- **Layouts**: Columns and Stacks for sophisticated document flow.
- **Media**:
  - **Images**: Support for HTTP URLs and Base64.
  - **SVGs**: Built-in support for vector graphics.
  - **Barcodes & QR**: Generate industry-standard barcodes (Code128, UPC, etc.) and QR codes instantly.

### 🛠 Advanced Capabilities

- **Custom Page Config**: Set custom page sizes (A4, Letter, User-defined) and margins.
- **JSON Import/Export**: Save your document templates as JSON and reload them later.
- **Robust Image Handling**: Automatic fallback and error handling for broken or blocked images.

## 📦 Tech Stack

- **Frontend**: React 19, Vite 6
- **UI Framework**: Ant Design 6.1
- **PDF Generation**: pdfmake 0.3
- **Barcode Generation**: bwip-js
- **State Management**: React Context + Immer

## 🏁 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/AbirahamImmanvel/PDF-builder.git
    cd PDF-builder
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Start the development server:

    ```bash
    npm run dev
    ```

4.  Open your browser at `http://localhost:5173`.

## 📜 Scripts

- `npm run dev`: Start development server.
- `npm run build`: Production build.
- `npm run lint`: Run ESLint.
- `npm run preview`: Preview production build locally.

---

Built with ❤️ by [Abraham Immanuel](https://github.com/AbirahamImmanvel)
