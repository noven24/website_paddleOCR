import axios from 'axios';

// URL public dari Hugging Face Space Anda
const API_URL = 'https://noven241-visionary-backend-ocr.hf.space/ocr';

export const extractTextFromImageReal = async (file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await axios.post(API_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error saat menghubungi API backend:', error);
    throw error;
  }
};
