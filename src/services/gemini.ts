import type { ApiCompareSupply } from './api';
import { getNullableString } from './api';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const GEMINI_MODEL = (import.meta.env.VITE_GEMINI_MODEL as string) || 'gemini-2.5-flash-lite';
const ENABLE_WEB_SEARCH = ((import.meta.env.VITE_GEMINI_WEB_SEARCH as string) || 'true').toLowerCase() !== 'false';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

type GeminiRole = 'user' | 'model';
type GeminiContent = { role: GeminiRole; parts: Array<{ text: string }> };
type GroundingChunk = { web?: { uri?: string; title?: string } };
type GeminiApiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    groundingMetadata?: { groundingChunks?: GroundingChunk[] };
    finishReason?: string;
  }>;
  error?: { message?: string };
};

const formatNullableNumber = (
  value: { Int32: number; Valid: boolean } | { Float64: number; Valid: boolean } | null | undefined,
): string => {
  if (!value?.Valid) return 'N/A';
  const numeric = 'Int32' in value ? value.Int32 : value.Float64;
  return numeric.toLocaleString('vi-VN');
};

function buildProductSummary(items: ApiCompareSupply[]): string {
  return items
    .map((item, idx) => {
      const name = getNullableString(item.tenVatTu2025) || 'Không rõ';
      const code = getNullableString(item.maThuVien) || '';
      const company = getNullableString(item.tenCongTy) || 'N/A';
      const unit = getNullableString(item.dvt) || '';
      const brand = getNullableString(item.hangSanXuat) || 'N/A';
      const country = getNullableString(item.nuocSanXuat) || 'N/A';
      const countryGroup = getNullableString(item.nhomNuoc) || 'N/A';
      const quality = getNullableString(item.chatLuong) || 'N/A';
      const tradeName = getNullableString(item.tenThuongMai) || 'N/A';
      const spec1 = getNullableString(item.thongSoKyThuat1) || '';
      const spec2 = getNullableString(item.thongSoKyThuat2) || '';
      const spec3 = getNullableString(item.thongSoKyThuat3) || '';
      const spec4 = getNullableString(item.thongSoKyThuat4) || '';
      const spec5 = getNullableString(item.thongSoKyThuat5) || '';
      const specBid2025 = getNullableString(item.thongSoMoiThau2025) || '';
      const specAdj2026 = getNullableString(item.thongSoHieuChinh2026) || '';
      const price2025 = formatNullableNumber(item.donGiaTrungThau2025);
      const price2026 = formatNullableNumber(item.donGiaDeXuat2026);
      const lowestBid = formatNullableNumber(item.ketQuaTrungThauThapNhat);
      const lowestBidInfo = getNullableString(item.thoiGianDangTaiThapNhat) || '';
      const highestBid = formatNullableNumber(item.ketQuaTrungThauCaoNhat);
      const highestBidInfo = getNullableString(item.thoiGianDangTaiCaoNhat) || '';
      const qty12m = formatNullableNumber(item.soLuongSuDung12Thang);
      const qtyBid2025 = formatNullableNumber(item.soLuongTrungThau2025BoSung);

      return `--- SẢN PHẨM ${idx + 1} ---
Mã thư viện: ${code}
Tên vật tư: ${name}
Tên thương mại: ${tradeName}
Công ty: ${company}
ĐVT: ${unit}
Hãng sản xuất: ${brand}
Nước sản xuất: ${country}
Nhóm nước: ${countryGroup}
Chất lượng: ${quality}
Thông số mời thầu 2025: ${specBid2025}
Thông số hiệu chỉnh 2026: ${specAdj2026}
TSKТ 1: ${spec1}
TSKТ 2: ${spec2}
TSKТ 3: ${spec3}
TSKТ 4: ${spec4}
TSKТ 5: ${spec5}
SL sử dụng 12 tháng: ${qty12m}
SL trúng thầu 2025 + bổ sung: ${qtyBid2025}
Đơn giá trúng thầu 2025: ${price2025}
Đơn giá đề xuất 2026: ${price2026}
KQ trúng thầu THẤP NHẤT: ${lowestBid} (${lowestBidInfo})
KQ trúng thầu CAO NHẤT: ${highestBid} (${highestBidInfo})`;
    })
    .join('\n\n');
}

const SYSTEM_PROMPT = `Bạn là chuyên gia tư vấn đấu thầu vật tư y tế của BV Trung ương Quân đội 108 (Khoa Trang bị).
Nhiệm vụ: so sánh các sản phẩm dựa trên dữ liệu cung cấp và đưa ra khuyến nghị thực dụng cho năm 2026.

Quy tắc bắt buộc:
- Trả lời bằng tiếng Việt, dùng Markdown, ngắn gọn và dễ quét.
- Không viết lời chào dài dòng, đi thẳng vào nội dung.
- Không lặp lại toàn bộ dữ liệu đầu vào.
- Chỉ nêu nhận định có cơ sở từ dữ liệu; nếu thiếu dữ liệu thì ghi rõ "chưa đủ dữ liệu".
- Ưu tiên dữ liệu nội bộ trước, chỉ dùng thông tin web để bổ sung khi cần.
- Mặc định tối đa khoảng 350 từ, trừ khi người dùng yêu cầu phân tích sâu.

Luôn trả lời theo đúng khung sau:
## Kết luận nhanh
- 3-5 bullet quan trọng nhất.

## Bảng so sánh chính
| Tiêu chí | SP nổi bật | Nhận xét |
|---|---|---|
| Giá | ... | ... |
| Kỹ thuật/chất lượng | ... | ... |
| Xuất xứ | ... | ... |
| Hiệu quả kinh tế | ... | ... |

## Khuyến nghị đấu thầu 2026
1. Khuyến nghị chính.
2. Điều kiện nên chọn phương án thay thế (nếu có).

## Rủi ro cần kiểm tra
- 3-5 rủi ro ngắn gọn cần xác minh trước khi chốt thầu.`;
let chatHistory: GeminiContent[] = [];
let lastItemsKey = '';

