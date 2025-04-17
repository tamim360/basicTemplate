import React, { useState, useRef, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?worker";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import jsQR from "jsqr";
pdfjsLib.GlobalWorkerOptions.workerPort = new pdfjsWorker();
import "./OMRTest.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function OMRTest() {
  const canvasRefs = useRef([]);
  const [images, setImages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rollData, setRollData] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [answerData, setAnswerData] = useState("");
  const [responseData, setResponseData] = useState([]);
  const [processedImages, setProcessedImages] = useState([]);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const generatePDF = async () => {
    if (processedImages.length === 0) return;

    const doc = new jsPDF();
    setDownloadProgress(0);

    for (let i = 0; i < processedImages.length; i++) {
      const img = new Image();
      img.src = processedImages[i];
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      const pageWidth = imgWidth / 2;
      const pageHeight = imgHeight / 2;

      if (i === 0) {
        doc.deletePage(1);
        doc.addPage([pageWidth, pageHeight], "portrait");
      } else {
        doc.addPage([pageWidth, pageHeight], "portrait");
      }

      doc.addImage(img, "PNG", 0, 0, pageWidth, pageHeight, undefined, "FAST");

      const progress = ((i + 1) / processedImages.length) * 100;
      setDownloadProgress(progress);
    }
    doc.save("processed_pages.pdf");
    setDownloadProgress(0);
  };

  // Update displayed data when page changes
  useEffect(() => {
    if (responseData.length > 0 && currentPage < responseData.length) {
      const currentResponse = responseData[currentPage];
      setRollData(currentResponse.roll);
      const answerString = Object.entries(currentResponse.answer)
        .map(([q, a]) => `${q}: ${a}`)
        .join(", ");
      setAnswerData(answerString);
    } else {
      setRollData("");
      setAnswerData("");
    }
  }, [currentPage, responseData]);

  // Update canvas when page changes
  useEffect(() => {
    if (processedImages.length > 0 && currentPage < processedImages.length) {
      const canvas = canvasRefs.current[0];
      if (canvas) {
        const img = new Image();
        img.onload = () => {
          const ctx = canvas.getContext("2d");
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
        };
        img.src = processedImages[currentPage];
      }
    }
  }, [currentPage, processedImages]);

  const exportToXLSX = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Responses");

    // headers in exportToXLSX function:
    const headers = [
      "roll",
      "qrCode",
      ...Array.from({ length: 100 }, (_, i) => `Q${i + 1}`),
    ];
    sheet.addRow(headers);

    responseData.forEach((entry) => {
      const row = [
        entry.roll,
        entry.qrCode,
        ...headers.slice(2).map((q) => entry.answer[q] || "blank"),
      ];
      sheet.addRow(row);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "responseData.xlsx";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // const handleFileUpload = async (e) => {
  //   const file = e.target.files[0];
  //   if (!file || file.type !== "application/pdf") return;
  //   setLoading(true);
  //   const reader = new FileReader();
  //   reader.onload = async function () {
  //     const typedArray = new Uint8Array(this.result);
  //     const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
  //     const tempImages = [];
  //     const tempResponses = [];
  //     const tempProcessedImgs = [];

  //     const processPage = async (i) => {
  //       const page = await pdf.getPage(i);
  //       const viewport = page.getViewport({ scale: 2 });
  //       const canvas = document.createElement("canvas");
  //       const ctx = canvas.getContext("2d");
  //       canvas.width = viewport.width;
  //       canvas.height = viewport.height;
  //       await page.render({ canvasContext: ctx, viewport }).promise;
  //       const imgDataUrl = canvas.toDataURL("image/png");
  //       tempImages.push(imgDataUrl);

  //       // Process the page instantly
  //       const w = canvas.width;
  //       const h = canvas.height;
  //       const imageData = ctx.getImageData(0, 0, w, h);
  //       const pixels = imageData.data;
  //       const gray = new Uint8ClampedArray(w * h);
  //       for (let i = 0; i < pixels.length; i += 4) {
  //         gray[i / 4] =
  //           0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
  //       }

  //       const threshold = otsuThreshold(gray);
  //       const binary = gray.map((v) => (v < threshold ? 1 : 0));

  //       const detectBar = (startX, width) => {
  //         let columnScores = new Array(width).fill(0);
  //         for (let x = 0; x < width; x++) {
  //           let score = 0;
  //           for (let y = 0; y < h; y++) {
  //             if (binary[y * w + (startX + x)] === 1) score++;
  //           }
  //           columnScores[x] = score;
  //         }
  //         const thresholdColumn = h * 0.4;
  //         let maxStart = 0,
  //           maxEnd = 0,
  //           inBar = false,
  //           barStart = 0;
  //         for (let i = 0; i < columnScores.length; i++) {
  //           if (!inBar && columnScores[i] > thresholdColumn) {
  //             inBar = true;
  //             barStart = i;
  //           } else if (inBar && columnScores[i] <= thresholdColumn) {
  //             inBar = false;
  //             const barEnd = i;
  //             if (barEnd - barStart > maxEnd - maxStart) {
  //               maxStart = barStart;
  //               maxEnd = barEnd;
  //             }
  //           }
  //         }
  //         const x = startX + maxStart;
  //         const barWidth = maxEnd - maxStart;
  //         let top = h;
  //         for (let y = 0; y < h; y++) {
  //           for (let xOffset = 0; xOffset < barWidth; xOffset++) {
  //             if (binary[y * w + (x + xOffset)] === 1) {
  //               top = y;
  //               break;
  //             }
  //           }
  //           if (top !== h) break;
  //         }
  //         return { x, y: top, width: barWidth, height: h - top };
  //       };

  //       const margin = Math.floor(w * 0.1);
  //       const leftBar = detectBar(0, margin);
  //       const qrData = detectQRCode(ctx, leftBar);

  //       ctx.strokeStyle = "#00FF00";
  //       ctx.lineWidth = 3;
  //       ctx.strokeRect(
  //         leftBar.x + leftBar.width + qrCodeArea.offsetX,
  //         leftBar.y + qrCodeArea.offsetY,
  //         qrCodeArea.areaWidth,
  //         qrCodeArea.areaHeight
  //       );

  //       const rollDigits = detectRollNumber(
  //         ctx,
  //         binary,
  //         w,
  //         h,
  //         leftBar,
  //         rollNumberArea
  //       );
  //       const answers = detectAnswers(
  //         ctx,
  //         binary,
  //         w,
  //         h,
  //         leftBar,
  //         answerSections
  //       );
  //       const completeAnswers = Object.fromEntries(
  //         Array.from({ length: 100 }, (_, i) => [
  //           `Q${i + 1}`,
  //           answers[`Q${i + 1}`] || "blank",
  //         ])
  //       );

  //       const dataUrl = canvas.toDataURL("image/png");
  //       tempProcessedImgs.push(dataUrl);
  //       tempResponses.push({
  //         page: String(i),
  //         roll: rollDigits.map((d) => (d !== null ? d : "_")).join(""),
  //         qrCode: qrData || "Not detected",
  //         answer: completeAnswers,
  //       });

  //       setImages([...tempImages]);
  //       setProcessedImages([...tempProcessedImgs]);
  //       setResponseData([...tempResponses]);
  //     };

  //     const promises = [];
  //     for (let i = 1; i <= pdf.numPages; i++) {
  //       promises.push(processPage(i));
  //     }

  //     await Promise.all(promises);
  //     setCurrentPage(0);
  //     setLoading(false);
  //   };
  //   reader.readAsArrayBuffer(file);
  // };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== "application/pdf") return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async function () {
      const typedArray = new Uint8Array(this.result);
      const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
      const tempImages = [];
      const tempResponses = [];
      const tempProcessedImgs = [];

      const processPage = async (i) => {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport }).promise;
        const imgDataUrl = canvas.toDataURL("image/png");
        tempImages.push(imgDataUrl);

        // Process the page instantly
        const w = canvas.width;
        const h = canvas.height;
        const imageData = ctx.getImageData(0, 0, w, h);
        const pixels = imageData.data;
        const gray = new Uint8ClampedArray(w * h);
        for (let i = 0; i < pixels.length; i += 4) {
          gray[i / 4] =
            0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
        }

        const threshold = otsuThreshold(gray);
        const binary = gray.map((v) => (v < threshold ? 1 : 0));

        const detectBar = (startX, width) => {
          let columnScores = new Array(width).fill(0);
          for (let x = 0; x < width; x++) {
            let score = 0;
            for (let y = 0; y < h; y++) {
              if (binary[y * w + (startX + x)] === 1) score++;
            }
            columnScores[x] = score;
          }
          const thresholdColumn = h * 0.4;
          let maxStart = 0,
            maxEnd = 0,
            inBar = false,
            barStart = 0;
          for (let i = 0; i < columnScores.length; i++) {
            if (!inBar && columnScores[i] > thresholdColumn) {
              inBar = true;
              barStart = i;
            } else if (inBar && columnScores[i] <= thresholdColumn) {
              inBar = false;
              const barEnd = i;
              if (barEnd - barStart > maxEnd - maxStart) {
                maxStart = barStart;
                maxEnd = barEnd;
              }
            }
          }
          const x = startX + maxStart;
          const barWidth = maxEnd - maxStart;
          let top = h;
          for (let y = 0; y < h; y++) {
            for (let xOffset = 0; xOffset < barWidth; xOffset++) {
              if (binary[y * w + (x + xOffset)] === 1) {
                top = y;
                break;
              }
            }
            if (top !== h) break;
          }
          return { x, y: top, width: barWidth, height: h - top };
        };

        const margin = Math.floor(w * 0.1);
        const leftBar = detectBar(0, margin);
        const rightBar = detectBar(w - margin, margin); // Detect right bar
        const qrData = detectQRCode(ctx, leftBar);

        // Draw detected bars in red
        ctx.strokeStyle = "rgba(0,0,255,0.4)";
        ctx.fillStyle = "rgba(0,0,255,0.4)";
        ctx.lineWidth = 3;
        ctx.strokeRect(leftBar.x, leftBar.y, leftBar.width, leftBar.height);
        ctx.fillRect(leftBar.x, leftBar.y, leftBar.width, leftBar.height);
        ctx.strokeRect(rightBar.x, rightBar.y, rightBar.width, rightBar.height);
        ctx.fillRect(rightBar.x, rightBar.y, rightBar.width, rightBar.height);

        // QR code marking
        ctx.strokeStyle = "rgba(0,0,255,0.4)";
        ctx.fillStyle = "rgba(0,0,255,0.4)";
        ctx.lineWidth = 3;
        ctx.strokeRect(
          leftBar.x + leftBar.width + qrCodeArea.offsetX,
          leftBar.y + qrCodeArea.offsetY,
          qrCodeArea.areaWidth,
          qrCodeArea.areaHeight
        );
        ctx.fillRect(
          leftBar.x + leftBar.width + qrCodeArea.offsetX,
          leftBar.y + qrCodeArea.offsetY,
          qrCodeArea.areaWidth,
          qrCodeArea.areaHeight
        );

        const rollDigits = detectRollNumber(
          ctx,
          binary,
          w,
          h,
          leftBar,
          rollNumberArea
        );
        const answers = detectAnswers(
          ctx,
          binary,
          w,
          h,
          leftBar,
          answerSections
        );
        const completeAnswers = Object.fromEntries(
          Array.from({ length: 100 }, (_, i) => [
            `Q${i + 1}`,
            answers[`Q${i + 1}`] || "blank",
          ])
        );

        const dataUrl = canvas.toDataURL("image/png");
        tempProcessedImgs.push(dataUrl);
        tempResponses.push({
          page: String(i),
          roll: rollDigits.map((d) => (d !== null ? d : "_")).join(""),
          qrCode: qrData || null,
          answer: completeAnswers,
        });

        setImages([...tempImages]);
        setProcessedImages([...tempProcessedImgs]);
        setResponseData([...tempResponses]);
      };

      const promises = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        promises.push(processPage(i));
      }

      await Promise.all(promises);
      setCurrentPage(0);
      setLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  function otsuThreshold(grayPixels) {
    const hist = new Array(256).fill(0);
    grayPixels.forEach((v) => hist[v]++);
    const total = grayPixels.length;
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * hist[i];
    let sumB = 0,
      wB = 0,
      wF = 0,
      max = 0,
      between = 0,
      threshold = 0;
    for (let t = 0; t < 256; t++) {
      wB += hist[t];
      if (wB === 0) continue;
      wF = total - wB;
      if (wF === 0) break;
      sumB += t * hist[t];
      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;
      between = wB * wF * (mB - mF) * (mB - mF);
      if (between > max) {
        max = between;
        threshold = t;
      }
    }
    return threshold;
  }

  const rollNumberArea = {
    offsetX: 14,
    offsetY: 314,
    areaWidth: 205,
    areaHeight: 310,
    cols: 7,
    rows: 10,
  };

  // Add QR code area configuration
  const qrCodeArea = {
    offsetX: 438,
    offsetY: 233,
    areaWidth: 140,
    areaHeight: 128,
  };
  // Add QR code detection function
  function detectQRCode(ctx, leftBar) {
    const startX = leftBar.x + leftBar.width + qrCodeArea.offsetX;
    const startY = leftBar.y + qrCodeArea.offsetY;

    // Extract QR code area image data
    const imageData = ctx.getImageData(
      startX,
      startY,
      qrCodeArea.areaWidth,
      qrCodeArea.areaHeight
    );

    // Try to decode QR code
    const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });

    return qrCode ? qrCode.data : null;
  }

  const answerSections = [
    {
      name: "Q1-Q25",
      offsetX: 44,
      offsetY: 705,
      areaWidth: 110,
      areaHeight: 905,
      cols: 4,
      rows: 25,
    },
    {
      name: "Q26-Q50",
      offsetX: 185,
      offsetY: 705,
      areaWidth: 110,
      areaHeight: 905,
      cols: 4,
      rows: 25,
    },
    {
      name: "Q51-Q75",
      offsetX: 326,
      offsetY: 705,
      areaWidth: 110,
      areaHeight: 905,
      cols: 4,
      rows: 25,
    },
    {
      name: "Q76-Q100",
      offsetX: 467,
      offsetY: 705,
      areaWidth: 110,
      areaHeight: 905,
      cols: 4,
      rows: 25,
    },
  ];

  function detectRollNumber(ctx, binary, w, h, leftBar, area) {
    const startX = leftBar.x + leftBar.width + area.offsetX;
    const startY = leftBar.y + area.offsetY;
    const bubbleWidth = area.areaWidth / area.cols;
    const bubbleHeight = area.areaHeight / area.rows;

    ctx.strokeStyle = "blue";
    ctx.lineWidth = 1.5;

    let rollDigits = Array(area.cols).fill(null);

    for (let col = 0; col < area.cols; col++) {
      for (let row = 0; row < area.rows; row++) {
        const x = startX + col * bubbleWidth;
        const y = startY + row * bubbleHeight;
        let filled = 0;
        for (let dy = 5; dy < bubbleHeight - 5; dy++) {
          for (let dx = 5; dx < bubbleWidth - 5; dx++) {
            const px = Math.floor(x + dx);
            const py = Math.floor(y + dy);
            if (px < w && py < h && binary[py * w + px] === 1) filled++;
          }
        }
        const fillRatio = filled / ((bubbleWidth - 10) * (bubbleHeight - 10));
        if (fillRatio > 0.4) {
          ctx.fillStyle = "rgba(0,0,255,0.4)";
          ctx.fillRect(x, y, bubbleWidth, bubbleHeight);
          rollDigits[col] = row;
        }
        ctx.strokeRect(x, y, bubbleWidth, bubbleHeight);
      }
    }

    return rollDigits;
  }

  function detectAnswers(ctx, binary, w, h, leftBar, sections) {
    const answers = {};
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "purple";

    sections.forEach((section, sectionIndex) => {
      const startX = leftBar.x + leftBar.width + section.offsetX;
      const startY = leftBar.y + section.offsetY;
      const bubbleWidth = section.areaWidth / section.cols;
      const bubbleHeight = section.areaHeight / section.rows;

      for (let row = 0; row < section.rows; row++) {
        for (let col = 0; col < section.cols; col++) {
          const x = startX + col * bubbleWidth;
          const y = startY + row * bubbleHeight;

          let filled = 0;
          for (let dy = 5; dy < bubbleHeight - 5; dy++) {
            for (let dx = 5; dx < bubbleWidth - 5; dx++) {
              const px = Math.floor(x + dx);
              const py = Math.floor(y + dy);
              if (px < w && py < h && binary[py * w + px] === 1) filled++;
            }
          }
          const fillRatio = filled / ((bubbleWidth - 10) * (bubbleHeight - 10));
          const qNum = sectionIndex * 25 + row + 1;
          if (fillRatio > 0.4) {
            answers[`Q${qNum}`] =
              (answers[`Q${qNum}`] || "") + String.fromCharCode(65 + col);
            ctx.fillStyle = "rgba(128,0,128,0.4)";
            ctx.fillRect(x, y, bubbleWidth, bubbleHeight);
          }
          ctx.strokeRect(x, y, bubbleWidth, bubbleHeight);
        }
      }
    });

    return answers;
  }

  // const detectAlignmentBars = () => {
  //   setLoading(true);
  //   const updatedResponses = [];
  //   const processedImgs = [];

  //   const processPage = (pageIndex) => {
  //     return new Promise((resolve) => {
  //       const canvas = document.createElement("canvas");
  //       const ctx = canvas.getContext("2d");
  //       const img = new Image();

  //       img.onload = () => {
  //         const w = img.width;
  //         const h = img.height;
  //         canvas.width = w;
  //         canvas.height = h;
  //         ctx.drawImage(img, 0, 0);

  //         const imgData = ctx.getImageData(0, 0, w, h);
  //         const pixels = imgData.data;
  //         const gray = new Uint8ClampedArray(w * h);
  //         for (let i = 0; i < pixels.length; i += 4) {
  //           gray[i / 4] =
  //             0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
  //         }

  //         const threshold = otsuThreshold(gray);
  //         const binary = gray.map((v) => (v < threshold ? 1 : 0));

  //         const detectBar = (startX, width) => {
  //           let columnScores = new Array(width).fill(0);
  //           for (let x = 0; x < width; x++) {
  //             let score = 0;
  //             for (let y = 0; y < h; y++) {
  //               if (binary[y * w + (startX + x)] === 1) score++;
  //             }
  //             columnScores[x] = score;
  //           }
  //           const thresholdColumn = h * 0.4;
  //           let maxStart = 0,
  //             maxEnd = 0,
  //             inBar = false,
  //             barStart = 0;
  //           for (let i = 0; i < columnScores.length; i++) {
  //             if (!inBar && columnScores[i] > thresholdColumn) {
  //               inBar = true;
  //               barStart = i;
  //             } else if (inBar && columnScores[i] <= thresholdColumn) {
  //               inBar = false;
  //               const barEnd = i;
  //               if (barEnd - barStart > maxEnd - maxStart) {
  //                 maxStart = barStart;
  //                 maxEnd = barEnd;
  //               }
  //             }
  //           }
  //           const x = startX + maxStart;
  //           const barWidth = maxEnd - maxStart;
  //           let top = h;
  //           for (let y = 0; y < h; y++) {
  //             for (let xOffset = 0; xOffset < barWidth; xOffset++) {
  //               if (binary[y * w + (x + xOffset)] === 1) {
  //                 top = y;
  //                 break;
  //               }
  //             }
  //             if (top !== h) break;
  //           }
  //           return { x, y: top, width: barWidth, height: h - top };
  //         };

  //         const margin = Math.floor(w * 0.1);
  //         const leftBar = detectBar(0, margin);
  //         // eslint-disable-next-line no-unused-vars
  //         const rightBar = detectBar(w - margin, margin);

  //         // Detect QR code FIRST before other markings
  //         const qrData = detectQRCode(ctx, leftBar);

  //         // Draw QR code area boundary with high visibility
  //         ctx.strokeStyle = "#00FF00";
  //         ctx.lineWidth = 3;
  //         ctx.strokeRect(
  //           leftBar.x + leftBar.width + qrCodeArea.offsetX,
  //           leftBar.y + qrCodeArea.offsetY,
  //           qrCodeArea.areaWidth,
  //           qrCodeArea.areaHeight
  //         );

  //         // Then detect roll and answers
  //         const rollDigits = detectRollNumber(
  //           ctx,
  //           binary,
  //           w,
  //           h,
  //           leftBar,
  //           rollNumberArea
  //         );
  //         const answers = detectAnswers(
  //           ctx,
  //           binary,
  //           w,
  //           h,
  //           leftBar,
  //           answerSections
  //         );

  //         const completeAnswers = Object.fromEntries(
  //           Array.from({ length: 100 }, (_, i) => [
  //             `Q${i + 1}`,
  //             answers[`Q${i + 1}`] || "blank",
  //           ])
  //         );

  //         // Capture the canvas AFTER all drawings
  //         const dataUrl = canvas.toDataURL("image/png");
  //         processedImgs.push(dataUrl);

  //         updatedResponses.push({
  //           page: String(pageIndex + 1),
  //           roll: rollDigits.map((d) => (d !== null ? d : "_")).join(""),
  //           qrCode: qrData || "Not detected",
  //           answer: completeAnswers,
  //         });

  //         resolve();
  //       };

  //       img.src = images[pageIndex];
  //     });
  //   };

  //   Promise.all(images.map((_, i) => processPage(i))).then(() => {
  //     setResponseData(updatedResponses);
  //     setProcessedImages(processedImgs);
  //     setLoading(false);
  //   });
  // };

  return (
    <div className="styled-container">
      {/* upload section  */}
      {!(responseData.length > 0) && (
        <label className="file-input-label">
          <FontAwesomeIcon
            className="icon"
            icon="fa-solid fa-arrow-up-from-bracket"
            bounce
          />
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
            className="file-input"
          />
        </label>
      )}

      {/* navigator  */}
      {images.length > 0 && (
        <div className="navigator-div">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            className="navigation-button"
          >
            ← Prev
          </button>
          <input
            type="number"
            min={1}
            max={images.length}
            value={currentPage + 1}
            onChange={(e) => setCurrentPage(Number(e.target.value) - 1)}
            className="w-16 border p-1 rounded text-center bg-gray-50"
          />
          <button
            onClick={() =>
              setCurrentPage((p) => Math.min(images.length - 1, p + 1))
            }
            className="navigation-button"
          >
            Next →
          </button>
        </div>
      )}

      {/* loader */}
      <div className="loader-spinner">
        {loading && (
          <div className="processing-text">
            <div className="spinner"></div>
            Analyzing Document...
          </div>
        )}
        <div className="omr-detected-answer-container">
          {processedImages[currentPage] && (
            <canvas
              ref={(el) => (canvasRefs.current[0] = el)}
              className="omr-canvas"
            />
          )}
          {responseData.length > 0 && currentPage < responseData.length && (
            <div className="data-card">
              {rollData}
              <table className="answer-table">
                <thead>
                  <tr>
                    <th colSpan="4" className="table-header">
                      Page {responseData[currentPage].page} <br />
                      Roll Number: {responseData[currentPage].roll}
                      QR Code: {responseData[currentPage].qrCode}
                    </th>
                  </tr>
                  <tr className="column-headers">
                    <th>Q1-Q25</th>
                    <th>Q26-Q50</th>
                    <th>Q51-Q75</th>
                    <th>Q76-Q100</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {[0, 25, 50, 75].map((startIdx) => (
                      <td key={startIdx} className="answer-column">
                        {Object.entries(responseData[currentPage].answer)
                          .slice(startIdx, startIdx + 25)
                          .map(([q, a]) => (
                            <div key={q} className="answer-item">
                              <span className="question-number">{q}:</span>
                              <span className="answer-value">{a}</span>
                            </div>
                          ))}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* download-button  */}
      {responseData.length > 0 && (
        <button
          onClick={generatePDF}
          className="download-button"
          disabled={processedImages.length === 0}
        >
          Download Processed PDF
        </button>
      )}

      {downloadProgress > 0 && (
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${downloadProgress}%` }}
            ></div>
          </div>
          <div className="progress-text">
            Downloading: {Math.round(downloadProgress)}% (
            {Math.round((downloadProgress / 100) * processedImages.length)}/
            {processedImages.length})
          </div>
        </div>
      )}

      {/* all-response-data  */}
      {responseData.length > 0 && (
        <div className="full-answer-table">
          <table>
            <thead>
              <tr>
                <th className="sticky-header">Page</th>
                <th className="sticky-header">Roll</th>
                {Array.from({ length: 100 }, (_, i) => (
                  <th key={i} className="question-header">
                    Q{i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {responseData.map((entry) => (
                <tr key={entry.page}>
                  <td className="page-cell">{entry.page}</td>
                  <td className="roll-cell">{entry.roll}</td>
                  {Array.from({ length: 100 }, (_, i) => {
                    const answer = entry.answer[`Q${i + 1}`] || "blank";
                    return (
                      <td
                        key={i}
                        className={`answer-cell ${
                          answer === "blank" ? "blank" : ""
                        }`}
                      >
                        {answer}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {responseData.length > 0 && (
        <button onClick={exportToXLSX} className="export-button">
          Export Response Data As Excel
        </button>
      )}
    </div>
  );
}
