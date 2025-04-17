import "./QuestionPage.scss";
import { useState, useEffect, useRef } from "react";
import "katex/dist/katex.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import QRCode from "react-qr-code";
import ExcelJS from "exceljs";
//functions
import { renderFormattedText } from "../../components/utils/function/formattedText.jsx";
import { handlePrint } from "../../components/utils/function/handlePrint.jsx";
import { handleSave } from "../../components/utils/function/saveToDatabase.jsx";

function QuestionPage() {
  const [formData, setFormData] = useState({
    id: null,
    question: "",
    A: "",
    B: "",
    C: "",
    D: "",
    image: null,
    MCA1: "",
    MCA2: "",
    MCA3: "",
    correctAnswer: "",
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [selectedOption, setSelectedOption] = useState("SingleAnswer");
  const [allQuestionData, setAllQuestionData] = useState([]);
  const [allSetData, setAllSetData] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef();
  const submitButtonRef = useRef();

  //store correctAnswer in an array
  const [correctAnswerArray, setCorrectAnswerArray] = useState([]);

  useEffect(() => {
    const answers = allQuestionData.map((q) => q.correctAnswer);
    setCorrectAnswerArray(answers);
  }, [allQuestionData]);

  const handlePrintAndStore = async () => {
    const correctAnswersObject = correctAnswerArray.reduce(
      (acc, curr, index) => ({ ...acc, [`Q${index + 1}`]: curr }),
      {}
    );
    const newEntry = {
      qrCode: currentNumber,
      correctAnswerArray: correctAnswersObject,
    };
    setAllSetData((prev) => [...prev, newEntry]);

    // Show progress popup
    setIsPrinting(true);
    setProgress(0);

    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressIntervalRef.current);
          setTimeout(() => setIsPrinting(false), 500);
          return 100;
        }
        return Math.min(prev + 2, 100);
      });
    }, 0);

    await handlePrint();
    await handleClick();
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Question Sets");

    // Add headers
    worksheet.columns = [
      { header: "qrCode", key: "qrCode", width: 15 },
      ...Object.keys(allSetData[0]?.correctAnswerArray || {}).map((q) => ({
        header: q,
        key: q,
        width: 10,
      })),
    ];

    // Add data rows
    allSetData.forEach((set) => {
      worksheet.addRow({
        qrCode: set.qrCode,
        ...set.correctAnswerArray,
      });
    });

    // Write to buffer and create download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "question_sets.xlsx";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Shuffle function
  const shuffleQuestions = async () => {
    // Process each question to shuffle options and correctAnswer
    const processedQuestions = allQuestionData.map((question) => {
      const options = [
        { label: "A", value: question.A },
        { label: "B", value: question.B },
        { label: "C", value: question.C },
        { label: "D", value: question.D },
      ];

      // Shuffle options
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }

      // Create new question with shuffled options
      const shuffledQuestion = {
        ...question,
        A: options[0].value,
        B: options[1].value,
        C: options[2].value,
        D: options[3].value,
      };

      // Find original correct value
      const originalCorrectLabel = question.correctAnswer;
      const originalValue = question[originalCorrectLabel];

      // Find new correct label
      const correctIndex = options.findIndex(
        (opt) => opt.value === originalValue
      );
      if (correctIndex === -1) {
        console.error("Correct answer not found in shuffled options");
        return shuffledQuestion;
      }
      const newCorrectAnswer = ["A", "B", "C", "D"][correctIndex];
      shuffledQuestion.correctAnswer = newCorrectAnswer;

      return shuffledQuestion;
    });

    // Now shuffle the order of the processed questions
    const shuffledQuestions = [...processedQuestions];
    for (let i = shuffledQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledQuestions[i], shuffledQuestions[j]] = [
        shuffledQuestions[j],
        shuffledQuestions[i],
      ];
    }

    setAllQuestionData(shuffledQuestions);
    generateUniqueRandomNumber();
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          image: reader.result, // Store as data URL
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Modified handleSubmit
  const handleSubmit = (e) => {
    e.preventDefault();
    let updatedQuestions;

    if (editingIndex !== null) {
      // Update existing question
      updatedQuestions = allQuestionData.map((item, index) =>
        index === editingIndex ? { ...formData } : item
      );
      setEditingIndex(null);
    } else {
      // Add new question with unique ID
      const newQuestion = { ...formData, id: Date.now() };
      updatedQuestions = [...allQuestionData, newQuestion];
    }

    setAllQuestionData(updatedQuestions);
  };

  // Modified handleEdit
  const handleEdit = (index) => {
    setFormData(allQuestionData[index]);
    setEditingIndex(index);
  };

  const confirmDelete = (index) => {
    setDeleteIndex(index);
  };

  // Modified handleRemove
  const handleRemove = () => {
    if (deleteIndex !== null) {
      const updatedQuestions = allQuestionData.filter(
        (_, i) => i !== deleteIndex
      );
      setAllQuestionData(updatedQuestions);
      setDeleteIndex(null);
    }
  };

  const handleToggle = (event) => {
    setSelectedOption(event.target.value);
  };

  //radom number generator
  const [uniqueNumbers, setUniqueNumbers] = useState(new Set());
  const [currentNumber, setCurrentNumber] = useState(0); // Initialize to 0 to avoid null

  const generateUniqueRandomNumber = () => {
    if (uniqueNumbers.size >= 90000) {
      alert("All unique 5-digit numbers have been generated!");
      return;
    }
    let newNumber;
    do {
      newNumber = Math.floor(10000 + Math.random() * 90000); // Generates a random 5-digit number (10000 - 99999)
    } while (uniqueNumbers.has(newNumber));
    // Use functional update for both state changes to ensure correct order and re-render
    setUniqueNumbers((prev) => {
      const updatedSet = new Set(prev);
      updatedSet.add(newNumber);
      return updatedSet;
    });
    setCurrentNumber(newNumber); // Update the current number to generate a new QR code
  };

  //save to database
  // const handleSave = async () => {
  //   const uploadImageToCloudinary = async (imageData) => {
  //     try {
  //       // Get credentials from your server
  //       const { signature, timestamp, api_key, cloud_name } = (
  //         await axios.get("http://localhost:8080/generate-cloudinary-signature")
  //       ).data;
  //       console.log(api_key);
  //       const formData = new FormData();
  //       formData.append("file", imageData);
  //       formData.append("api_key", api_key); // Use server-provided API key
  //       formData.append("timestamp", timestamp);
  //       formData.append("signature", signature);

  //       const response = await axios.post(
  //         `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
  //         formData
  //       );

  //       return response.data.secure_url;
  //     } catch (error) {
  //       console.error("Upload error:", error.response?.data || error);
  //       throw new Error("Upload failed");
  //     }
  //   };

  //   try {
  //     // Process images and create new array with Cloudinary URLs
  //     const processedQuestions = await Promise.all(
  //       allQuestionData.map(async (question) => {
  //         // Skip if no image or already has URL
  //         if (!question.image) return question;
  //         if (
  //           typeof question.image === "string" &&
  //           question.image.startsWith("http")
  //         )
  //           return question;

  //         // Convert data URL to blob for Cloudinary upload
  //         const blob = await fetch(question.image).then((r) => r.blob());
  //         const imageUrl = await uploadImageToCloudinary(blob);

  //         return { ...question, image: imageUrl };
  //       })
  //     );
  //     // Save to backend
  //     await axios.post("http://localhost:8080/api/save", {
  //       allQuestionData: processedQuestions,
  //       currentNumber,
  //     });
  //     alert("Data saved successfully!");
  //   } catch (error) {
  //     console.error("Save failed:", error);
  //     alert(error.message || "Error saving data");
  //   }
  // };

  const handleClick = async () => {
    const result = await handleSave(allQuestionData, currentNumber);
    if (result.success) {
      alert(result.message);
    } else {
      alert(result.message);
    }
  };

  return (
    <>
      <div className="buttons">
        <button className="shuffle-button" onClick={shuffleQuestions}>
          <FontAwesomeIcon className="icon" icon="fa-solid fa-shuffle" /> <br />
          Shuffle
        </button>
        <button className="print-button" onClick={handlePrintAndStore}>
          <FontAwesomeIcon className="icon" icon="fa-solid fa-print" /> <br />
          Print
        </button>
        <button className="export-button" onClick={exportToExcel}>
          <FontAwesomeIcon className="icon" icon="fa-solid fa-file-excel" />{" "}
          <br />
          Export Data
        </button>
      </div>

      <div className="home-page">
        <div className="left">
          <div className="first-page question-page">
            <div className="omr-sheet">
              <div className="qr-code-container">
                <QRCode
                  className="qr-code"
                  value={JSON.stringify(currentNumber)}
                />{" "}
                <br />
                {currentNumber}
              </div>
            </div>
            <div className="main-content">
              {allQuestionData.map((q, index) => (
                <div
                  className={`question-body ${
                    editingIndex === index ? "highlight" : ""
                  }`}
                  key={q.id}
                >
                  <div className="individual-question">
                    {index + 1}. {renderFormattedText(q.question)}{" "}
                  </div>

                  {q.image && (
                    <div className="question-image-container">
                      <img
                        src={q.image}
                        alt="Uploaded"
                        className="question-img"
                      />
                    </div>
                  )}

                  {q.MCA1 && (
                    <div className="multiple-choice-answer">
                      <div>i.&nbsp; {q.MCA1}</div>
                      <div>ii.&nbsp; {q.MCA2}</div>
                      <div>iii.&nbsp; {q.MCA3}</div>
                      <div>নিচের কোনটি সঠিক?</div>
                    </div>
                  )}
                  <div className="options">
                    <div className="option">A. {renderFormattedText(q.A)}</div>
                    <div className="option">B. {renderFormattedText(q.B)}</div>
                    <div className="option">C. {renderFormattedText(q.C)}</div>
                    <div className="option">D. {renderFormattedText(q.D)}</div>
                  </div>
                  <button
                    className="edit-button"
                    onClick={() => handleEdit(index)}
                  >
                    <FontAwesomeIcon icon="fa-solid fa-pen-to-square" />
                  </button>
                  <button
                    className="remove-button"
                    onClick={() => confirmDelete(index)}
                  >
                    <FontAwesomeIcon icon="fa-solid fa-trash" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="right">
          <div className="writing-tools">
            <form onSubmit={handleSubmit}>
              <div className="radio-btns">
                <label>
                  <input
                    type="radio"
                    name="toggle"
                    value="SingleAnswer"
                    checked={selectedOption === "SingleAnswer"}
                    onChange={handleToggle}
                  />
                  Single Answer Question
                </label>
                <label>
                  <input
                    type="radio"
                    name="toggle"
                    value="multipleAnswer"
                    checked={selectedOption === "multipleAnswer"}
                    onChange={handleToggle}
                  />
                  Multiple Answer Question
                </label>
              </div>

              <textarea
                name="question"
                className="question"
                value={formData.question}
                onChange={handleChange}
                placeholder="Enter question (use $...$ for LaTeX)"
                required
              />
              <div
                className={`content ${
                  selectedOption === "multipleAnswer"
                    ? "extendedFormInput"
                    : "disabled"
                }`}
              >
                <textarea
                  name="MCA1"
                  value={formData.MCA1}
                  onChange={handleChange}
                  placeholder="i. "
                />
                <textarea
                  name="MCA2"
                  value={formData.MCA2}
                  onChange={handleChange}
                  placeholder="ii. "
                />
                <textarea
                  name="MCA3"
                  value={formData.MCA3}
                  onChange={handleChange}
                  placeholder="iii. "
                />
              </div>
              <textarea
                name="A"
                value={formData.A}
                onChange={handleChange}
                placeholder="Option A"
                required
              />
              <textarea
                name="B"
                value={formData.B}
                onChange={handleChange}
                placeholder="Option B"
                required
              />
              <textarea
                name="C"
                value={formData.C}
                onChange={handleChange}
                placeholder="Option C"
                required
              />
              <textarea
                name="D"
                value={formData.D}
                onChange={handleChange}
                placeholder="Option D"
                required
              />
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleImageChange}
                className="file-input"
              />
              <select
                name="correctAnswer"
                value={formData.correctAnswer || ""}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  Select Answer
                </option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
              <button ref={submitButtonRef} type="submit">
                {editingIndex !== null ? "UPDATE" : "SUBMIT"}
              </button>
            </form>
          </div>

          <div className="qr-code-container">
            <div className="qr-code-1">
              <QRCode
                className="qr-code"
                value={JSON.stringify(currentNumber)}
              />
              <br />
            </div>
            <div className="qr-code-2">
              <QRCode
                className="qr-code"
                value={JSON.stringify(correctAnswerArray)}
              />{" "}
              <br />
              {/* <pre>{correctAnswerArray}</pre> */}
            </div>
          </div>

          <div className="correct-answer">
            {correctAnswerArray.map((el, i) => (
              <div key={i}>
                <b> Q{i + 1}: </b>
                {el}
              </div>
            ))}
          </div>
        </div>
        {deleteIndex !== null && (
          <div className="popup">
            <div className="popup-content">
              <FontAwesomeIcon
                className="icon"
                icon="fa-solid fa-trash-can"
                bounce
              />
              <p>Are you sure you want to delete this question?</p>
              <button className="confirm-delete" onClick={handleRemove}>
                Yes
              </button>
              <button
                className="cancel-delete"
                onClick={() => setDeleteIndex(null)}
              >
                No
              </button>
            </div>
          </div>
        )}
        {isPrinting && (
          <div className="print-popup">
            <div className="popup-content">
              <div className="progress-container">
                <FontAwesomeIcon
                  className="icon"
                  icon="fa-solid fa-spinner"
                  spinPulse
                />
                <h3>
                  Downloading Set: <b>{currentNumber}</b>
                </h3>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="progress-text">{progress}%</div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="all-question-data">
        <h3>All Question Data:</h3>
        <pre>{JSON.stringify(allQuestionData, null, 2)}</pre>
      </div>
      <div>
        <h3>correctAnswer</h3>
        <pre>
          {JSON.stringify(
            allQuestionData.map((q) => q.correctAnswer),
            null,
            2
          )}
        </pre>
      </div>
      {/* <button onClick={handleClick}>Save To DB</button> */}
    </>
  );
}

export default QuestionPage;