const INITIAL_MODEL_ACK = 'Tôi đã nhận được dữ liệu so sánh vật tư. Hãy đặt câu hỏi hoặc yêu cầu tôi phân tích.';

const trimHistory = () => {
  const seedMessages = 2;
  const maxTurns = 8;
  const maxMessages = seedMessages + maxTurns * 2;
  if (chatHistory.length <= maxMessages) return;

  const head = chatHistory.slice(0, seedMessages);
  const tail = chatHistory.slice(chatHistory.length - (maxMessages - seedMessages));
  chatHistory = [...head, ...tail];
};

const initHistory = (itemsKey: string, comparedItems: ApiCompareSupply[]) => {
  const productData = buildProductSummary(comparedItems);
  const initialContext = `${SYSTEM_PROMPT}\n\n=== DỮ LIỆU SO SÁNH VẬT TƯ ===\n${productData}\n=== HẾT DỮ LIỆU ===`;
  chatHistory = [
    { role: 'user', parts: [{ text: initialContext }] },
    { role: 'model', parts: [{ text: INITIAL_MODEL_ACK }] },
  ];
  lastItemsKey = itemsKey;
};

const extractAnswerText = (data: GeminiApiResponse): string => {
  const parts = data.candidates?.[0]?.content?.parts || [];
  return parts
    .map((part) => part.text || '')
    .filter(Boolean)
    .join('\n')
    .trim();
};

const shouldContinueResponse = (data: GeminiApiResponse): boolean => {
  const reason = (data.candidates?.[0]?.finishReason || '').toUpperCase();
  return reason === 'MAX_TOKENS' || reason === 'LENGTH';
};

const buildSourcesMarkdown = (data: GeminiApiResponse): string => {
  const chunks = data.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const dedup = new Map<string, string>();

  for (const chunk of chunks) {
    const uri = chunk.web?.uri?.trim();
    if (!uri || dedup.has(uri)) continue;
    const title = chunk.web?.title?.trim() || uri;
    dedup.set(uri, title);
  }

  if (dedup.size === 0) return '';
  const lines = Array.from(dedup.entries())
    .slice(0, 5)
    .map(([uri, title], idx) => `${idx + 1}. [${title}](${uri})`);

  return `\n\n## Nguồn web tham khảo\n${lines.join('\n')}`;
};

const callGemini = async (contents: GeminiContent[]): Promise<GeminiApiResponse> => {
  const payload: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 2200,
    },
  };

  if (ENABLE_WEB_SEARCH) {
    payload.tools = [{ google_search: {} }];
  }

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as GeminiApiResponse;
  if (!response.ok) {
    throw new Error(data.error?.message || `Gemini API lỗi (${response.status})`);
  }
  return data;
};

export async function askGeminiCompare(
  comparedItems: ApiCompareSupply[],
  question: string,
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('Chưa cấu hình VITE_GEMINI_API_KEY trong file .env');
  }

  const itemsKey = comparedItems.map((i) => getNullableString(i.maThuVien)).join(',');
  if (chatHistory.length === 0 || itemsKey !== lastItemsKey) {
    initHistory(itemsKey, comparedItems);
  }

  const today = new Date().toISOString().slice(0, 10);
  const userTurn: GeminiContent = {
    role: 'user',
    parts: [{ text: `Ngày hiện tại: ${today}\n\nYêu cầu người dùng:\n${question}` }],
  };
  chatHistory.push(userTurn);

  try {
    const firstData = await callGemini(chatHistory);
    const firstAnswer = extractAnswerText(firstData);
    if (!firstAnswer) {
      throw new Error('Gemini không trả về nội dung phản hồi.');
    }

    let combinedAnswer = firstAnswer;
    let combinedSources = buildSourcesMarkdown(firstData);

    if (shouldContinueResponse(firstData)) {
      const continueData = await callGemini([
        ...chatHistory,
        { role: 'model', parts: [{ text: firstAnswer }] },
        {
          role: 'user',
          parts: [{
            text: 'Phần trả lời trước đang bị dở. Hãy tiếp tục đúng chỗ đang dở, không lặp lại nội dung cũ, hoàn thiện đầy đủ các mục còn thiếu và giữ định dạng Markdown.',
          }],
        },
      ]);

      const continuedAnswer = extractAnswerText(continueData);
      if (continuedAnswer) {
        combinedAnswer = `${combinedAnswer}\n${continuedAnswer}`;
      }

      if (!combinedSources) {
        combinedSources = buildSourcesMarkdown(continueData);
      }
    }

    const finalAnswer = ENABLE_WEB_SEARCH ? `${combinedAnswer}${combinedSources}` : combinedAnswer;
    chatHistory.push({ role: 'model', parts: [{ text: finalAnswer }] });
    trimHistory();
    return finalAnswer;
  } catch (err) {
    chatHistory = chatHistory.slice(0, -1);
    throw err;
  }
}

export function resetGeminiChat() {
  chatHistory = [];
  lastItemsKey = '';
}
