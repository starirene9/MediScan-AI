import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import { useIntl } from "react-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { useNav } from "../../context/NavContext";
import { RootState } from "../../store/store";
import { sendClinicalChat } from "../../services/apiClient";
import { LAYOUT } from "../../theme/layout";

type ChatRole = "assistant" | "user";

interface ChatMessage {
  id: string;
  role: ChatRole;
  /** User-typed or model text. Prefer `messageId` for localized system replies. */
  text?: string;
  /** react-intl message id rendered in the active locale. */
  messageId?: string;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  messageId: "medical_chatbot_welcome",
};

const MARKDOWN_SX = {
  wordBreak: "break-word",
  "& > :first-of-type": { mt: 0 },
  "& > :last-child": { mb: 0 },
  "& p": { my: 0.75 },
  "& ul, & ol": { my: 0.75, pl: 2.5 },
  "& li": { my: 0.25 },
  "& li > p": { my: 0 },
  "& h1, & h2, & h3, & h4": { fontSize: "0.9rem", fontWeight: 700, my: 1 },
  "& blockquote": {
    my: 0.75,
    pl: 1.25,
    borderLeft: "3px solid var(--color-border)",
    color: "text.secondary",
  },
  "& code": {
    fontSize: "0.8em",
    px: 0.5,
    borderRadius: 0.5,
    bgcolor: "var(--color-surface)",
  },
  "& hr": { my: 1, border: 0, borderTop: "1px solid var(--color-border)" },
  "& table": {
    display: "block",
    overflowX: "auto",
    borderCollapse: "collapse",
    my: 0.75,
    fontSize: "0.75rem",
  },
  "& th, & td": {
    border: "1px solid var(--color-border)",
    px: 0.75,
    py: 0.5,
    textAlign: "left",
    verticalAlign: "top",
  },
} as const;

function resolveStudyId(
  pathname: string,
  selectedStudyId: string | null
): string | undefined {
  const match = pathname.match(/^\/studies\/([^/]+)\/?$/);
  if (match?.[1]) return match[1];
  return selectedStudyId ?? undefined;
}

