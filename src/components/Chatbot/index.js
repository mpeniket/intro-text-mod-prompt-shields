import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import dynamic from "next/dynamic";
import {
  Stack,
  TextField,
  IconButton,
  MessageBarType,
  Label,
  Persona,
  PersonaSize,
  Spinner,
  SpinnerSize,
  Separator,
} from "@fluentui/react";
import { continueConversation } from "@/actions/continueConversation";
import { readStreamableValue } from "ai/rsc";
import safetyCheck from "@/actions/safetyCheck";

const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });
const ClientSideMessageBar = dynamic(
  () => import("@fluentui/react").then((mod) => mod.MessageBar),
  { ssr: false }
);
const ClientSidePrimaryButton = dynamic(
  () => import("@fluentui/react").then((mod) => mod.PrimaryButton),
  { ssr: false }
);

const CONVERSATION_STARTERS = [
  "What can you help me with?",
  "Tell me more about your services.",
  "How do I get started?",
  "Can you assist with any questions I have?",
];

const GenericChatbot = () => {
  const [starters, setStarters] = useState([]);
  const [isFirstSubmit, setIsFirstSubmit] = useState(() => {
    if (typeof window === "undefined") return true;
    return true;
  });
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [localInput, setLocalInput] = useState("");
  const [error, setError] = useState(null);
  const messageAreaRef = useRef(null);
  const [errorType, setErrorType] = useState(MessageBarType.error);

  useEffect(() => {
    setStarters(CONVERSATION_STARTERS);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    if (typeof window !== "undefined" && messageAreaRef.current) {
      messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight;
    }
  }, []);

  const handleDelete = useCallback((id) => {
    setMessages((messages) =>
      messages.filter((_, index) => index.toString() !== id)
    );
  }, []);

  const handleStarterClick = useCallback((starter) => {
    setLocalInput((input) => (input.trim() + " " + starter).trim());
  }, []);

  const handleFormSubmit = useCallback(
    async (e) => {
      if (typeof window === "undefined") return;
      e.preventDefault();
      if (isFirstSubmit) {
        setIsFirstSubmit(false);
        setStarters([]);
      }
      if (!localInput.trim()) return;

      // Perform safety check
      const safetyCheckResult = await safetyCheck(localInput);
      if (safetyCheckResult === null) {
        setError("Error checking message safety. Please try again.");
        setErrorType(MessageBarType.error);
        return;
      }

      // Extract data from safety check result
      const {
        attackDetected: { attackDetected },
        returnCategoriesAnalysis: { returnCategoriesAnalysis },
      } = safetyCheckResult;

      console.log(
        "attackDetected",
        attackDetected,
        "returnCategoriesAnalysis",
        returnCategoriesAnalysis
      );

      if (
        attackDetected ||
        Object.values(returnCategoriesAnalysis).some((severity) => severity > 0)
      ) {
        const safetyMessages = [];
        console.log("inside if", attackDetected);
        console.log("inside if", returnCategoriesAnalysis);
        if (attackDetected) {
          safetyMessages.push("potential jailbreak");
        }
        Object.entries(returnCategoriesAnalysis).forEach(
          ([category, severity]) => {
            if (severity > 0) {
              safetyMessages.push(category.toLowerCase());
            }
          }
        );

        const safetyMessage = `Sorry, we can't process that message as it seems you are trying to send inappropriate content. Detected: ${safetyMessages.join(
          ", "
        )}.`;
        setError(safetyMessage);
        setErrorType(MessageBarType.blocked);
        return;
      }

      // If safety check passes, proceed with the original logic
      setError(null);
      const userMessage = { role: "user", content: localInput };
      setMessages((prev) => [...prev, userMessage]);
      setLocalInput("");
      setIsLoading(true);

      try {
        const { messages: updatedMessages, newMessage } =
          await continueConversation([...messages, userMessage]);

        let textContent = "";
        for await (const delta of readStreamableValue(newMessage)) {
          textContent = `${textContent}${delta}`;
          setMessages([
            ...updatedMessages,
            { role: "assistant", content: textContent },
          ]);
        }
      } catch (error) {
        console.error("Error in conversation:", error);
        setError("An error occurred. Please try again.");
        setErrorType(MessageBarType.error);
      } finally {
        setIsLoading(false);
      }
    },
    [isFirstSubmit, localInput, messages]
  );

  const renderMessageContent = useCallback((content) => {
    if (typeof window === "undefined") return null;

    return (
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p style={{ margin: "10px 0", lineHeight: "1.5" }}>{children}</p>
          ),
          ul: ({ children }) => (
            <ul style={{ paddingLeft: "20px", margin: "10px 0" }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol style={{ paddingLeft: "20px", margin: "10px 0" }}>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li style={{ margin: "5px 0", listStyleType: "disc" }}>
              {children}
            </li>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    );
  }, []);

  const filteredMessages = useMemo(() => messages, [messages]);

  const ForwardRefStack = React.forwardRef((props, ref) => (
    <Stack {...props} elementRef={ref} />
  ));

  ForwardRefStack.displayName = "ForwardRefStack";

  return (
    <Stack
      horizontalAlign="center"
      verticalAlign="center"
      styles={{
        root: {
          width: "100%",
          maxWidth: "1600px",
          margin: "0 auto",
          height: "100%",
          padding: "20px",
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
          borderRadius: "8px",
        },
      }}
    >
      <Stack
        tokens={{ childrenGap: 15 }}
        styles={{
          root: {
            width: "100%",
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            padding: "20px",
          },
        }}
      >
        <Label
          styles={{
            root: { fontSize: "20px", fontWeight: "bold", color: "#333333" },
          }}
        >
          AI Chatbot
        </Label>
        {error && (
          <ClientSideMessageBar
            messageBarType={errorType}
            isMultiline={false}
            onDismiss={() => setError(null)}
            dismissButtonAriaLabel="Close"
          >
            {error}
          </ClientSideMessageBar>
        )}
        <ClientSideMessageBar
          messageBarType={MessageBarType.warning}
          isMultiline={false}
        >
          Be careful - the chatbot might make mistakes. Please double-check
          important information.
        </ClientSideMessageBar>
        <ForwardRefStack
          verticalFill
          styles={{
            root: { height: "55vh", overflowY: "auto", padding: "10px 0" },
          }}
          tokens={{ childrenGap: 10 }}
          ref={messageAreaRef}
        >
          {filteredMessages.map((message, index) => (
            <Stack
              key={index}
              horizontal
              horizontalAlign={message.role === "user" ? "end" : "start"}
              styles={{ root: { padding: "10px 0" } }}
            >
              {message.role === "user" ? (
                <Persona
                  size={PersonaSize.size32}
                  styles={{
                    root: { marginRight: "8px" },
                  }}
                />
              ) : (
                <Persona
                  size={PersonaSize.size32}
                  imageInitials="AI"
                  styles={{
                    root: { marginLeft: "8px" },
                  }}
                />
              )}
              <Stack
                styles={{
                  root: {
                    padding: "5px 15px",
                    borderRadius: "4px",
                    backgroundColor:
                      message.role === "user" ? "#0078d4" : "#f3f2f1",
                    color: message.role === "user" ? "white" : "black",
                    maxWidth: "60%",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    overflow: "hidden",
                  },
                }}
              >
                {renderMessageContent(message.content)}
              </Stack>
              <IconButton
                iconProps={{ iconName: "Delete" }}
                title="Delete message"
                id="delete-message"
                onClick={() => handleDelete(index.toString())}
                styles={{ root: { marginLeft: "8px", color: "#a4262c" } }}
              />
            </Stack>
          ))}
          {isLoading && (
            <Spinner
              size={SpinnerSize.small}
              label="Our AI is thinking..."
              labelPosition="right"
            />
          )}
        </ForwardRefStack>
        <Separator />
        <Stack
          horizontal
          styles={{
            root: {
              paddingTop: isFirstSubmit ? "10px" : "0",
              height: isFirstSubmit ? "auto" : "0",
              overflow: "hidden",
              transition: "height 0.3s ease-in-out",
            },
          }}
          tokens={{ childrenGap: 10 }}
        >
          {isFirstSubmit &&
            starters.map((starter, index) => (
              <Label
                key={index}
                styles={{
                  root: {
                    padding: "5px 10px",
                    backgroundColor: "#e1dfdd",
                    borderRadius: "4px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  },
                }}
                onClick={() => handleStarterClick(starter)}
              >
                {starter}
              </Label>
            ))}
        </Stack>
        <Stack
          as="form"
          onSubmit={handleFormSubmit}
          horizontal
          verticalAlign="end"
          styles={{ root: { paddingTop: "5px" } }}
          tokens={{ childrenGap: 10 }}
        >
          <TextField
            id="chatbot-input-field"
            placeholder="Start messaging"
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            styles={{ root: { flexGrow: 1 } }}
            multiline
            rows={3}
            resizable={false}
            autoComplete="off"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleFormSubmit(e);
              }
            }}
          />
          <ClientSidePrimaryButton
            id="send-button"
            text="Send"
            onClick={handleFormSubmit}
            disabled={isLoading || !localInput.trim()}
            iconProps={{ iconName: "Send" }}
          />
        </Stack>
      </Stack>
    </Stack>
  );
};

GenericChatbot.displayName = "GenericChatbot";

export default GenericChatbot;
