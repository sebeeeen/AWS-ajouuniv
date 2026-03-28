"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { parseQuestionText } from "@/lib/services/imported-wrong-questions";

const TYPE_OPTIONS = [
  { value: "quantitative-reasoning", label: "수리 추리" },
  { value: "verbal-reasoning", label: "언어 추리" },
  { value: "data-interpretation", label: "자료 해석" }
];

export function WrongQuestionUploadForm() {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [recordId, setRecordId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [suggestedTypeKey, setSuggestedTypeKey] = useState("verbal-reasoning");
  const [extractedText, setExtractedText] = useState("");
  const [hasVisual, setHasVisual] = useState(false);
  const [visualType, setVisualType] = useState("");
  const [ocrUnavailable, setOcrUnavailable] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [passage, setPassage] = useState("");
  const [choices, setChoices] = useState([
    { label: "A", content: "" },
    { label: "B", content: "" },
    { label: "C", content: "" },
    { label: "D", content: "" },
    { label: "E", content: "" }
  ]);
  const [correctChoiceLabel, setCorrectChoiceLabel] = useState("A");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"idle" | "ocr" | "saving">("idle");
  const [message, setMessage] = useState("");
  const filledChoiceCount = useMemo(
    () => choices.filter((choice) => choice.content.trim()).length,
    [choices]
  );

  function hydrateStructuredFields(text: string) {
    const parsed = parseQuestionText(text);

    setPrompt(parsed.prompt);
    setPassage(parsed.passage);
    setChoices((current) =>
      current.map((choice) => {
        const matched = parsed.choices.find((item) => item.label === choice.label);
        return {
          ...choice,
          content: matched?.content ?? ""
        };
      })
    );

    if (parsed.choices.some((choice) => choice.label === correctChoiceLabel)) {
      return;
    }

    setCorrectChoiceLabel(parsed.choices[0]?.label ?? "A");
  }

  async function handleFileChange(file: File | null) {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const imageDataUrl = String(reader.result ?? "");
      setPreviewUrl(imageDataUrl);
      setLoading(true);
      setPhase("ocr");
      setMessage("OCR로 텍스트를 읽는 중입니다...");

      const response = await fetch("/api/wrong-questions/ocr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ imageDataUrl })
      });

      const data = await response.json();
      setLoading(false);
      setPhase("idle");

      if (!response.ok) {
        setMessage(data.error ?? "OCR 처리에 실패했습니다.");
        return;
      }

      setRecordId(data.id);
      setTitle(data.title ?? "");
      setExtractedText(data.extractedText ?? "");
      setSuggestedTypeKey(data.suggestedTypeKey ?? "verbal-reasoning");
      setHasVisual(Boolean(data.hasVisual));
      setVisualType(String(data.visualType ?? ""));
      setOcrUnavailable(Boolean(data.extractedText?.includes("OPENAI_API_KEY")));
      hydrateStructuredFields(data.extractedText ?? "");
      setMessage(
        data.extractedText?.includes("OPENAI_API_KEY")
          ? "현재 서버에 OCR API 키가 없어 자동 추출 대신 수동 입력 모드로 전환했습니다."
          : data.hasVisual
          ? "그래프/도표가 감지되었습니다. 원본 이미지는 유지하고, 아래 텍스트는 문제와 선지만 확인해 주세요."
          : "OCR 결과를 확인하고 수정한 뒤 저장해 주세요."
      );
    };

    reader.readAsDataURL(file);
  }

  async function confirm() {
    if (!recordId) {
      setMessage("이미지를 먼저 업로드해서 OCR 결과를 불러와 주세요.");
      return;
    }

    if (!extractedText.trim()) {
      setMessage("OCR 결과가 비어 있습니다. 텍스트를 직접 입력한 뒤 저장해 주세요.");
      return;
    }

    if (!prompt.trim()) {
      setMessage("문제 지문을 확인해 주세요.");
      return;
    }

    if (filledChoiceCount < 2) {
      setMessage("최소 2개 이상의 선지를 입력해 주세요.");
      return;
    }

    setLoading(true);
    setPhase("saving");
    const response = await fetch(`/api/wrong-questions/${recordId}/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title,
        confirmedText: extractedText,
        suggestedTypeKey,
        prompt,
        passage,
        choices,
        correctChoiceLabel
      })
    });
    const data = await response.json();
    setLoading(false);
    setPhase("idle");

    if (!response.ok || !data.ok) {
      setMessage(data.error ?? "확정 저장에 실패했습니다.");
      return;
    }

    setMessage("오답 문제가 실제 풀이 문항으로 등록되었습니다. 이후 오답 모의고사에서 출제됩니다.");
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium">오답 문제 이미지 업로드</label>
        <Input type="file" accept="image/*" onChange={(event) => void handleFileChange(event.target.files?.[0] ?? null)} />
        {loading && phase === "ocr" ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span>OCR 텍스트와 문제 구조를 추출하는 중입니다.</span>
          </div>
        ) : null}
      </div>

      {previewUrl ? (
        <div className="space-y-3">
          <img
            src={previewUrl}
            alt="업로드한 오답 문제"
            className="max-h-72 w-full rounded-2xl border object-contain"
          />
          {hasVisual ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {`시각 자료 감지: ${visualType || "graph"}`}. 그래프/표 이미지는 그대로 보존되고, OCR 텍스트는 지문과 선지 중심으로 정리됩니다.
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium">문제 제목</label>
        <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="예: 자료해석 오답 1번" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">추천 유형</label>
        <select
          value={suggestedTypeKey}
          onChange={(event) => setSuggestedTypeKey(event.target.value)}
          className="flex h-11 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none"
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">OCR 결과 확인</label>
        <Textarea
          value={extractedText}
          onChange={(event) => {
            const nextValue = event.target.value;
            setExtractedText(nextValue);
            hydrateStructuredFields(nextValue);
          }}
          placeholder="OCR 결과가 여기에 들어옵니다. 그래프가 포함된 문제라면 텍스트는 지문과 선지만 정리되는지 확인하세요."
          className="min-h-64"
        />
        {ocrUnavailable ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            자동 OCR이 꺼져 있습니다. 이미지 아래 텍스트 칸에 문제와 선지를 직접 정리한 뒤 저장해 주세요.
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">풀이용 지문</label>
        <Textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="실제 세션에 표시될 문제 지문"
          className="min-h-28"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">참고 본문 / 자료 설명</label>
        <Textarea
          value={passage}
          onChange={(event) => setPassage(event.target.value)}
          placeholder="그래프 설명, 조건, 표 설명이 있으면 적어 주세요."
          className="min-h-24"
        />
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium">선지와 정답 확인</div>
        <div className="space-y-3">
          {choices.map((choice) => (
            <div key={choice.label} className="grid gap-2 md:grid-cols-[56px_1fr]">
              <label className="flex items-center justify-center rounded-xl border bg-muted text-sm font-semibold">
                {choice.label}
              </label>
              <Input
                value={choice.content}
                onChange={(event) =>
                  setChoices((current) =>
                    current.map((item) =>
                      item.label === choice.label
                        ? { ...item, content: event.target.value }
                        : item
                    )
                  )
                }
                placeholder={`${choice.label} 선지 내용`}
              />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">정답 선지</label>
          <select
            value={correctChoiceLabel}
            onChange={(event) => setCorrectChoiceLabel(event.target.value)}
            className="flex h-11 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none"
          >
            {choices
              .filter((choice) => choice.content.trim())
              .map((choice) => (
                <option key={choice.label} value={choice.label}>
                  {choice.label}
                </option>
              ))}
          </select>
        </div>
      </div>

      {message ? <div className="rounded-xl bg-muted px-4 py-3 text-sm">{message}</div> : null}

      <Button onClick={() => void confirm()} disabled={loading}>
        {loading && phase === "saving" ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            저장 중...
          </span>
        ) : (
          "확인 후 저장"
        )}
      </Button>
    </div>
  );
}
