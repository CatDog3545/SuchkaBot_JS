const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL;

const DATA_FILE = path.join(__dirname, 'user_data.json');

// Хранилище данных
let userData = {};

// Загрузка данных
function loadData() {
    if (fs.existsSync(DATA_FILE)) {
        try {
            const data = fs.readFileSync(DATA_FILE, 'utf-8');
            userData = JSON.parse(data);
            console.log(`✅ Загружено данных пользователей: ${Object.keys(userData).length}`);
        } catch (e) {
            console.error(`⚠️ Ошибка загрузки данных: ${e.message}`);
            userData = {};
        }
    } else {
        console.log('📁 Файл данных не найден, создаём новый');
        userData = {};
    }
}

// Сохранение данных
function saveData() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(userData, null, 2), 'utf-8');
    } catch (e) {
        console.error(`❌ Ошибка сохранения данных: ${e.message}`);
    }
}

// Главное меню
const MAIN_MENU = {
    reply_markup: JSON.stringify({
        keyboard: [
            ['📋 Список чатов', '➕ Новый чат']
        ],
        resize_keyboard: true
    })
};

// Меню выбора чата
function getChatsMenu(chatNames) {
    const keyboard = chatNames.map(name => [name]);
    keyboard.push(['🔙 Назад в меню']);
    return {
        reply_markup: JSON.stringify({
            keyboard,
            resize_keyboard: true
        })
    };
}

const MENU_BUTTONS = ['📋 Список чатов', '➕ Новый чат', '🔙 Назад в меню'];

// Получить данные пользователя
function getUserChats(userId) {
    if (!userData[userId]) {
        userData[userId] = {
            chats: {},
            active_chat: null
        };
    }
    return userData[userId];
}

// Создать новый чат
function createNewChat(userId, name = null) {
    const chatId = crypto.randomUUID().substring(0, 8);
    if (!name) {
        const now = new Date();
        name = `Чат ${now.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })} ${now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    }

    const userChats = getUserChats(userId);
    userChats.chats[chatId] = {
        name,
        messages: []
    };
    userChats.active_chat = chatId;
    saveData();
    return chatId;
}

// Получить активный чат
function getActiveChat(userId) {
    const userChats = getUserChats(userId);
    if (userChats.active_chat && userChats.chats[userChats.active_chat]) {
        return userChats.chats[userChats.active_chat];
    }
    return null;
}

// Переключить чат
function switchChat(userId, chatName) {
    const userChats = getUserChats(userId);
    for (const [chatId, chatData] of Object.entries(userChats.chats)) {
        if (chatData.name === chatName) {
            userChats.active_chat = chatId;
            saveData();
            return true;
        }
    }
    return false;
}

// Инициализация бота
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

console.log('🤖 Бот запущен... (Ctrl+C для остановки)');

// Команда /start
bot.onText(/\/start/, (msg) => {
    const userId = msg.from.id;
    getUserChats(userId);
    bot.sendMessage(msg.chat.id, '👋 Привет! Я AI-бот с поддержкой чатов.\n\nИспользуй кнопки внизу для управления чатами!', MAIN_MENU);
});

// Команда /menu
bot.onText(/\/menu/, (msg) => {
    bot.sendMessage(msg.chat.id, '📋 Главное меню', MAIN_MENU);
});

// Обработчик кнопок меню
bot.on('message', (msg) => {
    if (!msg.text) return;

    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const text = msg.text;

    // Обработка кнопок меню
    if (MENU_BUTTONS.includes(text)) {
        if (text === '📋 Список чатов') {
            showChatsList(msg);
        } else if (text === '➕ Новый чат') {
            createChat(msg);
        } else if (text === '🔙 Назад в меню') {
            bot.sendMessage(chatId, '🔙 Возврат в главное меню', MAIN_MENU);
        }
        return;
    }

    // Проверка, является ли текст названием чата
    const userChats = getUserChats(userId);
    const chatExists = Object.values(userChats.chats).some(chat => chat.name === text);

    if (chatExists) {
        if (switchChat(userId, text)) {
            const activeChat = getActiveChat(userId);
            const messages = activeChat ? activeChat.messages.slice(-5) : [];

            if (messages.length > 0) {
                const preview = messages.map(m => `${m.role}: ${m.content.substring(0, 50)}...`).join('\n');
                bot.sendMessage(chatId, `✅ Переключен на чат: **${text}**\n\nПоследние сообщения:\n_${preview}_`, {
                    parse_mode: 'Markdown',
                    ...getChatsMenu([text])
                });
            } else {
                bot.sendMessage(chatId, `✅ Переключен на чат: **${text}**\n\nЧат пуст, напишите первое сообщение!`, {
                    parse_mode: 'Markdown',
                    ...getChatsMenu([text])
                });
            }
        }
        return;
    }

    // Обработка сообщения для ИИ
    handleMessage(msg);
});

// Показать список чатов
async function showChatsList(msg) {
    const userId = msg.from.id;
    const userChats = getUserChats(userId);

    if (Object.keys(userChats.chats).length === 0) {
        bot.sendMessage(msg.chat.id, '📭 У вас пока нет чатов.\nСоздайте новый чат кнопкой «➕ Новый чат»', MAIN_MENU);
        return;
    }

    const activeChat = getActiveChat(userId);
    const activeName = activeChat ? activeChat.name : null;

    let message = '📋 **Ваши чаты:**\n\n';
    for (const chatData of Object.values(userChats.chats)) {
        const marker = chatData.name === activeName ? '🟢' : '⚪';
        message += `${marker} ${chatData.name}\n`;
    }

    const chatNames = Object.values(userChats.chats).map(chat => chat.name);
    bot.sendMessage(msg.chat.id, message, {
        parse_mode: 'Markdown',
        ...getChatsMenu(chatNames)
    });
}

// Создать чат
async function createChat(msg) {
    const userId = msg.from.id;
    const chatId = createNewChat(userId);
    const activeChat = getActiveChat(userId);

    bot.sendMessage(msg.chat.id, `✅ Создан новый чат: **${activeChat.name}**\n\nID: \`${chatId}\`\n\nНапишите сообщение, чтобы начать диалог!`, {
        parse_mode: 'Markdown',
        ...MAIN_MENU
    });
}

