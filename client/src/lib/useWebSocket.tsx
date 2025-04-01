import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Message, GroupMessage } from "@shared/schema";

type WebSocketMessageType = {
  type: 'direct-message' | 'group-message' | 'error' | 'auth';
  message?: Message | GroupMessage;
  error?: string;
};

type WebSocketContextType = {
  connected: boolean;
  sendDirectMessage: (recipientId: number, content: string) => void;
  sendGroupMessage: (groupId: number, content: string) => void;
  lastDirectMessage: Message | null;
  lastGroupMessage: GroupMessage | null;
  lastError: string | null;
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [lastDirectMessage, setLastDirectMessage] = useState<Message | null>(null);
  const [lastGroupMessage, setLastGroupMessage] = useState<GroupMessage | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user) {
      // Not authenticated, don't connect
      return;
    }

    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connected");
      setConnected(true);

      // Send authentication immediately after connection
      socket.send(JSON.stringify({
        type: 'auth',
        userId: user.id
      }));
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
      setConnected(false);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setLastError("WebSocket error occurred");
    };

    socket.onmessage = (event) => {
      try {
        const data: WebSocketMessageType = JSON.parse(event.data);
        
        if (data.type === 'direct-message' && data.message) {
          setLastDirectMessage(data.message as Message);
        }
        else if (data.type === 'group-message' && data.message) {
          setLastGroupMessage(data.message as GroupMessage);
        }
        else if (data.type === 'error') {
          setLastError(data.error || "Unknown error");
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    // Clean up on unmount
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [user]);

  const sendDirectMessage = (recipientId: number, content: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setLastError("WebSocket is not connected");
      return;
    }

    socketRef.current.send(JSON.stringify({
      type: 'direct-message',
      recipientId,
      content
    }));
  };

  const sendGroupMessage = (groupId: number, content: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setLastError("WebSocket is not connected");
      return;
    }

    socketRef.current.send(JSON.stringify({
      type: 'group-message',
      groupId,
      content
    }));
  };

  return (
    <WebSocketContext.Provider
      value={{
        connected,
        sendDirectMessage,
        sendGroupMessage,
        lastDirectMessage,
        lastGroupMessage,
        lastError
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}