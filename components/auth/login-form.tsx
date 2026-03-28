"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setMessage("");

    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ phone, password })
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error ?? "요청 처리에 실패했습니다.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${mode === "login" ? "bg-white shadow-sm" : ""}`}
        >
          로그인
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${mode === "register" ? "bg-white shadow-sm" : ""}`}
        >
          회원가입
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">전화번호</label>
        <Input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="01012345678"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">비밀번호</label>
        <Input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="비밀번호 입력"
        />
      </div>

      {message ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{message}</div> : null}

      <Button className="w-full" onClick={() => void submit()} disabled={loading}>
        {loading ? "처리 중..." : mode === "login" ? "로그인" : "회원가입 후 시작"}
      </Button>
    </div>
  );
}
