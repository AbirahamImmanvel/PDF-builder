import React, { useEffect, useState } from "react";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import bwipjs from "bwip-js";
import { useBuilder } from "../../context/BuilderContext";

if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if (pdfFonts && pdfFonts.vfs) {
  pdfMake.vfs = pdfFonts.vfs;
} else if (window && window.pdfMake && window.pdfMake.vfs) {
} else {
  try {
     pdfMake.vfs = pdfFonts;
  } catch (e) {
     console.warn("Could not assign pdfFonts", e);
  }
}

const fetchImageOrSVG = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Failed to fetch image: ${response.statusText}`);

    const contentType = response.headers.get("content-type");
    
    if (contentType?.includes("svg") || url.toLowerCase().endsWith(".svg")) {
        const text = await response.text();
        return { type: "svg", content: text };
    }

    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === "string" && result.startsWith("data:image")) {
          resolve({ type: "image", content: result });
        } else {
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("Failed to load image/svg", url, e);
    return null;
  }
};

const convertBarcodeToImage = (barcodeData) => {
  try {
    const canvas = document.createElement("canvas");
    const barcodeType = barcodeData.type || "code128";

    const typeMap = {
      CODE128: "code128",
      CODE39: "code39",
      EAN13: "ean13",
      EAN8: "ean8",
      UPC: "upca",
      UPCA: "upca",
      UPCE: "upce",
    };

    const bcid = typeMap[barcodeType.toUpperCase()] || "code128";

    bwipjs.toCanvas(canvas, {
      bcid: bcid,
      text: barcodeData.barcode || "123456789",
      scale: 2,
      height: 8,
      includetext: true,
      textxalign: "center",
    });

    return canvas.toDataURL("image/png");
  } catch (e) {
    return null;
  }
};

const preProcessDocDef = async (docDef) => {
  const clone = JSON.parse(JSON.stringify(docDef));

  const processNode = async (node) => {
    if (!node) return;
    if (typeof node === "object") {
      delete node._id;
      delete node.type;
      delete node.name;

      if (node.barcode) {
        const barcodeImage = convertBarcodeToImage(node);
        if (barcodeImage) {
          delete node.barcode;
          node.image = barcodeImage;
          if (!node.width && !node.fit) {
            node.width = 150; // Smaller default width that fits in cells
          } else if (node.fit) {
            node.width = node.fit;
            delete node.fit;
          }
        }
      }

      if (node.image && typeof node.image === "string") {
        let imgUrl = node.image;
        if (!imgUrl.startsWith("http") && !imgUrl.startsWith("data:")) {
           imgUrl = "https://" + imgUrl;
        }

        if (imgUrl.startsWith("http")) {
            const result = await fetchImageOrSVG(imgUrl);
            if (result) {
                if (result.type === 'svg') {
                    delete node.image;
                    node.svg = result.content;
                } else {
                    node.image = result.content;
                }
            } else {
                delete node.image;
                node.text = `[Image Load Failed: ${imgUrl}]`;
                node.color = "red";
                node.fontSize = 10;
            }
        }
      }

      if (node.columns) await Promise.all(node.columns.map(processNode));
      if (node.stack) await Promise.all(node.stack.map(processNode));
      if (node.ul) {
      }
      if (node.ol) {
      }
      if (node.table && node.table.body) {
        for (let row of node.table.body) {
          await Promise.all(row.map(processNode));
        }
      }
    }
  };

  if (clone.content) {
    await Promise.all(clone.content.map(processNode));
  }

  return clone;
};

const PDFPreview = () => {
  const { state } = useBuilder();
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const generate = async () => {
      try {
        setError(null);
        
        if (!pdfMake.vfs) {
            throw new Error("PDF Fonts not initialized correctly (vfs missing).");
        }

        const processedDef = await preProcessDocDef(state.docDef);
        
        const pdfDocGenerator = pdfMake.createPdf(processedDef);

        const getDataUrlPromise = new Promise((resolve, reject) => {
            const id = setTimeout(() => {
                reject(new Error("PDF Generation timed out (3s). Check console for details."));
            }, 3000);

            try {
                const potentialPromise = pdfDocGenerator.getDataUrl((dataUrl) => {
                    clearTimeout(id);
                    resolve(dataUrl);
                });
                
                if (potentialPromise && typeof potentialPromise.then === 'function') {
                    potentialPromise.then((dataUrl) => {
                        clearTimeout(id);
                        resolve(dataUrl);
                    });
                }
            } catch (err) {
                clearTimeout(id);
                reject(err);
            }
        });

        const dataUrl = await getDataUrlPromise;
        if (active) {
            setUrl(dataUrl);
        }
      } catch (e) {
        if (active) setError(e.message);
      }
    };

    const timer = setTimeout(generate, 800);
    return () => { 
        clearTimeout(timer);
        active = false; 
    };
  }, [state.docDef]);

  if (error) {
    return (
      <div style={{ color: "red", padding: 20 }}>
        <h4>Preview Generation Failed</h4>
        <pre>{error}</pre>
      </div>
    );
  }

  if (!url) return <div>Generating Preview...</div>;

  return (
    <iframe
      src={url}
      style={{ width: "100%", height: "100%", border: "none" }}
      title="PDF Preview"
    />
  );
};

export default PDFPreview;
