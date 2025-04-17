import { InlineMath } from "react-katex";

export const renderFormattedText = (text) => {
  const parts = text.split(/(\$.*?\$)/g);
  return (
    <span>
      {parts.map((part, index) =>
        part.startsWith("$") && part.endsWith("$") ? (
          <InlineMath key={index}>{part.slice(1, -1)}</InlineMath> // Inline LaTeX
        ) : (
          part
        )
      )}
    </span>
  );
};

// import { InlineMath, BlockMath } from "react-katex";

// export const renderFormattedText = (text) => {
//   if (typeof text !== "string") return null;

//   // Split on both $$...$$ and $...$ while keeping the delimiters
//   const parts = text.split(/(\${2}.*?\${2}|\$.*?\$)/g);

//   return (
//     <span>
//       {parts.map((part, index) => {
//         if (!part) return null; // Skip empty strings

//         // Handle block math ($$...$$)
//         if (part.startsWith("$$") && part.endsWith("$$")) {
//           const content = part.slice(2, -2);
//           return <BlockMath key={index} math={content} />;
//         }

//         // Handle inline math ($...$)
//         if (part.startsWith("$") && part.endsWith("$")) {
//           const content = part.slice(1, -1);
//           return <InlineMath key={index} math={content} />;
//         }

//         // Return plain text for non-math content
//         return part;
//       })}
//     </span>
//   );
// };
