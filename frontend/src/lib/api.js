import axios from "axios";

// Determine the base URL dynamically based on the current hostname
const getBaseURL = () => {
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return "http://localhost:8001";
  }
  return "https://ai-legal-system-k3kz.onrender.com";
};

const API = axios.create({
  baseURL: getBaseURL(),
});

// Interceptor to add JWT token from localStorage to headers
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("als_auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- User Authentication API calls ---
export const login = async (email, password) => {
  const response = await API.post("/auth/login", { email, password });
  return response.data; // returns { token, user }
};

export const register = async (email, password, fullName) => {
  const response = await API.post("/auth/register", {
    email,
    password,
    full_name: fullName,
  });
  return response.data; // returns { token, user }
};

export const getMe = async () => {
  const response = await API.get("/auth/me");
  return response.data; // returns { email, full_name }
};

export const updateProfile = async (fullName, phoneNumber = "", address = "", currentPassword = null, newPassword = null) => {
  const payload = { 
    full_name: fullName,
    phone_number: phoneNumber,
    address: address
  };
  if (newPassword) {
    payload.current_password = currentPassword;
    payload.new_password = newPassword;
  }
  const response = await API.put("/auth/profile", payload);
  return response.data; // returns { token, user }
};

// --- FIR & Predict API calls ---
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
  return URL.createObjectURL(response.data);
};