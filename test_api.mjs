import FormData from 'form-data';
import fs from 'fs';
import axios from 'axios';

async function testApi() {
  try {
    const form = new FormData();
    form.append('image', fs.createReadStream('./src/assets/hero.png'));

    console.log("Sending request to HF Spaces...");
    const response = await axios.post('https://noven241-visionary-backend-ocr.hf.space/ocr', form, {
      headers: form.getHeaders(),
    });

    console.log("Response:", JSON.stringify(response.data, null, 2));
  } catch (err) {
    if (err.response) {
      console.error("API Error Response:", err.response.data);
    } else {
      console.error("Error:", err.message);
    }
  }
}

testApi();
