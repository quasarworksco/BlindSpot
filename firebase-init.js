import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyB3PP_7rUEz0gGx27fR47W6ErC1sYkCEdc",
  authDomain: "blindspot-876a8.firebaseapp.com",
  projectId: "blindspot-876a8",
  storageBucket: "blindspot-876a8.firebasestorage.app",
  messagingSenderId: "192911566208",
  appId: "1:192911566208:web:de9a07a5d3c0b8a5d60d65"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const CLOUDINARY_CLOUD_NAME = "dwdnsyc9x";
export const CLOUDINARY_UPLOAD_PRESET = "blindspot";

export async function uploadImageToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData
  });
  if (!res.ok) throw new Error("Error al subir la imagen a Cloudinary");
  const data = await res.json();
  return data.secure_url;
}