// Обработка сообщений для ИИ
async function handleMessage(msg) {
    const userId = msg.from.id;
    const userMessage = msg.text;

    let activeChat = getActiveChat(userId);
    if (!activeChat) {
        createNewChat(userId);
        activeChat = getActiveChat(userId);
    }

    // Добавляем сообщение в историю
    activeChat.messages.push({ role: 'user', content: userMessage });

    // Показываем процесс "мышления"
    await showThinkingProcess(msg);

    // Потоковая отправка ответа
    await streamResponse(msg, activeChat);
}

// Статусы мышления
const THINKING_STATUSES = [
    '🤔 Анализирую вопрос...',
    '💭 Обдумываю ответ...',
    '🔍 Ищу информацию...',
    '✍️ Формулирую ответ...',
];

// Показать процесс мышления
async function showThinkingProcess(msg) {
    for (const status of THINKING_STATUSES) {
        await bot.sendChatAction(msg.chat.id, 'typing');
        await sleep(700);
    }
}

// Потоковая отправка ответа
async function streamResponse(msg, activeChat) {
    let fullResponse = '';
    let sentMessage = null;

    try {
        // Отправляем сообщение-заглушку
        sentMessage = await bot.sendMessage(msg.chat.id, '⏳');

        // Streaming запрос через OpenRouter API
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: MODEL,
                messages: activeChat.messages,
                stream: true
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                responseType: 'stream'
            }
        );

        const lastEditTime = { value: Date.now() };

        for await (const chunk of response.data) {
            const lines = chunk.toString().split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    try {
                        const data = JSON.parse(line.substring(6));
                        const content = data.choices?.[0]?.delta?.content || '';
                        if (content) {
                            fullResponse += content;

                            // Ограничиваем частоту редактирований
                            const now = Date.now();
                            if (now - lastEditTime.value >= 1000) {
                                await bot.editMessageText(fullResponse.substring(0, 4096), {
                                    chat_id: msg.chat.id,
                                    message_id: sentMessage.message_id
                                });
                                lastEditTime.value = now;
                            }
                        }
                    } catch (e) {
                        // Пропускаем некорректные JSON
                    }
                }
            }
        }

        // Финальное обновление
        if (fullResponse) {
            await bot.editMessageText(fullResponse.substring(0, 4096), {
                chat_id: msg.chat.id,
                message_id: sentMessage.message_id
            });
            activeChat.messages.push({ role: 'assistant', content: fullResponse });
            saveData();
        }

    } catch (error) {
        console.error('Ошибка при получении ответа от ИИ:', error.message);
        if (sentMessage) {
            await bot.editMessageText(`${fullResponse.substring(0, 4000)}\n\n_⚠️ Ошибка: ${error.message}_`, {
                chat_id: msg.chat.id,
                message_id: sentMessage.message_id,
                parse_mode: 'Markdown'
            });
        } else {
            await bot.sendMessage(msg.chat.id, `❌ Ошибка: ${error.message}`);
        }
        // Всё равно сохраняем ответ
        if (fullResponse) {
            activeChat.messages.push({ role: 'assistant', content: fullResponse });
            saveData();
        }
    }
}

// Утилита для задержки
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Загрузка данных при старте
loadData();
