import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8001",
});

export const predictIPC = async (text) => {
  const response = await API.post("/predict", {
    text: text,
  });
  return response.data;
};

export const getHistory = async () => {
  const response = await API.get("/history");
  return response.data;
};

export const transcribeAudio = async (audioBlob) => {
  const formData = new FormData();
  // We specify filename with .wav extension so backend handles it correctly
  formData.append("file", audioBlob, "recording.wav");

  const response = await API.post("/speech-to-text", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data.transcript;
};

export const textToSpeech = async (text, lang = "en") => {
  const response = await API.post(
    "/text-to-speech",
    { text, lang },
    { responseType: "blob" }
  );
  // Create local object URL for the MP3 blob
  return URL.createObjectURL(response.data);
};