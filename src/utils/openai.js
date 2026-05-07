export async function analyzeFoodText(apiKey, text) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            '食事のテキスト・メモからカロリーと栄養素を推定してください。必ずJSON形式で返してください。形式: {"items": [{"name": "食品名", "calories": 数値, "protein": 数値, "carbs": 数値, "fat": 数値, "amount": "量の説明"}]}。値はすべて数値（kcal/g）。不明な場合は一般的な値を使用。',
        },
        { role: 'user', content: text },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `APIエラー: ${res.status}`);
  }

  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

export async function analyzeFoodImage(apiKey, base64Image, mimeType = 'image/jpeg') {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            '画像（食事の写真またはレシート）からカロリーと栄養素を推定してください。必ずJSON形式で返してください。形式: {"items": [{"name": "食品名", "calories": 数値, "protein": 数値, "carbs": 数値, "fat": 数値, "amount": "量の説明"}]}。値はすべて数値（kcal/g）。レシートの場合は購入した食品を一覧化。',
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64Image}` },
            },
            { type: 'text', text: 'この画像の食事・食品のカロリーと栄養素を教えてください。' },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `APIエラー: ${res.status}`);
  }

  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
