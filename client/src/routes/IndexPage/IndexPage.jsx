import React from "react";
import "./IndexPage.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";

function IndexPage() {
  return (
    <div className="index-page">
      <div className="all-card-container">
        <Link to="/question">
          <div className="create-question card">
            <div className="icon">
              <FontAwesomeIcon icon="fa-solid fa-pen-to-square" />
            </div>
            <h3>Create Question Paper</h3>
          </div>
        </Link>

        <Link to="/scan">
          <div className="scan-omr card">
            <div className="icon">
              <FontAwesomeIcon icon="fa-solid fa-print" />
            </div>
            <h3>Scan OMR</h3>
          </div>
        </Link>

        <Link to="evaluate">
          <div className="evaluate card">
            <div className="icon">
              <FontAwesomeIcon icon="fa-solid fa-chalkboard-teacher" />
            </div>
            <h3>Evaluate Answer Sheet</h3>
          </div>
        </Link>

        <Link to="message">
          <div className="send-message card">
            <div className="icon">
              <FontAwesomeIcon icon="fa-solid fa-envelope" />
            </div>
            <h3>Send Message</h3>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default IndexPage;
