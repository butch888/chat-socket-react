import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:3001');

function App() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [userName, setUserName] = useState('');

  const askedName = useRef(false);
  const messagesEndRef = useRef(null); // ref для последнего сообщения

  useEffect(() => {
    if (!askedName.current) {
      setUserName(!prompt('Enter your name:') ? 'No name' : prompt('Enter your name:'));
      askedName.current = true;
    }

    socket.on('chat message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]); // важно использовать prevMessages
    });

    return () => {
      socket.off('chat message'); // очистка
    };
  }, []);

  useEffect(() => {
    // Прокрутка вниз при изменении messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (newMessage.trim()) {
      socket.emit('chat message', {user: userName, message: newMessage});
      setNewMessage('');
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">💬 My Chat ({userName})</div>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className="chat-message">
            {<span className="chat-user">{msg.user}</span>}: {msg.message}
          </div>
        ))}
        <div ref={messagesEndRef} /> {/* невидимый элемент внизу */}
      </div>
      <div className="chat-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default App;