const MedicalChatbot = () => {
  const intl = useIntl();
  const location = useLocation();
  const { isOpen: navOpen } = useNav();
  const selectedStudyId = useSelector(
    (state: RootState) => state.studies.selectedStudyId
  );
  const [open, setOpen] = useState(false);
  const navOffset = navOpen ? LAYOUT.navWidthOpen : LAYOUT.navWidthClosed;
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const studyId = resolveStudyId(location.pathname, selectedStudyId);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open, sending]);

  const resolveMessageText = (message: ChatMessage) => {
    if (message.messageId) {
      return intl.formatMessage({ id: message.messageId });
    }
    return message.text ?? "";
  };

  const handleSubmit = async (event?: FormEvent | KeyboardEvent) => {
    event?.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text,
    };

    const historyForApi = [...messages, userMessage]
      .filter((message) => message.role === "user" || message.text)
      .filter((message) => !message.messageId)
      .map((message) => ({
        role: message.role,
        content: message.text ?? "",
      }))
      .filter((message) => message.content.trim().length > 0);

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    try {
      const response = await sendClinicalChat({
        messages: historyForApi,
        studyId,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: response.message.content,
        },
      ]);
    } catch (error) {
      const detail =
        error instanceof Error ? error.message.toLowerCase() : "";
      const messageId =
        detail.includes("groq_api_key") || detail.includes("not configured")
          ? "medical_chatbot_not_configured"
          : detail.includes("rate limit")
            ? "medical_chatbot_rate_limited"
            : detail.includes("timed out") || detail.includes("timeout")
              ? "medical_chatbot_timeout"
              : "medical_chatbot_error";
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          messageId,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button
        size="small"
        startIcon={<ChatOutlinedIcon fontSize="small" />}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls="medical-chatbot-panel"
        sx={{
          color: "var(--color-white)",
          textTransform: "none",
          fontWeight: 600,
          px: 1.25,
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.08)",
          },
        }}
      >
        {intl.formatMessage({ id: "medical_chatbot" })}
      </Button>

      {open && (
        <Paper
          id="medical-chatbot-panel"
          elevation={8}
          role="dialog"
          aria-label={intl.formatMessage({ id: "medical_chatbot" })}
          sx={{
            position: "fixed",
            left: `calc(${navOffset} + 8px)`,
            bottom: "calc(var(--layout-footer-height, 3rem) + 8px)",
            width: { xs: `calc(100vw - ${navOffset} - 16px)`, sm: 380 },
            maxWidth: `calc(100vw - ${navOffset} - 16px)`,
            height: {
              xs: "min(70vh, 480px)",
              sm: `min(600px, calc(100vh - ${LAYOUT.headerHeight} - ${LAYOUT.footerHeight} - 16px))`,
            },
            zIndex: 1300,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: 2,
            border: "1px solid var(--color-border)",
            bgcolor: "background.paper",
            transition:
              "left 300ms ease, width 300ms ease, max-width 300ms ease",
          }}
        >
          <Box
            sx={{
              px: 1.5,
              py: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid var(--color-border)",
              bgcolor: "var(--color-shell)",
              color: "var(--color-white)",
              flexShrink: 0,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight={700} noWrap>
                {intl.formatMessage({ id: "medical_chatbot" })}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }} noWrap>
                {intl.formatMessage({ id: "medical_chatbot_subtitle" })}
                {studyId ? ` · ${studyId}` : ""}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => setOpen(false)}
              aria-label={intl.formatMessage({ id: "close" })}
              sx={{ color: "inherit" }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box
            ref={listRef}
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              px: 1.5,
              py: 1.25,
              bgcolor: "var(--color-surface)",
            }}
          >
            <Stack spacing={1.25}>
              {messages.map((message) => {
                const isUser = message.role === "user";
                return (
                  <Box
                    key={message.id}
                    sx={{
                      display: "flex",
                      justifyContent: isUser ? "flex-end" : "flex-start",
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: "85%",
                        px: 1.25,
                        py: 1,
                        borderRadius: 2,
                        borderTopRightRadius: isUser ? 0.5 : 2,
                        borderTopLeftRadius: isUser ? 2 : 0.5,
                        bgcolor: isUser
                          ? "var(--color-azure)"
                          : "background.paper",
                        color: isUser ? "var(--color-white)" : "text.primary",
                        border: isUser
                          ? "none"
                          : "1px solid var(--color-border)",
                        boxShadow: isUser
                          ? "none"
                          : "0 1px 2px rgba(0,0,0,0.04)",
                      }}
                    >
                      {!isUser && !message.messageId ? (
                        <Typography
                          variant="body2"
                          component="div"
                          sx={MARKDOWN_SX}
                        >
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              a: (props) => (
                                <a {...props} target="_blank" rel="noreferrer" />
                              ),
                            }}
                          >
                            {message.text ?? ""}
                          </ReactMarkdown>
                        </Typography>
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            whiteSpace: "pre-wrap",
                            ...(message.id === WELCOME_MESSAGE.id && {
                              fontSize: "0.8125rem",
                              lineHeight: 1.45,
                            }),
                          }}
                        >
                          {resolveMessageText(message)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}
              {sending && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={14} />
                  <Typography variant="caption" color="text.secondary">
                    {intl.formatMessage({ id: "medical_chatbot_thinking" })}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              px: 1.5,
              pt: 0.75,
              flexShrink: 0,
              lineHeight: 1.35,
            }}
          >
            {intl.formatMessage({ id: "medical_chatbot_disclaimer" })}
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              p: 1.25,
              display: "flex",
              gap: 1,
              alignItems: "flex-end",
              borderTop: "1px solid var(--color-border)",
              flexShrink: 0,
            }}
          >
            <TextField
              inputRef={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.shiftKey) return;
                // Korean IME fires Enter while a syllable is still composing; sending then
                // leaves the last character behind in the input.
                if (event.nativeEvent.isComposing || event.keyCode === 229) return;
                event.preventDefault();
                if (sending || !input.trim()) return;
                void handleSubmit(event);
              }}
              placeholder={intl.formatMessage({
                id: "medical_chatbot_placeholder",
              })}
              size="small"
              fullWidth
              multiline
              maxRows={3}
              disabled={sending}
              aria-label={intl.formatMessage({
                id: "medical_chatbot_placeholder",
              })}
            />
            <IconButton
              type="submit"
              color="primary"
              disabled={sending || !input.trim()}
              aria-label={intl.formatMessage({ id: "medical_chatbot_send" })}
              sx={{
                bgcolor: "var(--color-azure)",
                color: "var(--color-white)",
                borderRadius: 1.5,
                "&:hover": { bgcolor: "var(--color-dark-blue)" },
                "&.Mui-disabled": {
                  bgcolor: "var(--color-light-silver)",
                  color: "var(--color-muted)",
                },
              }}
            >
              <SendIcon fontSize="small" />
            </IconButton>
          </Box>
        </Paper>
      )}
    </>
  );
};

export default MedicalChatbot;
