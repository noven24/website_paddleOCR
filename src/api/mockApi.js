export const extractTextFromImage = (file) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        status: "success",
        message: "Teks berhasil diekstrak",
        total_text: 2,
        data: [
          {
            text: "FRISIAN FLAG",
            confidence_score: 0.9852,
            box_coordinates: [
              [10, 20],
              [100, 20],
              [100, 50],
              [10, 50],
            ],
          },
          {
            text: "Susu Kental Manis",
            confidence_score: 0.9510,
            box_coordinates: [
              [15, 60],
              [120, 60],
              [120, 80],
              [15, 80],
            ],
          },
        ],
      });
    }, 2000); // 2 second delay to simulate inference
  });
};
