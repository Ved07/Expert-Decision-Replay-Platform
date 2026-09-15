import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { streamCopilotQuery, getCurrentUser } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import "./CopilotDrawer.css";

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFileCategory(file) {
  const type = file.type || "";
  const name = (file.name || "").toLowerCase();
  if (type.startsWith("image/") || name.match(/\.(png|jpe?g|webp|gif|svg|bmp)$/)) {
    return "image";
  }
  if (type.includes("pdf") || name.endsWith(".pdf")) {
    return "pdf";
  }
  if (
    type.includes("sheet") ||
    type.includes("excel") ||
    type.includes("csv") ||
    name.match(/\.(xlsx|xls|csv)$/)
  ) {
    return "spreadsheet";
  }
  return "document";
}

function CopilotDrawer({ externalOpen, onToggle }) {
  const location = useLocation();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMsg, setInputMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeContext, setActiveContext] = useState(null);
  const [dynamicSuggestions, setDynamicSuggestions] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // File Upload State
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [previewModalImage, setPreviewModalImage] = useState(null);
  const fileInputRef = useRef(null);

  // Microphone Voice Input State
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef(null);

  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Sync with externalOpen if provided
  useEffect(() => {
    if (externalOpen !== undefined) {
      setIsOpen(externalOpen);
    }
  }, [externalOpen]);

  // Initialize Speech Recognition API
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputMsg(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn("Speech recognition initialization error:", err);
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  const handleToggleVoice = () => {
    if (!speechSupported) {
      alert("Voice speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.warn("Could not start speech recognition:", e);
          setIsListening(false);
        }
      }
    }
  };

  // Fetch current user details once for context
  useEffect(() => {
    async function fetchUser() {
      try {
        const token = localStorage.getItem("access_token");
        if (token) {
          const user = await getCurrentUser();
          setCurrentUser(user);
        }
      } catch (e) {
        // user not authenticated or error
      }
    }
    fetchUser();
  }, []);

  // Compute active context based on route and global decision state
  const computeContext = useMemo(() => {
    const path = location.pathname;
    let pageTitle = "Dashboard";
    let defaultSuggs = [
      "How do I record a new decision?",
      "Where can I find decisions pending my review?",
      "How do team approvals work?",
      "How do I export decisions to PDF/Excel?",
    ];

    if (path === "/" || path === "/landing") {
      pageTitle = "Landing Page";
    } else if (path === "/dashboard") {
      pageTitle = "Executive Dashboard";
    } else if (path === "/decisions/new") {
      pageTitle = "Create Decision";
      defaultSuggs = [
        "How do I write an effective decision rationale?",
        "What should I include in the alternatives section?",
        "Who will be notified when I submit this decision?",
        "How does the multi-stage approval workflow operate?",
      ];
    } else if (path === "/decisions") {
      pageTitle = "Decision Register";
      defaultSuggs = [
        "How do I filter decisions by status?",
        "Where can I see decisions pending my review?",
        "How do I export the decision log to Excel?",
        "What is the difference between Draft and In Review?",
      ];
    } else if (path === "/team") {
      pageTitle = "Team Management";
      defaultSuggs = [
        "How do I assign users to my team?",
        "Who has permission to manage team assignments?",
        "How do team roles affect the review hierarchy?",
      ];
    } else if (path === "/audit-log") {
      pageTitle = "Audit Log & History";
      defaultSuggs = [
        "What actions are recorded in the audit log?",
        "How are decision version histories tracked?",
        "How do I inspect previous versions of a decision?",
      ];
    } else if (path === "/users") {
      pageTitle = "User Management";
      defaultSuggs = [
        "What permissions do different user roles have?",
        "How do I change a user's role to Reviewer or Manager?",
        "Who can access the user management panel?",
      ];
    }

    const decisionCtx = window.__EDRP_ACTIVE_DECISION__;
    if (path.startsWith("/decisions/") && path !== "/decisions/new" && decisionCtx) {
      pageTitle = `Decision #${decisionCtx.decisionId || ""}`;
      defaultSuggs = [
        `Summarize '${decisionCtx.decisionTitle || "this decision"}'`,
        "What is the next required approval stage?",
        "What alternatives could be considered here?",
        "How do I export this decision to PDF?",
      ];
    }

    return {
      currentPath: path,
      pageTitle,
      userRole: currentUser?.role || "Member",
      userName: currentUser?.name || "User",
      ...(decisionCtx || {}),
      defaultSuggs,
    };
  }, [location.pathname, currentUser]);

  // Update active context and default suggestions whenever route or context changes
  useEffect(() => {
    setActiveContext(computeContext);
    setDynamicSuggestions(computeContext.defaultSuggs);

    const handleContextChange = () => {
      const updated = {
        ...computeContext,
        ...(window.__EDRP_ACTIVE_DECISION__ || {}),
      };
      setActiveContext(updated);
      if (window.__EDRP_ACTIVE_DECISION__?.decisionTitle) {
        setDynamicSuggestions([
          `Summarize '${window.__EDRP_ACTIVE_DECISION__.decisionTitle}'`,
          "What is the next required approval stage?",
          "What alternatives could be considered here?",
          "How do I export this decision to PDF?",
        ]);
      }
    };

    window.addEventListener("edrp-context-change", handleContextChange);
    return () => {
      window.removeEventListener("edrp-context-change", handleContextChange);
    };
  }, [computeContext]);

  // Listen to custom window events for global drawer toggle & shortcuts
  useEffect(() => {
    const handleToggle = () => {
      setIsOpen((prev) => {
        const next = !prev;
        if (onToggle) onToggle(next);
        return next;
      });
    };

    const handleOpen = () => {
      setIsOpen(true);
      if (onToggle) onToggle(true);
    };

    window.addEventListener("toggle-copilot-drawer", handleToggle);
    window.addEventListener("open-copilot-drawer", handleOpen);

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        if (previewModalImage) {
          setPreviewModalImage(null);
          return;
        }
        setIsOpen(false);
        if (onToggle) onToggle(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("toggle-copilot-drawer", handleToggle);
      window.removeEventListener("open-copilot-drawer", handleOpen);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onToggle, previewModalImage]);

  // Scroll to bottom on message updates or streaming chunks
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, isStreaming]);

  const handleClose = () => {
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    }
    setIsOpen(false);
    if (onToggle) onToggle(false);
  };

  /**
   * Process and attach files (Images, Excel, PDF, Text)
   */
  const processFiles = (fileList) => {
    if (!fileList || fileList.length === 0) return;

    const filesArray = Array.from(fileList);
    const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB limit

    filesArray.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File '${file.name}' is too large (max 15MB).`);
        return;
      }

      const reader = new FileReader();
      const category = getFileCategory(file);

      reader.onload = (e) => {
        const base64Data = e.target.result;
        const newFile = {
          id: Date.now() + Math.random().toString(36).substring(2, 7),
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
          category,
          data: base64Data,
          previewUrl: category === "image" ? base64Data : null,
        };

        setAttachedFiles((prev) => [...prev, newFile]);
      };

      reader.onerror = () => {
        toast.error(`Failed to read file: ${file.name}`);
      };

      reader.readAsDataURL(file);
    });
  };

  const handleFileInputChange = (e) => {
    processFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (fileId) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer && e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  /**
   * Build conversation context prompt for multi-turn history.
   */
  const buildPrompt = (query, history) => {
    let historyBlock = "";
    if (history.length > 0) {
      historyBlock =
        "Previous conversation turns:\n" +
        history
          .slice(-4)
          .map((turn) =>
            turn.role === "user"
              ? `User: ${turn.content}`
              : `Assistant: ${turn.content}`
          )
          .join("\n") +
        "\n\n";
    }

    return `${historyBlock}User question: ${query || "Analyze the uploaded file(s)."}`;
  };

  const handleSend = async (textToSend) => {
    const query = textToSend !== undefined ? textToSend : inputMsg;
    const currentAttachedFiles = [...attachedFiles];

    if (!query.trim() && currentAttachedFiles.length === 0) return;
    if (loading || isStreaming) return;

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    }

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: query,
      files: currentAttachedFiles,
    };

    const assistantMessageId = Date.now() + 1;
    const initialAssistantMessage = {
      id: assistantMessageId,
      sender: "assistant",
      text: "",
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);
    setInputMsg("");
    setAttachedFiles([]);
    setLoading(true);
    setIsStreaming(true);

    const currentHistory = conversationHistory;
    const fullPrompt = buildPrompt(query, currentHistory);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedText = "";

    // Prepare files payload for backend
    const filesPayload = currentAttachedFiles.map((f) => ({
      name: f.name,
      type: f.type,
      size: f.size,
      data: f.data,
    }));

    await streamCopilotQuery(fullPrompt, activeContext, {
      files: filesPayload,
      signal: controller.signal,
      onToken: (token) => {
        setLoading(false);
        accumulatedText += token;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, text: accumulatedText, isStreaming: true }
              : msg
          )
        );
      },
      onSuggestions: (suggs) => {
        if (suggs && suggs.length > 0) {
          setDynamicSuggestions(suggs);
        }
      },
      onError: (errText) => {
        setLoading(false);
        setIsStreaming(false);
        const isRateLimit = errText && errText.toLowerCase().includes("rate limit");
        toast.error(
          isRateLimit
            ? "Copilot rate limit reached. Please wait a moment."
            : "Copilot is unavailable. Please try again."
        );
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  text: errText || "Could not reach Copilot backend.",
                  isError: true,
                  isStreaming: false,
                }
              : msg
          )
        );
      },
      onDone: (data) => {
        setLoading(false);
        setIsStreaming(false);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, isStreaming: false }
              : msg
          )
        );

        if (accumulatedText.trim()) {
          setConversationHistory((prev) => [
            ...prev,
            { role: "user", content: query || "Uploaded attachments" },
            { role: "assistant", content: accumulatedText.trim() },
          ]);
        }
      },
    });
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (promptText) => {
    handleSend(promptText);
  };

  const handleClearChat = () => {
    handleStopStreaming();
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    }
    setMessages([]);
    setConversationHistory([]);
    setAttachedFiles([]);
    if (activeContext?.defaultSuggs) {
      setDynamicSuggestions(activeContext.defaultSuggs);
    }
  };

  // Helper icon for file categories
  const renderFileCategoryIcon = (category) => {
    switch (category) {
      case "image":
        return "🖼️";
      case "spreadsheet":
        return "📊";
      case "pdf":
        return "📄";
      default:
        return "📎";
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`copilot-backdrop ${isOpen ? "copilot-backdrop--open" : ""}`}
        onClick={handleClose}
      />

      {/* Enlarged Image Lightbox Modal */}
      {previewModalImage && (
        <div
          className="copilot-image-modal-backdrop"
          onClick={() => setPreviewModalImage(null)}
        >
          <div
            className="copilot-image-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="copilot-image-modal-close"
              onClick={() => setPreviewModalImage(null)}
              title="Close Preview"
              type="button"
            >
              ✕
            </button>
            <img
              src={previewModalImage.previewUrl || previewModalImage.data}
              alt={previewModalImage.name || "Preview"}
              className="copilot-image-modal-img"
            />
            <div className="copilot-image-modal-footer">
              <span>{previewModalImage.name}</span>
              <span>{formatFileSize(previewModalImage.size)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Drawer */}
      <div
        className={`copilot-drawer ${isOpen ? "copilot-drawer--open" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag and drop overlay banner */}
        {isDraggingOver && (
          <div className="copilot-dropzone-overlay">
            <div className="copilot-dropzone-box">
              <div className="copilot-dropzone-icon">📁</div>
              <div className="copilot-dropzone-title">Drop Files Here</div>
              <div className="copilot-dropzone-desc">
                Attach Images, Spreadsheets (Excel/CSV), PDFs, or Documents
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="copilot-header">
          <div className="copilot-header__left">
            <div
              className="copilot-header__icon"
              style={{ padding: 0, overflow: "hidden", background: "transparent" }}
            >
              <img
                src="/copilot-icon.png"
                alt="Copilot"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
            <div>
              <h3 className="copilot-header__title">EDRP Copilot</h3>
              <p className="copilot-header__subtitle">Real-time Contextual AI</p>
            </div>
          </div>
          <div className="copilot-header__actions">
            {isStreaming && (
              <button
                className="copilot-stop-btn"
                onClick={handleStopStreaming}
                title="Stop generating response"
                type="button"
              >
                ■ Stop
              </button>
            )}
            <button
              className="copilot-close-btn"
              onClick={handleClose}
              title="Close Copilot (Esc)"
              type="button"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Active Context Bar */}
        {activeContext && (
          <div className="copilot-context-bar">
            <span className="copilot-context-bar__icon">◈</span>
            <span className="copilot-context-bar__text" title={activeContext.decisionTitle || activeContext.pageTitle}>
              {activeContext.decisionTitle
                ? `Decision #${activeContext.decisionId}: ${activeContext.decisionTitle}`
                : activeContext.pageTitle}
            </span>
            {activeContext.decisionStatus && (
              <span className="copilot-context-bar__status">
                {activeContext.decisionStatus}
              </span>
            )}
          </div>
        )}

        {/* Body / Message History */}
        <div className="copilot-body">
          {messages.length === 0 ? (
            <div className="copilot-empty-state">
              <div
                className="copilot-empty-state__icon"
                style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}
              >
                <img
                  src="/copilot-icon.png"
                  alt="Copilot"
                  style={{ width: 64, height: 64, objectFit: "contain" }}
                />
              </div>
              <div className="copilot-empty-state__title">
                Welcome to EDRP Copilot
              </div>
              <div className="copilot-empty-state__desc">
                {activeContext?.decisionTitle
                  ? `I'm tuned to this decision. Ask about review outcomes, alternatives, criteria, or replays. You can also attach PDFs, Excel sheets, and images for instant AI analysis.`
                  : `Ask questions about decision replays, pending reviews, approvals, team workflows, or upload images, spreadsheets, and PDFs for instant insights.`}
              </div>
              <div className="copilot-suggestions">
                {dynamicSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="copilot-suggestion-chip"
                    onClick={() => handleSuggestionClick(suggestion)}
                    type="button"
                  >
                    <span>{suggestion}</span>
                    <span>→</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`copilot-msg copilot-msg--${msg.sender}`}
              >
                <div
                  className="copilot-msg__avatar"
                  style={
                    msg.sender === "assistant"
                      ? { background: "#ffffff", padding: 2 }
                      : { display: "flex", alignItems: "center", justifyContent: "center" }
                  }
                >
                  {msg.sender === "user" ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  ) : (
                    <img
                      src="/copilot-icon.png"
                      alt="Copilot"
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    />
                  )}
                </div>
                <div className="copilot-msg__bubble">
                  {msg.status === "unconfigured" && (
                    <div className="copilot-msg__status-badge">Backend Ready</div>
                  )}
                  {msg.isError && (
                    <div
                      className="copilot-msg__status-badge"
                      style={{ background: "#ef4444", color: "#ffffff" }}
                    >
                      Error
                    </div>
                  )}

                  {/* Render attachments in user message */}
                  {msg.files && msg.files.length > 0 && (
                    <div className="copilot-msg__attachments">
                      {msg.files.map((file, idx) => (
                        <div key={idx} className="copilot-msg__attachment-item">
                          {file.category === "image" && file.previewUrl ? (
                            <div
                              className="copilot-msg__image-wrapper"
                              onClick={() => setPreviewModalImage(file)}
                              title="Click to expand image"
                            >
                              <img
                                src={file.previewUrl}
                                alt={file.name}
                                className="copilot-msg__image-preview"
                              />
                              <div className="copilot-msg__image-overlay">
                                <span>🔍 View</span>
                              </div>
                            </div>
                          ) : (
                            <div className="copilot-msg__file-pill">
                              <span className="copilot-msg__file-icon">
                                {renderFileCategoryIcon(file.category)}
                              </span>
                              <div className="copilot-msg__file-info">
                                <span className="copilot-msg__file-name" title={file.name}>
                                  {file.name}
                                </span>
                                <span className="copilot-msg__file-size">
                                  {formatFileSize(file.size)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Message Content: Clean Markdown Rendering for Assistant, Text for User */}
                  <div className="copilot-msg__content">
                    {msg.sender === "assistant" ? (
                      <div className="copilot-markdown">
                        {msg.text ? (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              table: ({ node, ...props }) => (
                                <div className="copilot-table-container">
                                  <table className="copilot-markdown-table" {...props} />
                                </div>
                              ),
                              th: ({ node, ...props }) => (
                                <th className="copilot-markdown-th" {...props} />
                              ),
                              td: ({ node, ...props }) => (
                                <td className="copilot-markdown-td" {...props} />
                              ),
                              h1: ({ node, ...props }) => (
                                <h1 className="copilot-markdown-h1" {...props} />
                              ),
                              h2: ({ node, ...props }) => (
                                <h2 className="copilot-markdown-h2" {...props} />
                              ),
                              h3: ({ node, ...props }) => (
                                <h3 className="copilot-markdown-h3" {...props} />
                              ),
                              h4: ({ node, ...props }) => (
                                <h4 className="copilot-markdown-h4" {...props} />
                              ),
                              ul: ({ node, ...props }) => (
                                <ul className="copilot-markdown-ul" {...props} />
                              ),
                              ol: ({ node, ...props }) => (
                                <ol className="copilot-markdown-ol" {...props} />
                              ),
                              li: ({ node, ...props }) => (
                                <li className="copilot-markdown-li" {...props} />
                              ),
                              strong: ({ node, ...props }) => (
                                <strong className="copilot-markdown-strong" {...props} />
                              ),
                              blockquote: ({ node, ...props }) => (
                                <blockquote className="copilot-markdown-blockquote" {...props} />
                              ),
                              code: ({ node, inline, ...props }) =>
                                inline ? (
                                  <code className="copilot-markdown-inline-code" {...props} />
                                ) : (
                                  <pre className="copilot-markdown-pre">
                                    <code className="copilot-markdown-block-code" {...props} />
                                  </pre>
                                ),
                            }}
                          >
                            {msg.text}
                          </ReactMarkdown>
                        ) : null}

                        {msg.isStreaming && !msg.text && (
                          <span className="copilot-loading-dots">
                            <span className="copilot-loading-dot" />
                            <span className="copilot-loading-dot" />
                            <span className="copilot-loading-dot" />
                          </span>
                        )}
                        {msg.isStreaming && msg.text && (
                          <span className="copilot-streaming-cursor" />
                        )}
                      </div>
                    ) : (
                      <div style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Footer / Input Area */}
        <div className="copilot-footer">
          {/* Quick Context Suggestions when chat has started */}
          {messages.length > 0 && dynamicSuggestions.length > 0 && !isStreaming && (
            <div
              style={{
                display: "flex",
                gap: 6,
                overflowX: "auto",
                paddingBottom: 8,
                marginBottom: 4,
              }}
            >
              {dynamicSuggestions.slice(0, 2).map((sugg, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(sugg)}
                  type="button"
                  style={{
                    background: "rgba(30, 41, 59, 0.8)",
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                    borderRadius: 9999,
                    color: "#93c5fd",
                    fontSize: 10,
                    padding: "4px 10px",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                  }}
                >
                  ✦ {sugg}
                </button>
              ))}
            </div>
          )}

          {/* Attached Files Preview Bar */}
          {attachedFiles.length > 0 && (
            <div className="copilot-attachment-previews">
              {attachedFiles.map((file) => (
                <div key={file.id} className="copilot-attachment-chip">
                  {file.category === "image" && file.previewUrl ? (
                    <img
                      src={file.previewUrl}
                      alt={file.name}
                      className="copilot-attachment-chip__thumb"
                    />
                  ) : (
                    <span className="copilot-attachment-chip__icon">
                      {renderFileCategoryIcon(file.category)}
                    </span>
                  )}
                  <div className="copilot-attachment-chip__details">
                    <span className="copilot-attachment-chip__name" title={file.name}>
                      {file.name}
                    </span>
                    <span className="copilot-attachment-chip__size">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                  <button
                    className="copilot-attachment-chip__remove"
                    onClick={() => handleRemoveFile(file.id)}
                    type="button"
                    title="Remove file"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            multiple
            accept="image/*,.pdf,.xlsx,.xls,.csv,.txt,.json,.md,.doc,.docx"
            style={{ display: "none" }}
          />

          <div className="copilot-input-wrapper">
            {/* Attach File Button */}
            <button
              className="copilot-attach-btn"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              disabled={isStreaming}
              title="Upload images, Excel spreadsheets, PDFs, or documents"
              type="button"
              aria-label="Upload files or images"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>

            <input
              className="copilot-input"
              placeholder={
                isListening
                  ? "Listening... Speak your question now"
                  : attachedFiles.length > 0
                  ? "Ask about the attached files..."
                  : activeContext?.decisionTitle
                  ? `Ask Copilot about '${activeContext.decisionTitle.slice(0, 24)}...'`
                  : "Ask Copilot a question..."
              }
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
            />

            {/* Voice Input Microphone Button */}
            <button
              className={`copilot-mic-btn ${isListening ? "copilot-mic-btn--listening" : ""}`}
              onClick={handleToggleVoice}
              disabled={isStreaming}
              title={
                isListening
                  ? "Listening... Click to stop"
                  : speechSupported
                  ? "Voice input (Speak to Copilot)"
                  : "Voice input not supported in this browser"
              }
              type="button"
              aria-label="Voice input"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>

            {/* Send Message Button */}
            <button
              className="copilot-send-btn"
              onClick={() => handleSend()}
              disabled={(!inputMsg.trim() && attachedFiles.length === 0) || isStreaming}
              title="Send Message"
              type="button"
            >
              →
            </button>
          </div>

          <div className="copilot-footer__actions">
            {isListening ? (
              <span className="copilot-listening-indicator">
                <span className="copilot-listening-indicator__dot" />
                Listening... click mic to stop
              </span>
            ) : (
              <span>📎 Upload Images, PDFs, Excel • Press Enter to send</span>
            )}
            {messages.length > 0 && (
              <button
                className="copilot-clear-btn"
                onClick={handleClearChat}
                type="button"
              >
                Clear conversation
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default CopilotDrawer;
