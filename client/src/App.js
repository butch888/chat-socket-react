import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:3001');

function App() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [userName, setUserName] = useState('');

  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef(null);

  const askedName = useRef(false);
  const messagesEndRef = useRef(null); // ref для последнего сообщения

  useEffect(() => {
    if (!askedName.current) {
      const name = prompt('Enter your name:');
      setUserName(name);
      askedName.current = true;
      
      // Отправляем событие подключения после установки имени
      socket.emit('user joined', name);
    }

    socket.on('chat message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    socket.on('typing', (users) => {
      setTypingUsers(users.filter(user => user !== userName));
    });

    socket.on('user joined', (name) => {
      setMessages(prev => [...prev, {
        system: true,
        text: `${name} joined the chat`
      }]);
    });

    socket.on('user left', (name) => {
      setMessages(prev => [...prev, {
        system: true,
        text: `${name} left the chat`
      }]);
    });

    return () => {
      socket.off('chat message');
      socket.off('typing');
      socket.off('user joined');
      socket.off('user left');
    };
  }, [userName]);

  useEffect(() => {
    // Прокрутка вниз при изменении messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Отправляем событие набора сообщения
    if (!isTyping) {
      socket.emit('typing', userName);
      setIsTyping(true);
    }
    
    // Сбрасываем таймер
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    
    // Отправляем событие остановки набора через 1.5 секунды бездействия
    typingTimeout.current = setTimeout(() => {
      socket.emit('stop typing');
      setIsTyping(false);
    }, 1500);
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      socket.emit('chat message', {user: userName, message: newMessage});
      setNewMessage('');
      // При отправке сообщения останавливаем "печатание"
      socket.emit('stop typing');
      setIsTyping(false);
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
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
        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            {typingUsers.join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default App;
