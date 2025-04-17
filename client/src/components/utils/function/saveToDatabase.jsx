// saveHandler.js
import axios from "axios";

export const handleSave = async (allQuestionData, currentNumber) => {
  const uploadImageToCloudinary = async (imageData) => {
    try {
      const { signature, timestamp, api_key, cloud_name } = (
        await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/generate-cloudinary-signature`
        )
      ).data;

      const formData = new FormData();
      formData.append("file", imageData);
      formData.append("api_key", api_key);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
        formData
      );

      return response.data.secure_url;
    } catch (error) {
      console.error("Upload error:", error.response?.data || error);
      throw new Error("Upload failed");
    }
  };

  try {
    const processedQuestions = await Promise.all(
      allQuestionData.map(async (question) => {
        if (!question.image) return question;
        if (
          typeof question.image === "string" &&
          question.image.startsWith("http")
        )
          return question;

        const blob = await fetch(question.image).then((r) => r.blob());
        const imageUrl = await uploadImageToCloudinary(blob);
        return { ...question, image: imageUrl };
      })
    );

    await axios.post("http://localhost:8080/api/save", {
      allQuestionData: processedQuestions,
      currentNumber,
    });

    return { success: true, message: "Data saved successfully!" };
  } catch (error) {
    console.error("Save failed:", error);
    return { success: false, message: error.message || "Error saving data" };
  }
};
