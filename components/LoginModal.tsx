
import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Icons } from './UI';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (password: string) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(false);
      // Small delay to ensure render before focus
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(password);
  };

  // Shake animation on error logic could be added here, 
  // but for now we reset error when typing
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(false);
    setPassword(e.target.value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="w-full max-w-md p-6 bg-rpg-panel border-2 border-rpg-accent shadow-[0_0_20px_rgba(217,119,6,0.3)] rounded-lg relative m-4"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 text-rpg-muted hover:text-white"
        >
          <Icons.Close />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-display text-rpg-accent mb-2">Доступ Мастера</h2>
          <p className="text-rpg-muted text-sm font-serif italic">"Назови слово, и проходи..."</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Input
              ref={inputRef}
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={handleChange}
              className={`text-center tracking-widest ${error ? 'border-red-500 text-red-200' : ''}`}
            />
            {error && <p className="text-red-400 text-xs text-center mt-2 animate-pulse">Неверный пароль</p>}
          </div>

          <Button type="submit" variant="primary">
            Войти
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
