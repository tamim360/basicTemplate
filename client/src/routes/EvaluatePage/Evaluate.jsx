import React, { useState } from "react";
import ExcelJS from "exceljs";
import "./Evaluate.scss";

export default function Evaluate() {
  const [answerKey, setAnswerKey] = useState([]);
  const [responses, setResponses] = useState([]);
  const [marksData, setMarksData] = useState([]);

  const readExcelFile = async (file, setter) => {
    const workbook = new ExcelJS.Workbook();
    const buffer = await file.arrayBuffer();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    const rows = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const rowData = {};
      worksheet.getRow(1).eachCell((cell, i) => {
        rowData[cell.value] = row.getCell(i).value;
      });

      // Calculate max valid question for answer keys
      if (setter === setAnswerKey) {
        let maxQ = 0;
        for (let i = 1; i <= 100; i++) {
          const q = `Q${i}`;
          if (
            rowData[q] !== null &&
            rowData[q] !== undefined &&
            rowData[q] !== ""
          ) {
            maxQ = i;
          } else {
            break;
          }
        }
        rowData.maxQuestion = maxQ;
      }

      rows.push(rowData);
    });

    setter(rows);
  };

  const evaluateAnswers = () => {
    if (!answerKey.length || !responses.length) return;

    const result = responses.map((student) => {
      const key = answerKey.find((ak) => ak.qrCode === student.qrCode);
      if (!key) {
        return {
          ...student,
          error: "No matching answer key found",
          correctCount: 0,
          incorrectCount: 0,
          skippedCount: 0,
        };
      }

      let correctCount = 0;
      let incorrectCount = 0;
      let skippedCount = 0;
      const maxQuestion = key.maxQuestion || 100;

      for (let i = 1; i <= maxQuestion; i++) {
        const q = `Q${i}`;
        const studentAnswer = String(student[q] || "")
          .toUpperCase()
          .trim();
        const correctAnswer = String(key[q] || "")
          .toUpperCase()
          .trim();

        // Handle skipped answers
        if (studentAnswer === "" || studentAnswer === "BLANK") {
          skippedCount++;
        } else if (studentAnswer === correctAnswer) {
          correctCount++;
        } else {
          incorrectCount++;
        }
      }

      return {
        ...student,
        correctCount,
        incorrectCount,
        skippedCount,
        maxQuestion,
        matchedAnswerKey: key,
      };
    });

    setMarksData(result);
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Results");

    worksheet.columns = [
      { header: "QR Code", key: "qrCode", width: 20 },
      { header: "Roll", key: "roll", width: 15 },
      { header: "Correct", key: "correct", width: 10 },
      { header: "Incorrect", key: "incorrect", width: 10 },
      { header: "Skipped", key: "skipped", width: 10 },
    ];

    marksData.forEach((item) => {
      worksheet.addRow({
        qrCode: item.qrCode,
        roll: item.roll,
        correct: item.correctCount,
        incorrect: item.incorrectCount,
        skipped: item.skippedCount,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "exam-results.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate maximum questions across all answer keys
  const globalMaxQuestion = answerKey.reduce(
    (max, ak) => Math.max(max, ak.maxQuestion || 0),
    0
  );

  return (
    <div className="container">
      <h1 className="main-heading">OMR Evaluation System</h1>
      <div className="upload-section">
        <h3>Upload Answer Key</h3>
        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => readExcelFile(e.target.files[0], setAnswerKey)}
          className="file-input"
        />
        <br />
        <h3>Upload Response Data</h3>
        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => readExcelFile(e.target.files[0], setResponses)}
          className="file-input"
          style={{ marginTop: "1rem" }}
        />
        <button onClick={evaluateAnswers} className="evaluate-btn">
          Evaluate Answers
        </button>
      </div>

      {marksData.length > 0 && (
        <div className="result-section">
          <button onClick={exportToExcel} className="export-btn">
            Export to Excel
          </button>
          <div className="result-container">
            <table className="results-table">
              <thead>
                <tr>
                  <th className="sticky-column">QR Code</th>
                  <th className="sticky-column">Roll</th>
                  {Array.from({ length: globalMaxQuestion }, (_, i) => (
                    <th key={i}>Q{i + 1}</th>
                  ))}
                  {/* Added summary columns */}
                  <th className="sticky-column-right correct-bg">Correct</th>
                  <th className="sticky-column-right incorrect-bg">
                    Incorrect
                  </th>
                  <th className="sticky-column-right skipped-bg">Skipped</th>
                </tr>
              </thead>
              <tbody>
                {marksData.map((student) => (
                  <React.Fragment key={student.roll}>
                    <tr>
                      <td className="sticky-column" rowSpan="2">
                        {student.qrCode}
                      </td>
                      <td className="sticky-column" rowSpan="2">
                        {student.roll}
                      </td>
                      {Array.from({ length: globalMaxQuestion }, (_, i) => {
                        const q = `Q${i + 1}`;
                        const isValid = i < (student.maxQuestion || 0);
                        return (
                          <td
                            key={q}
                            className={isValid ? "correct-answer" : ""}
                          >
                            {isValid
                              ? student.matchedAnswerKey?.[q]?.toUpperCase() ||
                                "-"
                              : "N/A"}
                          </td>
                        );
                      })}
                      {/* Summary cells with rowSpan */}
                      <td
                        className="sticky-column-right correct-bg"
                        rowSpan="2"
                      >
                        {student.correctCount}
                      </td>
                      <td
                        className="sticky-column-right incorrect-bg"
                        rowSpan="2"
                      >
                        {student.incorrectCount}
                      </td>
                      <td
                        className="sticky-column-right skipped-bg"
                        rowSpan="2"
                      >
                        {student.skippedCount}
                      </td>
                    </tr>
                    <tr>
                      {Array.from({ length: globalMaxQuestion }, (_, i) => {
                        const q = `Q${i + 1}`;
                        const isValid = i < (student.maxQuestion || 0);
                        const answer = String(student[q] || "")
                          .toUpperCase()
                          .trim();
                        const correctAnswer = String(
                          student.matchedAnswerKey?.[q] || ""
                        )
                          .toUpperCase()
                          .trim();
                        const isSkipped = answer === "" || answer === "BLANK";
                        const isCorrect = answer === correctAnswer;

                        let className = "";
                        if (isValid) {
                          if (isSkipped) className = "detected-answer skipped";
                          else
                            className = isCorrect
                              ? "detected-answer correct"
                              : "detected-answer incorrect";
                        }

                        return (
                          <td key={q} className={className}>
                            {isValid ? (isSkipped ? "Skipped" : answer) : "N/A"}
                          </td>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
