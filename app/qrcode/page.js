"use client";

import React, { useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import styles from "./QRCodePage.module.css";

const QR_SIZES = [
  { label: "Crachá (120px)", value: 120 },
  { label: "Papel A4 (180px)", value: 180 },
  { label: "Banner pequeno (300px)", value: 300 },
  { label: "Banner grande (500px)", value: 500 },
  { label: "Outdoor (800px)", value: 800 },
];

export default function QRCodePage() {
  const [url, setUrl] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [qrSize, setQrSize] = useState(QR_SIZES[1].value); // Default: A4
  const [error, setError] = useState("");
  const qrCanvasRef = useRef();

  const handleGenerateQRCode = (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setShowQR(false);
      setError("Por favor, informe uma URL para gerar o QR Code.");
      return;
    }
    setShowQR(true);
    setError("");
  };

  const handleDownloadQRCode = () => {
    const canvas = qrCanvasRef.current;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `qrcode-${qrSize}px.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Ajusta o container ao mudar o tamanho
  const qrContainerStyle = {
    width: qrSize,
    height: qrSize,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    margin: "0 auto",
    background: "#fff",
    borderRadius: 8,
    boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Gerador de QR Code</h1>
      <form onSubmit={handleGenerateQRCode} style={{ width: "100%" }}>
        <div className={styles.inputGroup}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Insira a URL para gerar o QR Code"
            className={styles.input}
          />
          <div className={styles.selectWrapper}>
            <label htmlFor="qr-size" className={styles.selectLabel}>
              Tamanho:
            </label>
            <select
              id="qr-size"
              value={qrSize}
              onChange={(e) => setQrSize(Number(e.target.value))}
              className={styles.select}
            >
              {QR_SIZES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <button type="submit" className={styles.button}>
          Gerar QR Code
        </button>
      </form>
      {showQR && url && (
        <div className={styles.qrCodeContainer} style={qrContainerStyle}>
          <QRCodeCanvas value={url} size={qrSize} ref={qrCanvasRef} />
        </div>
      )}
      {showQR && url && (
        <button
          onClick={handleDownloadQRCode}
          className={styles.downloadButton}
        >
          Baixar QR Code
        </button>
      )}
    </div>
  );
}