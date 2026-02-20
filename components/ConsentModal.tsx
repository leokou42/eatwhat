interface ConsentModalProps {
  onConfirm: () => void;
}

export default function ConsentModal({ onConfirm }: ConsentModalProps) {
  return (
    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-[90%] max-w-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-2">資料使用同意</h2>
        <p className="text-sm text-gray-600 mb-4">
          為了提供個人化推薦，我們會將你的答案傳送給 Gemini 進行偏好分析。
          你可以稍後在設定中撤回同意。
        </p>
        <button
          onClick={onConfirm}
          className="w-full bg-gray-900 text-white py-2 rounded-lg"
        >
          我同意
        </button>
      </div>
    </div>
  );
}
