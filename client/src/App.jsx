import "./App.scss";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { library } from "@fortawesome/fontawesome-svg-core";

import {
  faArrowRotateRight,
  faArrowUpFromBracket,
  faChalkboardTeacher,
  faEnvelope,
  faFileExcel,
  faPenToSquare,
  faPrint,
  faShuffle,
  faSpinner,
  faTrash,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
// import Test from "./routes/RegisterPage/test.jsx";
import EvaluatePage from "./routes/EvaluatePage/Evaluate.jsx";
import QuestionPage from "./routes/QuestionPage/QuestionPage.jsx";
import IndexPage from "./routes/IndexPage/IndexPage.jsx";
import TestPage from "./routes/TestPage/TestPage.jsx";
import OMRTest from "./routes/omrTest/OMRTest.jsx";
import MessagePage from "./routes/MessagePage/MessagePage.jsx";

// import TextToEquation from "./routes/RegisterPage/test.jsx";

library.add(
  faPenToSquare,
  faTrash,
  faTrashCan,
  faPrint,
  faArrowRotateRight,
  faPenToSquare,
  faChalkboardTeacher,
  faArrowUpFromBracket,
  faEnvelope,
  faShuffle,
  faFileExcel,
  faSpinner
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/question" element={<QuestionPage />} />
        <Route path="/scan" element={<OMRTest />} />
        <Route path="/evaluate" element={<EvaluatePage />} />
        <Route path="/message" element={<MessagePage />} />
        <Route path="/test" element={<TestPage />} />
      </Routes>
    </Router>
  );
}

export default App;
