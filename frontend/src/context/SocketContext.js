import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { token, user } = useAuth();

  useEffect(() => {
    if (token && user) {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

      try {
        const newSocket = io(BACKEND_URL, {
          path: "/ws/socket.io",
          transports: ["polling", "websocket"],
          auth: { token },
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000,
          timeout: 5000,
        });

        newSocket.on("connect", () => {
          setConnected(true);
        });

        newSocket.on("disconnect", () => {
          setConnected(false);
        });

        newSocket.on("connect_error", (error) => {
          console.warn(
            "Socket connection error (non-critical):",
            error.message
          );
          // Don't fail the app if socket fails - HTTP fallback works
        });

        setSocket(newSocket);

        return () => {
          newSocket.close();
        };
      } catch (error) {
        console.warn("Socket initialization failed (non-critical):", error);
      }
    }
  }, [token, user]);

  const joinChannel = useCallback(
    (channelId) => {
      if (socket && connected) {
        socket.emit("join_channel", { channel_id: channelId });
      }
    },
    [socket, connected]
  );

  const leaveChannel = useCallback(
    (channelId) => {
      if (socket && connected) {
        socket.emit("leave_channel", { channel_id: channelId });
      }
    },
    [socket, connected]
  );

  const joinDM = useCallback(
    (dmId) => {
      if (socket && connected) {
        socket.emit("join_dm", { dm_id: dmId });
      }
    },
    [socket, connected]
  );

  const startTyping = useCallback(
    (channelId) => {
      if (socket && connected && user) {
        socket.emit("typing_start", {
          channel_id: channelId,
          user: { id: user.id, username: user.username },
        });
      }
    },
    [socket, connected, user]
  );

  const stopTyping = useCallback(
    (channelId) => {
      if (socket && connected && user) {
        socket.emit("typing_stop", {
          channel_id: channelId,
          user: { id: user.id, username: user.username },
        });
      }
    },
    [socket, connected, user]
  );

  const joinVoice = useCallback(
    (channelId) => {
      if (socket && connected && user) {
        socket.emit("voice_join", {
          channel_id: channelId,
          user: { id: user.id, username: user.username, avatar: user.avatar },
        });
      }
    },
    [socket, connected, user]
  );

  const leaveVoice = useCallback(
    (channelId) => {
      if (socket && connected && user) {
        socket.emit("voice_leave", {
          channel_id: channelId,
          user: { id: user.id, username: user.username },
        });
      }
    },
    [socket, connected, user]
  );

  const value = {
    socket,
    connected,
    joinChannel,
    leaveChannel,
    joinDM,
    startTyping,
    stopTyping,
    joinVoice,
    leaveVoice,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};
