import { useState, useRef, useEffect } from 'react';

import { MessageCircle, X, Send } from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';

export default function ChatBot() {

  const [open, setOpen] = useState(false);

  const [input, setInput] = useState('');

  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(false);

  const endRef = useRef(null);

  useEffect(() => {

    endRef.current?.scrollIntoView({ behavior: 'smooth' });

  }, [messages, open]);

  async function sendMessage() {

    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input };

    const newMessages = [...messages, userMsg];

    setMessages(newMessages);

    setInput('');

    setLoading(true);

    try {

      const res = await fetch('/api/chat', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ messages: newMessages }),

      });

      const data = await res.json();

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || 'Error al responder.' }]);

    } catch {

      setMessages((prev) => [...prev, { role: 'assistant', content: 'Hubo un error de conexión.' }]);

    } finally {

      setLoading(false);

    }

  }

  return (

    <>

      <button

        onClick={() => setOpen(!open)}

        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg hover:bg-violet-700 transition"

      >

        {open ? <X size={24} /> : <MessageCircle size={24} />}

      </button>

      <AnimatePresence>

        {open && (

          <motion.div

            initial={{ opacity: 0, y: 20 }}

            animate={{ opacity: 1, y: 0 }}

            exit={{ opacity: 0, y: 20 }}

            className="fixed bottom-24 right-5 z-50 flex h-[28rem] w-80 flex-col rounded-2xl bg-[#121017] border border-white/10 shadow-2xl overflow-hidden"

          >

            <div className="px-4 py-3 border-b border-white/10 text-white font-medium">

              Tutor de Estela

            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">

              {messages.length === 0 && (

                <p className="text-sm text-white/40 mt-4 text-center">

                  Pregúntame cualquier duda de examen o de una materia.

                </p>

              )}

              {messages.map((m, i) => (

                <div

                  key={i}

                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${

                    m.role === 'user'

                      ? 'ml-auto bg-violet-600 text-white'

                      : 'bg-white/10 text-white'

                  }`}

                >

                  {m.content}

                </div>

              ))}

              {loading && <div className="text-white/40 text-sm px-2">Escribiendo…</div>}

              <div ref={endRef} />

            </div>

            <div className="flex items-center gap-2 border-t border-white/10 p-2">

              <input

                value={input}

                onChange={(e) => setInput(e.target.value)}

                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}

                placeholder="Escribe tu duda…"

                className="flex-1 bg-white/5 text-white text-sm rounded-lg px-3 py-2 outline-none placeholder:text-white/30"

              />

              <button onClick={sendMessage} className="text-violet-400 hover:text-violet-300">

                <Send size={20} />

              </button>

            </div>

          </motion.div>

        )}

      </AnimatePresence>

    </>

  );

}
