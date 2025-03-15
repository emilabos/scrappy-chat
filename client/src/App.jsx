import React, { useState, useEffect, useRef } from "react";
import { MessageCircleMore, User, LogOut } from "lucide-react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import Cookies from "js-cookie";
import AdPopup from "./components/Popup";

const WS_URL = "ws://localhost:8000/ws/";
const API_URL = "http://localhost:8000";

const UsernameModal = ({ setUserName, visible, setShowModal }) => {
  const [nameInput, setNameInput] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setModalVisible(visible);
    }, 100);
    return () => clearTimeout(timer);
  }, [visible]);

  const handleSubmitName = (e) => {
    e.preventDefault();
    if (nameInput.trim() !== "") {
      setUserName(nameInput);
      localStorage.setItem("username", nameInput);
      setModalVisible(false);

      setTimeout(() => {
        setShowModal(false);
      }, 300);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-isabelline rounded-lg shadow-2xl p-6 max-w-md w-full transform transition-all duration-300 ease-in-out ${
          modalVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <h2 className="text-2xl font-bold text-raisin-black mb-6 text-center">
          Welcome to Scrappy Chat
        </h2>
        <p className="text-wenge mb-6 text-center">
          Please choose a username to continue
        </p>

        <form onSubmit={handleSubmitName}>
          <div className="mb-6">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Your username"
              className="w-full p-3 rounded-lg border-2 border-bone focus:outline-none focus:border-wenge transition-colors"
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="w-full bg-raisin-black text-bone py-3 px-4 rounded-lg hover:bg-wenge transition-colors font-medium"
          >
            Join Chat
          </button>
        </form>
      </div>
    </div>
  );
};

const App = () => {
  const [userName, setUserName] = useState("");
  const [showModal, setShowModal] = useState(true);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [showAd, setShowAd] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const adTimerRef = useRef(null);
  const chatBodyRef = useRef(null);

  const socketUrl = userName ? `${WS_URL}${userName}` : null;

  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl, {
    shouldReconnect: () => userName !== "",
    reconnectAttempts: 5,
    reconnectInterval: 3000,
  });

  const handleAdClose = () => {
    setShowAd(false);
    startAdTimer();
  };

  const startAdTimer = () => {
    if (adTimerRef.current) {
      clearTimeout(adTimerRef.current);
    }
    adTimerRef.current = setTimeout(() => {
      setShowAd(true);
    }, 5 * 60 * 1000);
  };

  const fetchChatHistory = async () => {
    if (!userName) return;

    setIsLoadingHistory(true);
    try {
      const response = await fetch(`${API_URL}/chat-log`);
      if (response.ok) {
        const chatLog = await response.json();

        const formattedMessages = chatLog.map((message) => {
          const parts = message.split(":");
          const user = parts[0];
          const content = parts.slice(1).join(":");

          return {
            user,
            message: content,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isHistorical: true,
          };
        });

        setMessages(formattedMessages);
      } else {
        console.error("Failed to fetch chat history");
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (
      messageCount > 0 &&
      messageCount % (Math.floor(Math.random() * 5) + 1) === 0
    ) {
      setShowAd(true);
    }
  }, [messageCount]);

  useEffect(() => {
    const showAdCookie = Cookies.get("showAd");
    if (showAdCookie === "true") {
      setShowAd(true);
    }
  }, [showAd]);

  useEffect(() => {
    if (showAd) {
      Cookies.set("showAd", "true", { expires: 7 });
    } else {
      Cookies.remove("showAd");
    }
  }, [showAd]);

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (username) {
      setUserName(username);
      setShowModal(false);
    }
  }, []);

  useEffect(() => {
    if (userName && readyState === ReadyState.OPEN) {
      fetchChatHistory();
      startAdTimer();
    }

    return () => {
      if (adTimerRef.current) {
        clearTimeout(adTimerRef.current);
      }
    };
  }, [userName, readyState]);

  useEffect(() => {
    if (lastMessage !== null) {
      try {
        const receivedMessage = lastMessage.data;
        const newMessage = {
          user:
            userName !== receivedMessage.split(":")[0]
              ? receivedMessage.split(":")[0]
              : userName,
          message: receivedMessage.split(":").slice(1).join(":"),
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        setMessages((prev) => [...prev, newMessage]);
      } catch (e) {
        console.error("Error parsing message:", e);
      }
    }
  }, [lastMessage]);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  const handleLogout = () => {
    localStorage.removeItem("username");
    setUserName("");
    setShowModal(true);
    setMessages([]);
    if (adTimerRef.current) {
      clearTimeout(adTimerRef.current);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (
      messageInput.trim() !== "" &&
      userName &&
      readyState === ReadyState.OPEN
    ) {
      if (messageInput.length < 10) {
        alert("Message is too short!");
        return;
      }
      const formattedMessage = `${userName}:${messageInput}`;
      sendMessage(formattedMessage);

      const newMessage = {
        user: userName,
        message: messageInput,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, newMessage]);
      setMessageInput("");
      setMessageCount((prev) => prev + 1);
    }
  };

  const connectionStatus = {
    [ReadyState.CONNECTING]: "Connecting...",
    [ReadyState.OPEN]: "Connected [UK]",
    [ReadyState.CLOSING]: "Closing...",
    [ReadyState.CLOSED]: "You are disconnected",
    [ReadyState.UNINSTANTIATED]: "You are not connected to the chat",
  }[readyState];

  return (
    <>
      <main className="bg-onyx w-full min-h-screen flex items-center justify-center py-8 px-4">
        <div
          id="content"
          className="sm:w-1/2 w-full rounded-lg shadow-xl h-[90vh] bg-isabelline flex flex-col overflow-hidden"
        >
          <div className="w-full text-center py-4 bg-bone border-b border-bone/50 drop-shadow-md flex justify-between items-center px-6">
            <div className="flex-1">
              <span
                className={`text-xs ${
                  readyState === ReadyState.OPEN
                    ? "text-green-600"
                    : "text-amber-700"
                }`}
              >
                {connectionStatus}
              </span>
            </div>
            <h1 className="text-4xl text-raisin-black font-bold flex gap-x-2 items-center justify-center flex-1">
              <span>Scrappy Chat</span>
              <MessageCircleMore className="w-10 h-10" />
            </h1>
            <div className="flex items-center gap-2 text-wenge flex-1 justify-end">
              {userName && (
                <>
                  <User size={20} />
                  <span className="font-medium">{userName}</span>
                  <button
                    onClick={handleLogout}
                    className="ml-2 p-1 rounded-full hover:bg-wenge/20 transition-colors"
                    title="Log out"
                  >
                    <LogOut size={18} />
                  </button>
                </>
              )}
            </div>
          </div>
          <div
            ref={chatBodyRef}
            id="chat-body"
            className="flex-1 bg-bone p-4 overflow-y-auto space-y-4"
          >
            {isLoadingHistory ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-wenge"></div>
              </div>
            ) : (
              <>
                {messages.length > 0 && (
                  <div className="flex justify-center mb-4">
                    <div className="bg-wenge/20 text-wenge text-xs py-1 px-3 rounded-full">
                      {messages.some((msg) => msg.isHistorical)
                        ? "Showing message history"
                        : "No previous messages"}
                    </div>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      msg.user === userName ? "items-end" : "items-start"
                    }`}
                  >
                    <div className="flex items-center mb-1 text-xs text-wenge">
                      {msg.user !== userName && (
                        <span className="font-medium mr-2">{msg.user}</span>
                      )}
                      <span>{msg.timestamp}</span>
                      {/* {msg.isHistorical && (
                        <span className="ml-2 text-gray-400">(historical)</span>
                      )} */}
                    </div>
                    <div
                      className={`p-3 max-w-xs md:max-w-sm rounded-t-lg ${
                        msg.user === userName
                          ? "bg-blue-500 text-white rounded-bl-lg rounded-br-none"
                          : "bg-wenge text-bone rounded-br-lg rounded-bl-none"
                      } ${msg.isHistorical ? "opacity-75" : ""} shadow-sm`}
                    >
                      {msg.message}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
          <form
            id="chat-controls"
            className="p-4 bg-isabelline border-t border-gray-200 flex"
            onSubmit={handleSendMessage}
          >
            <input
              id="chat-input"
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={
                userName
                  ? `Type a message as ${userName}...`
                  : "Type a message..."
              }
              className="flex-1 p-3 rounded-l-lg border-2 border-r-0 border-gray-300 focus:outline-none focus:border-wenge"
              disabled={readyState !== ReadyState.OPEN}
            />
            <button
              type="submit"
              id="chat-send"
              className={`${
                readyState === ReadyState.OPEN
                  ? "bg-raisin-black hover:bg-wenge"
                  : "bg-gray-400 cursor-not-allowed"
              } text-bone py-3 px-6 rounded-r-lg transition-colors font-medium`}
              disabled={readyState !== ReadyState.OPEN}
            >
              Send
            </button>
          </form>
        </div>
      </main>

      {showModal && (
        <UsernameModal
          setUserName={setUserName}
          visible={showModal}
          setShowModal={setShowModal}
        />
      )}
      {showAd && <AdPopup isShowing={showAd} handleClose={handleAdClose} />}
    </>
  );
};

export default App;
