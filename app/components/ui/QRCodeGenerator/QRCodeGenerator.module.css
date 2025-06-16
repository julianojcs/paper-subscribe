import React, { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import styles from "./QRCodeGenerator.module.css";

export default function QRCodeGenerator() {
  const [url, setUrl] = useState("");
  const qrCanvasRef = useRef();

  const handleInputChange = (e) => {
    setUrl(e.target.value);
  };

  const downloadQRCode = () => {
    const canvas = qrCanvasRef.current;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = "qrcode.png";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <div className={styles.qrCodeContainer}>
      <h1 className={styles.title}>QR Code Generator</h1>
      <input
        type="text"
        value={url}
        onChange={handleInputChange}
        placeholder="Enter URL"
        className={styles.input}
      />
      <button
        onClick={() => setUrl(url)}
        className={styles.generateButton}
      >
        Generate QR Code
      </button>
      {url && (
        <div className={styles.qrCodeDisplay}>
          <QRCodeCanvas value={url} ref={qrCanvasRef} size={256} />
          <button
            onClick={downloadQRCode}
            className={styles.downloadButton}
          >
            Download QR Code
          </button>
        </div>
      )}
    </div>
  );
}