import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

async function callOpenAI(messages) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY が設定されていません');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      response_format: { type: 'json_object' },
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI APIエラー: ${res.status}`);
  }

  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

const SYSTEM_PROMPT = `あなたは食事のカロリー・栄養素を正確に返す専門家です。

【重要ルール】
1. マクドナルド、モスバーガー、ロッテリア、バーガーキング、吉野家、すき家、松屋、なか卯、サイゼリヤ、ガスト、デニーズ、ジョナサン、CoCo壱番屋、餃子の王将、大戸屋、やよい軒、スターバックス、ドトール、コメダ珈琲、セブン-イレブン、ローソン、ファミリーマート、ミニストップ などの有名チェーン店のメニューが含まれている場合は、そのチェーン店の公式カロリー情報（学習データ）を使って正確な値を返してください。
2. チェーン店のメニューが特定できた場合、calories・protein・carbs・fatを推定ではなく公式値で返してください。
3. チェーン店か不明な場合や一般的な食事の場合は、標準的な栄養データから推定してください。
4. レシートや画像にチェーン店名・ロゴが写っている場合は必ず検出してください。
5. 必ずJSON形式のみで返してください。説明文は不要です。

出力形式:
{"items": [{"name": "食品名（チェーン店名を含める 例: マクドナルド ビッグマック）", "calories": 数値, "protein": 数値, "carbs": 数値, "fat": 数値, "amount": "量の説明"}]}

値はすべて数値（kcal / g）。`;

const IMAGE_USER_PROMPT = `この画像を分析してください。
- レシートの場合: 店名・購入した商品名を読み取り、各商品のカロリーと栄養素を返してください。
- 食事の写真の場合: 写っている食べ物を識別し、カロリーと栄養素を推定してください。
- チェーン店のロゴや店名が見えた場合は必ず検出し、そのチェーンの公式カロリー情報を使ってください。`;

router.post('/text', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'テキストが必要です' });
  try {
    const result = await callOpenAI([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `以下の食事情報のカロリーと栄養素を返してください。チェーン店名が含まれている場合はその公式カロリーを使ってください。\n\n${text}` },
    ]);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/image', async (req, res) => {
  const { base64, mimeType } = req.body;
  if (!base64) return res.status(400).json({ error: '画像データが必要です' });
  try {
    const result = await callOpenAI([
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType || 'image/jpeg'};base64,${base64}` } },
          { type: 'text', text: IMAGE_USER_PROMPT },
        ],
      },
    ]);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
