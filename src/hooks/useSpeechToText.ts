import { useRef } from "react";
import { useIntl } from "react-intl";

const SPEECH_RECOGNITION_LANG: Record<string, string> = {
  ko: "ko-KR",
  en: "en-US",
  es: "es-ES",
};

const useSpeechToText = (
  onTranscript: (text: string) => void
) => {
  const intl = useIntl();
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const SpeechRecognitionCtor =
    window.SpeechRecognition ?? window.webkitSpeechRecognition;

  const startListening = () => {
    if (!SpeechRecognitionCtor) {
      alert("Speech recognition is not supported in this browser.");
      return false;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang =
      SPEECH_RECOGNITION_LANG[intl.locale] ?? SPEECH_RECOGNITION_LANG.en;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        }
      }
      if (finalTranscript) {
        onTranscript(finalTranscript);
      }
    };

    recognition.onerror = () => stopListening();
    recognition.onend = () => {
      recognitionRef.current = null;
    };

    recognition.start();
    recognitionRef.current = recognition;
    return true;
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  };

  const isListening = () => recognitionRef.current !== null;

  return { startListening, stopListening, isListening };
};

export default useSpeechToText;
