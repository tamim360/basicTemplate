import React from "react";
import "./Grid.scss";

const items = [
  "Item 1",
  "Item 2",
  "Item 3",
  "Item 4",
  "Item 5",
  "Item 6",
  "Item 7",
  "Item 8",
];

const Grid = () => {
  return (
    <div className="grid-container">
      {items.map((item, index) => (
        <div className="grid-item" key={index}>
          {item}
        </div>
      ))}
    </div>
  );
};

export default Grid;
