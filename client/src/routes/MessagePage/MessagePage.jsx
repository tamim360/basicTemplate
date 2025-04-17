import { useState, useMemo } from "react";
import axios from "axios";
import ExcelJS from "exceljs";
import "./MessagePage.scss";

function MessagePage() {
  const [marksData, setMarksData] = useState([]);
  const [studentData, setStudentData] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [sendingStatus, setSendingStatus] = useState({});
  const [progress, setProgress] = useState(0);
  const API_KEY = "Ey585CjhUBHNsa7YJ38GuguV2mHgsN8Kn2RuDxMd";

  // Merge data and calculate rankings
  const mergedData = useMemo(() => {
    if (!marksData.length || !studentData.length) return [];

    const students = new Map(studentData.map((s) => [s.roll, s]));
    const sorted = [...marksData].sort(
      (a, b) => b.marks - a.marks || a.roll.localeCompare(b.roll)
    );

    // Calculate positions with ties
    const rankedStudents = [];
    let currentRank = 1;
    let previousMarks = null;
    let skipCount = 0;

    sorted.forEach((student, index) => {
      if (student.marks !== previousMarks) {
        currentRank = index + 1;
        previousMarks = student.marks;
        skipCount = 0;
      } else {
        skipCount++;
      }

      rankedStudents.push({
        ...student,
        position: currentRank,
        actualPosition: currentRank + skipCount,
      });
    });

    const positionMap = new Map(
      rankedStudents.map((s) => [s.roll, s.position])
    );

    return sorted.map((item) => {
      const student = students.get(item.roll) || {};
      return {
        ...item,
        ...student,
        position: positionMap.get(item.roll) || 0,
        highestMark: sorted[0]?.marks || 0,
      };
    });
  }, [marksData, studentData]);

  const normalizeHeaders = (headers) => {
    return headers.map((header) => String(header).trim().toLowerCase());
  };

  // const handleFileUpload = (setData) => async (e) => {
  //   const file = e.target.files[0];
  //   const reader = new FileReader();

  //   reader.onload = async (e) => {
  //     try {
  //       const buffer = e.target.result;
  //       const workbook = new ExcelJS.Workbook();
  //       await workbook.xlsx.load(buffer);

  //       const worksheet = workbook.worksheets[0];
  //       const jsonData = [];

  //       // Get and normalize headers
  //       const headerRow = worksheet.getRow(1);
  //       const headers = normalizeHeaders(headerRow.values.slice(1));

  //       worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
  //         if (rowNumber === 1) return;

  //         const rowData = {};
  //         row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
  //           const header = headers[colNumber - 1];
  //           rowData[header] = cell.value;
  //         });

  //         jsonData.push(rowData);
  //       });

  //       setData(jsonData);
  //     } catch (error) {
  //       console.error("Error processing Excel file:", error);
  //       alert("Error processing Excel file");
  //     }
  //   };

  //   reader.readAsArrayBuffer(file);
  // };

  // Rest of the component remains the same except for the following changes in JSX:

  const handleFileUpload =
    ({ setData, requiredColumns }) =>
    async (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const buffer = e.target.result;
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(buffer);

          const worksheet = workbook.worksheets[0];
          const jsonData = [];

          // Validate worksheet has at least one row
          if (worksheet.rowCount < 1) {
            throw new Error("Excel file is empty");
          }

          // Get and normalize headers
          const headerRow = worksheet.getRow(1);
          const headers = normalizeHeaders(headerRow.values.slice(1));

          // Validate required columns
          const normalizedRequired = requiredColumns.map((col) =>
            col.trim().toLowerCase()
          );
          const missingColumns = normalizedRequired.filter(
            (col) => !headers.includes(col)
          );

          if (missingColumns.length > 0) {
            throw new Error(
              `Missing required columns: ${missingColumns.join(", ")}`
            );
          }

          // Process rows
          worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber === 1) return;

            const rowData = {};
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
              const header = headers[colNumber - 1];
              rowData[header] = cell.value;
            });

            // Validate required fields in rows
            const missingFields = normalizedRequired.filter(
              (col) => !(col in rowData) || rowData[col] === undefined
            );
            if (missingFields.length > 0) {
              throw new Error(
                `Row ${rowNumber}: Missing values for: ${missingFields.join(
                  ", "
                )}`
              );
            }

            jsonData.push(rowData);
          });

          setData(jsonData);
        } catch (error) {
          console.error("Error processing Excel file:", error);
          alert(`Error: ${error.message}`);
          setData([]);
        }
      };

      reader.readAsArrayBuffer(file);
    };

  const toggleSelectAll = () => {
    const allRolls = new Set(mergedData.map((item) => item.roll));
    setSelectedStudents(allRolls);
  };

  const toggleUnselectAll = () => {
    setSelectedStudents(new Set());
  };

  const toggleSingleSelect = (roll) => {
    const newSelected = new Set(selectedStudents);
    newSelected.has(roll) ? newSelected.delete(roll) : newSelected.add(roll);
    setSelectedStudents(newSelected);
  };

  const sendMessages = async () => {
    const rolls = Array.from(selectedStudents);
    const total = rolls.length;
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < rolls.length; i++) {
      const roll = rolls[i];
      const student = mergedData.find((s) => s.roll === roll);

      if (!student?.contact) {
        failedCount++;
        continue;
      }

      const message = `Dear ${student.name}, Roll: ${student.roll}, Marks: ${student.marks}, Position: ${student.position}, Highest: ${student.highestMark}`;

      try {
        setSendingStatus((prev) => ({ ...prev, [roll]: "sending" }));
        await axios.post(
          `https://api.sms.net.bd/sendsms?api_key=${API_KEY}&msg=${encodeURIComponent(
            message
          )}&to=${student.contact}`
        );
        setSendingStatus((prev) => ({ ...prev, [roll]: "success" }));
        successCount++;
      } catch (error) {
        setSendingStatus((prev) => ({ ...prev, [roll]: "failed" }));
        failedCount++;
        console.log(error);
      }
      setProgress(((i + 1) / total) * 100);
    }

    alert(`Sent: ${successCount} success, ${failedCount} failed`);
    setProgress(0);
  };

  return (
    <div className="message-page">
      {/* <div className="file-upload-section">
        <div>
          <h3>Upload Marks File</h3>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload(setMarksData)}
          />
        </div>
        <div>
          <h3>Upload Student Data File</h3>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload(setStudentData)}
          />
        </div>
      </div> */}

      <h1>Student Results Messenger</h1>

      <div className="file-upload-section">
        <div>
          <h3>Upload Marks File</h3>
          <input
            type="file"
            accept=".xlsx,.xls"
            className="file-input"
            onChange={handleFileUpload({
              setData: setMarksData,
              requiredColumns: ["roll", "marks"],
            })}
          />
          <small>Required columns: roll, marks</small>
        </div>
        <div>
          <h3>Upload Student Data File</h3>
          <input
            type="file"
            accept=".xlsx,.xls"
            className="file-input"
            onChange={handleFileUpload({
              setData: setStudentData,
              requiredColumns: ["roll", "name", "contact"],
            })}
          />
          <small>Required columns: roll, name, contact</small>
        </div>
      </div>

      {/* Display raw data previews */}
      <div className="data-previews">
        {marksData.length > 0 && (
          <div className="data-preview">
            <h3>Marks Data Preview</h3>
            <table>
              <thead>
                <tr>
                  {Object.keys(marksData[0]).map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {marksData.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, j) => (
                      <td key={j}>{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {studentData.length > 0 && (
          <div className="data-preview">
            <h3>Student Data Preview</h3>
            <table>
              <thead>
                <tr>
                  {Object.keys(studentData[0]).map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {studentData.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, j) => (
                      <td key={j}>{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {mergedData.length > 0 && (
        <>
          <div className="controls">
            <button onClick={toggleSelectAll} className="select-all">
              Select All ({mergedData.length})
            </button>
            <button onClick={toggleUnselectAll} className="unselect-all">
              Unselect All
            </button>
            <button
              onClick={sendMessages}
              disabled={selectedStudents.size === 0}
            >
              Send ({selectedStudents.size})
            </button>
          </div>

          <div className="progress-bar">
            <div className="progress" style={{ width: `${progress}%` }}></div>
          </div>

          <div className="messages-list">
            {mergedData.map((student) => (
              <div key={student.roll} className="message-card">
                <label>
                  <input
                    type="checkbox"
                    checked={selectedStudents.has(student.roll)}
                    onChange={() => toggleSingleSelect(student.roll)}
                  />
                  <div className="message-content">
                    <p>Roll: {student.roll}</p>
                    <p>Name: {student.name}</p>
                    <p>Marks: {student.marks}</p>
                    <p>Position: {student.position}</p>
                    <p>Contact: {student.contact}</p>
                  </div>
                </label>
                <div className={`status ${sendingStatus[student.roll] || ""}`}>
                  {sendingStatus[student.roll] || "Pending"}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default MessagePage;
