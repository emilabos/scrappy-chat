import React, { useState, useEffect } from "react";
import { MessageCircleMore, User, LogOut } from "lucide-react";
import useWebSocket, { ReadyState } from "react-use-websocket";

const WS_URL = "ws://127.0.0.1:800";

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
  const [messages, setMessages] = useState([
    {
      user: "Bob",
      message: "Welcome to Scrappy Chat",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
    {
      user: "Jeff",
      message: "This is the most useless chat",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
    {
      user: "John",
      message: "whats up?",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
    {
      user: "Joe",
      message: "im good thanks",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);

  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
    WS_URL,
    {
      share: false,
      shouldReconnect: () => true,
    }
  );

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (username) {
      setUserName(username);
      setShowModal(false);
    }
  }, []);

  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({
        event: "subscribe",
        data: {
          channel: "general-chatroom",
        },
      });
    }
  }, [readyState]);

  useEffect(() => {
    if (lastJsonMessage) {
      console.log("Got a new message:", lastJsonMessage);
    }
  }, [lastJsonMessage]);

  const handleLogout = () => {
    localStorage.removeItem("username");
    setUserName("");
    setShowModal(true);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageInput.trim() !== "" && userName) {
      const newMessage = {
        user: userName,
        message: messageInput,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages([...messages, newMessage]);
      setMessageInput("");

      // Send to WebSocket if connected
      if (readyState === ReadyState.OPEN) {
        sendJsonMessage({
          event: "message",
          data: newMessage,
        });
      }
    }
  };

  return (
    <>
      <main className="bg-onyx w-full min-h-screen flex items-center justify-center py-8 px-4">
        <div
          id="content"
          className="sm:w-1/2 w-full rounded-lg shadow-xl h-[90vh] bg-isabelline flex flex-col overflow-hidden"
        >
          <div className="w-full text-center py-4 bg-bone border-b border-bone/50 drop-shadow-md flex justify-between items-center px-6">
            <div className="flex-1"></div>
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
            id="chat-body"
            className="flex-1 bg-bone p-4 overflow-y-auto space-y-4"
          >
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
                </div>
                <div
                  className={`p-3 max-w-xs md:max-w-sm rounded-t-lg ${
                    msg.user === userName
                      ? "bg-blue-500 text-white rounded-bl-lg rounded-br-none"
                      : "bg-wenge text-bone rounded-br-lg rounded-bl-none"
                  } shadow-sm`}
                >
                  {msg.message}
                </div>
              </div>
            ))}
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
            />
            <button
              type="submit"
              id="chat-send"
              className="bg-raisin-black text-bone py-3 px-6 rounded-r-lg hover:bg-wenge transition-colors font-medium"
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
    </>
  );
};

export default App;
