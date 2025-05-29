"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowUp, FaChevronLeft, FaChevronRight } from "react-icons/fa";

type Message = {
 sender_name: string;
 content: string;
 timestamp_ms: number;
};

type DayMessages = {
 date: string;
 messages: Message[];
};

export default function LoveMessages() {
 const [allMessages, setAllMessages] = useState<Message[]>([]);
 const [groupedMessages, setGroupedMessages] = useState<DayMessages[]>([]);
 const [currentDayIndex, setCurrentDayIndex] = useState(0);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [showScrollButton, setShowScrollButton] = useState(false);
 const chatContainerRef = useRef<HTMLDivElement>(null);

 // Carrega as mensagens do JSON
 useEffect(() => {
  const loadMessages = async () => {
   try {
    const response = await fetch("/messages.json");
    if (!response.ok) throw new Error("Failed to load messages");

    const data = await response.json();
    const filteredMessages = data.messages
     .reverse()
     .filter((msg: Message) => msg.content && msg.timestamp_ms);

    setAllMessages(filteredMessages);
    groupMessagesByDate(filteredMessages);
    setLoading(false);
   } catch (err) {
    setError("Erro ao carregar mensagens. Tente recarregar a página.");
    setLoading(false);
    console.error("Error loading messages:", err);
   }
  };

  loadMessages();
 }, []);

 // Agrupa mensagens por data
 const groupMessagesByDate = (messages: Message[]) => {
  const dateMap = new Map<string, Message[]>();

  messages.forEach((msg) => {
   const date = extractFullDate(msg.timestamp_ms);
   if (!dateMap.has(date)) dateMap.set(date, []);
   dateMap.get(date)?.push(msg);
  });

  const sortedDates = Array.from(dateMap.entries())
   .sort(
    ([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime()
   )
   .map(([date, msgs]) => ({ date, messages: msgs }));

  // Encontra o índice do dia 15 de março para começar
  const march15Index = sortedDates.findIndex((d) =>
   d.date.startsWith("15 de março")
  );
  setCurrentDayIndex(march15Index >= 0 ? march15Index : 0);
  setGroupedMessages(sortedDates);
 };

 // Formata timestamp para horário de Brasília
 const timestampToBrasilia = (timestamp: number) => {
  const date = new Date(timestamp);
  const formatter = new Intl.DateTimeFormat("pt-BR", {
   weekday: "short",
   day: "2-digit",
   month: "long",
   hour: "2-digit",
   minute: "2-digit",
   hour12: false,
   timeZone: "America/Sao_Paulo",
  });

  const parts = formatter.formatToParts(date);
  const weekday = parts.find((p) => p.type === "weekday")?.value || "";
  const day = parts.find((p) => p.type === "day")?.value || "";
  const month = parts.find((p) => p.type === "month")?.value || "";
  const hour = parts.find((p) => p.type === "hour")?.value || "";
  const minute = parts.find((p) => p.type === "minute")?.value || "";

  return `${weekday}, ${day} de ${month} às ${hour}:${minute}`;
 };

 // Extrai a data completa
 const extractFullDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString("pt-BR", {
   day: "2-digit",
   month: "long",
   year: "numeric",
   timeZone: "America/Sao_Paulo",
  });
 };

 // Corrige texto com problemas de encoding
 const fixText = (text: string) => {
  try {
   return decodeURIComponent(escape(text));
  } catch {
   return text;
  }
 };

 // Observa o scroll para mostrar/ocultar botão de voltar ao topo
 useEffect(() => {
  const handleScroll = () => {
   if (chatContainerRef.current) {
    const { scrollTop } = chatContainerRef.current;
    setShowScrollButton(scrollTop > 200);
   }
  };

  const container = chatContainerRef.current;
  if (container) {
   container.addEventListener("scroll", handleScroll);
  }

  return () => {
   if (container) {
    container.removeEventListener("scroll", handleScroll);
   }
  };
 }, []);

 // Rola para o topo
 const scrollToTop = () => {
  if (chatContainerRef.current) {
   chatContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
  }
 };

 // Navega para o dia anterior
 const goToPreviousDay = () => {
  if (currentDayIndex > 0) {
   setCurrentDayIndex(currentDayIndex - 1);
   scrollToTop();
  }
 };

 // Navega para o próximo dia
 const goToNextDay = () => {
  if (currentDayIndex < groupedMessages.length - 1) {
   setCurrentDayIndex(currentDayIndex + 1);
   scrollToTop();
  }
 };

 // Renderiza uma mensagem individual
 const renderMessage = (msg: Message) => {
  const name = msg.sender_name.toLowerCase();
  const isLara = name.includes("lara");
  const alignment = isLara ? "justify-end" : "justify-start";
  const flexDirection = isLara ? "flex-row-reverse" : "flex-row";
  const avatar = isLara ? "/lara.jpeg" : "/enzo.jpeg";
  const bgColor = isLara
   ? "bg-pink-500 text-white"
   : "bg-fuchsia-900 text-white";
  const borderColor = isLara ? "border-pink-400" : "border-fuchsia-700";

  return (
   <motion.div
    key={`${msg.timestamp_ms}-${msg.content.substring(0, 10)}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={`flex ${alignment} w-full`}
    aria-label={`Mensagem de ${isLara ? "Lara" : "Enzo"}`}
   >
    <div
     className={`flex ${flexDirection} items-end gap-3 w-full max-w-[90%] sm:max-w-[80%]`}
    >
     <img
      src={avatar}
      alt={`Foto de ${isLara ? "Lara" : "Enzo"}`}
      className={`w-10 h-10 rounded-full border-2 ${borderColor} object-cover shadow-md`}
     />
     <div className={`px-4 py-2 rounded-2xl ${bgColor} shadow`}>
      <p className="text-sm whitespace-pre-line">{fixText(msg.content)}</p>
      <span className="block mt-1 text-[0.7rem] text-pink-200 text-right">
       {timestampToBrasilia(msg.timestamp_ms)}
      </span>
     </div>
    </div>
   </motion.div>
  );
 };

 return (
  <div className="relative min-h-screen w-full p-4">
   {/* Fundo gradiente fixo */}
   <div className="fixed inset-0 z-[-2] bg-gradient-to-b from-pink-700 to-fuchsia-900" />

   {/* Conteúdo principal */}
   <main className="max-w-2xl mx-auto relative z-10 shadow-2xl rounded-lg bg-white/10 backdrop-blur-sm">
    {/* Navegação entre dias */}
    {groupedMessages.length > 0 && (
     <div className="flex justify-between p-4 bg-pink-500 text-white">
      <button
       onClick={goToPreviousDay}
       disabled={currentDayIndex === 0}
       className={`px-4 py-2 rounded hover:bg-pink-600 flex items-center gap-2 ${
        currentDayIndex === 0 ? "opacity-50 cursor-not-allowed" : ""
       }`}
      >
       <FaChevronLeft />
       <span>Dia Anterior</span>
      </button>

      <button
       onClick={goToNextDay}
       disabled={currentDayIndex === groupedMessages.length - 1}
       className={`px-4 py-2 rounded hover:bg-pink-600 flex items-center gap-2 ${
        currentDayIndex === groupedMessages.length - 1
         ? "opacity-50 cursor-not-allowed"
         : ""
       }`}
      >
       <span>Próximo Dia</span>
       <FaChevronRight />
      </button>
     </div>
    )}

    {/* Área de mensagens */}
    <div
     ref={chatContainerRef}
     className="p-4 space-y-6 min-h-[60vh] max-h-[80vh] overflow-y-auto scroll-smooth touch-pan-y"
     aria-live="polite"
    >
     {loading ? (
      <div className="text-center text-pink-200 py-10">
       Carregando nossas mensagens especiais...
      </div>
     ) : error ? (
      <div className="text-center text-pink-300 py-10 font-medium">{error}</div>
     ) : groupedMessages.length > 0 ? (
      <>
       <h2 className="text-center text-pink-200 text-lg font-medium mb-4">
        Mensagens de {groupedMessages[currentDayIndex]?.date}
       </h2>
       <AnimatePresence>
        {groupedMessages[currentDayIndex]?.messages.map(renderMessage)}
       </AnimatePresence>
      </>
     ) : (
      <div className="text-center text-pink-300 py-10">
       Nenhuma mensagem encontrada.
      </div>
     )}
    </div>

    {/* Rodapé com contador */}
    <footer className="p-3 bg-fuchsia-900/20 text-center text-pink-100 text-sm border-t border-pink-400/20">
     <p>
      {groupedMessages.length > 0
       ? `${
          groupedMessages[currentDayIndex]?.messages.length || 0
         } mensagens carregadas`
       : "0 mensagens carregadas"}
     </p>
    </footer>
   </main>

   {/* Botão para voltar ao topo */}
   <AnimatePresence>
    {showScrollButton && (
     <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      onClick={scrollToTop}
      className="z-20 fixed bottom-6 right-6 flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white p-3 rounded-full shadow-md transition-all duration-200"
      aria-label="Voltar ao topo da conversa"
     >
      <FaArrowUp />
     </motion.button>
    )}
   </AnimatePresence>
  </div>
 );
}
