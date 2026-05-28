// Menggunakan ElevenLabs API
export const generateSpeechElevenLabs = async (text) => {
  try {
    const API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
    // Menggunakan Voice ID bebas (contoh: Adam)
    const VOICE_ID = 'pNInz6obpgDQGcFmaJcg'; 
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Error dari ElevenLabs: ${response.status} ${response.statusText}`);
    }

    // Mengubah data dari API menjadi suara (blob) sesuai permintaan
    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);
    
    // Dikembalikan dalam bentuk array agar kompatibel dengan pemutar di ResultArea.jsx
    return [audioUrl];
  } catch (error) {
    console.error('[ElevenLabs TTS Error]', error);
    throw new Error('Gagal memproses suara di ElevenLabs.');
  }
};
