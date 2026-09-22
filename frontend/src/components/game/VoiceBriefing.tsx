import { useEffect, useState } from "react";
import { Loader2, Radio, Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { speak, speechSupported, stopSpeaking } from "@/lib/speech";
import { toast } from "sonner";

// "SESLİ BRİFİNG" — reads the mission briefing aloud on demand (Web Speech API, on-device).
export default function VoiceBriefing({ text, label = "Sesli brifing" }: { text: string; label?: string }) {
  const [speaking, setSpeaking] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!speechSupported()) return;
    // voices load asynchronously in most browsers
    const check = () => setReady(window.speechSynthesis.getVoices().length > 0);
    check();
    window.speechSynthesis.onvoiceschanged = check;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      stopSpeaking();
    };
  }, []);

  useEffect(() => () => stopSpeaking(), []);

  if (!speechSupported()) return null;

  function toggle() {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    speak(text, () => setSpeaking(false));
    if (!ready) toast.info("Sesli brifing başlatılıyor — tarayıcı sesi hazırlıyor.", { id: "voice-warmup" });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={speaking ? "secondary" : "outline"}
        onClick={toggle}
        data-testid="voice-briefing-button"
        aria-label={speaking ? "Sesli brifingi durdur" : "Sesli brifingi dinle"}
      >
        {speaking ? <Square size={13} aria-hidden /> : <Volume2 size={14} aria-hidden />}
        {speaking ? "Brifingi durdur" : label}
      </Button>
      {speaking && (
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-primary" data-testid="voice-briefing-active">
          <Radio size={11} className="animate-pulse" aria-hidden />
          ANLATICI YAYINDA
          <span className="flex items-end gap-0.5" aria-hidden>
            <span className="h-2 w-0.5 animate-pulse bg-primary" />
            <span className="h-3 w-0.5 animate-pulse bg-primary [animation-delay:120ms]" />
            <span className="h-1.5 w-0.5 animate-pulse bg-primary [animation-delay:240ms]" />
          </span>
        </span>
      )}
    </div>
  );
}
