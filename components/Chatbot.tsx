"use client";

import React, { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MessageSquare, X, Maximize, Minimize } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

interface ChatMessage {
  role: "user" | "bot";
  content: string;
}

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Gemini API
  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY || "");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) setIsFullScreen(false);
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      if (!process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY) {
        throw new Error("API key is not defined in environment variables.");
      }

      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: input }],
          },
        ],
      });
      const botResponse = result.response.text();

      setMessages((prev) => [...prev, { role: "bot", content: botResponse }]);
    } catch (error) {
      console.error("Error sending message to Gemini API:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: `Error: ${errorMsg}. Please try again later.` },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderMarkdown = (text: string) => {
    let parts: (string | JSX.Element)[] = [text];

    parts = parts.flatMap((part, index) => {
      if (typeof part !== "string") return [part];
      return part.split(/(\*\*[^*]+\*\*)/g).map((subPart, subIndex) => {
        if (subPart.startsWith("**") && subPart.endsWith("**")) {
          const boldText = subPart.slice(2, -2);
          return <strong key={`${index}-${subIndex}`}>{boldText}</strong>;
        }
        return subPart;
      });
    });

    parts = parts.flatMap((part, index) => {
      if (typeof part !== "string") return [part];
      return part.split(/(\*[^*]+\*|_[^_]+_)/g).map((subPart, subIndex) => {
        if (
          (subPart.startsWith("*") && subPart.endsWith("*")) ||
          (subPart.startsWith("_") && subPart.endsWith("_"))
        ) {
          const italicText = subPart.slice(1, -1);
          return <em key={`${index}-${subIndex}`}>{italicText}</em>;
        }
        return subPart;
      });
    });

    parts = parts.flatMap((part, index) => {
      if (typeof part !== "string") return [part];
      return part.split(/(`[^`]+`)/g).map((subPart, subIndex) => {
        if (subPart.startsWith("`") && subPart.endsWith("`")) {
          const codeText = subPart.slice(1, -1);
          return (
            <code
              key={`${index}-${subIndex}`}
              className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-sm"
            >
              {codeText}
            </code>
          );
        }
        return subPart;
      });
    });

    parts = parts.flatMap((part, index) => {
      if (typeof part !== "string") return [part];
      return part.split(/(\[.+?\]\(.+?\))/g).map((subPart, subIndex) => {
        const linkMatch = subPart.match(/\[(.+?)\]\((.+?)\)/);
        if (linkMatch) {
          const [, linkText, url] = linkMatch;
          return (
            <a
              key={`${index}-${subIndex}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {linkText}
            </a>
          );
        }
        return subPart;
      });
    });

    return parts;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        >
          <MessageSquare className="w-6 h-6 -scale-x-100" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`bg-white dark:bg-slate-800 rounded-lg shadow-xl flex flex-col border border-gray-300 dark:border-gray-700 transition-all duration-300 ${
            isFullScreen
              ? "fixed inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)]"
              : "w-96 h-[400px]"
          }`}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-3 border-b border-gray-300 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-black dark:text-white">AI Assistant</h3>
            <div className="flex gap-2">
              <button
                onClick={toggleFullScreen}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {isFullScreen ? (
                  <Minimize className="w-5 h-5" />
                ) : (
                  <Maximize className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={toggleChat}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-3">
            {messages.length === 0 ? (
              <p
                className={`text-gray-500 dark:text-gray-400 text-center ${
                  isFullScreen ? "text-lg" : "text-base"
                }`}
              >
                Start a conversation!
              </p>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-2 flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] p-2 rounded-lg ${
                      msg.role === "user"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
                    } ${isFullScreen ? "text-lg p-3" : "text-base"}`}
                  >
                    {renderMarkdown(msg.content)}
                  </div>
                </div>
              ))
            )}
            {isTyping && (
              <div
                className={`text-gray-500 dark:text-gray-400 ${
                  isFullScreen ? "text-lg" : "text-base"
                }`}
              >
                Bot: Typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t border-gray-300 dark:border-gray-700">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className={`w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-900 text-black dark:text-white focus:outline-none resize-none ${
                isFullScreen ? "h-20 text-lg" : "h-12 text-base"
              }`}
            />
            <button
              onClick={sendMessage}
              className={`mt-2 w-full bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors ${
                isFullScreen ? "py-2 text-lg" : "py-1 text-base"
              }`}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;