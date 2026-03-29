import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { themes, getRandomTheme } from './themes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_PATH = path.join(__dirname, '../templates/base.html');
const OUTPUT_DIR = path.join(__dirname, '../output');

// Проверка наличия API ключа
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY not set in environment variables');
  process.exit(1);
}

// Функция вызова Claude API
async function callClaude(prompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 8192,
      temperature: 0.8,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  
  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.content[0].text;
}

// Генерация промпта
function buildPrompt(themeName, themeConfig) {
  return `Ты — эксперт по созданию браузерных игр-симуляторов. Создай полностью рабочий HTML-файл для игры на тему "${themeConfig.name} ${themeConfig.emoji}".

## КОНФИГУРАЦИЯ ИГРЫ:
- Основной ресурс: ${themeConfig.resource.name} (${themeConfig.resource.symbol}, старт: ${themeConfig.resource.start})
- Вторичный ресурс: ${themeConfig.secondary.name} (старт: ${themeConfig.secondary.start})
- Энергия/ресурс: ${themeConfig.energy.name} (макс: ${themeConfig.energy.max})
- Оборудование: ${JSON.stringify(themeConfig.equipment, null, 2)}
- События: ${themeConfig.events.join(', ')}
- Цвета: основной ${themeConfig.colors.primary}, фон ${themeConfig.colors.secondary}, акцент ${themeConfig.colors.accent}

## ТРЕБОВАНИЯ:
1. Создай один полный HTML файл с CSS и JS внутри
2. Игра должна быть полностью функциональной
3. Включи базовые механики:
   - Накопление ресурсов
   - Покупка улучшений
   - Управление энергией
   - Случайные события
   - Визуальные уведомления (тосты)
   - Сохранение в localStorage
4. Используй предложенную цветовую схему
5. Добавь звуковые эффекты (Web Audio API)
6. Сделай интерфейс в стиле киберпанк/индастриал с неоновыми акцентами
7. Добавь кнопки для: покупки улучшений, активации бонусов, просмотра статистики

## ВАЖНО:
- ВЫВЕДИ ТОЛЬКО HTML КОД
- Начинай с <!DOCTYPE html>
- Заканчивай </html>
- Без пояснений вне кода

Создай игру-симулятор "${themeConfig.name}"!`;
}

// Основная функция
async function generateSimulator(themeName = null) {
  const selectedTheme = themeName || getRandomTheme();
  const themeConfig = themes[selectedTheme];
  
  if (!themeConfig) {
    throw new Error(`Theme "${selectedTheme}" not found`);
  }
  
  console.log(`🎮 Generating simulator: ${themeConfig.name}`);
  console.log(`📝 Building prompt...`);
  
  const prompt = buildPrompt(selectedTheme, themeConfig);
  console.log(`📤 Calling Claude API...`);
  
  let html;
  try {
    html = await callClaude(prompt);
    console.log(`✅ Received response (${html.length} chars)`);
  } catch (error) {
    console.error('❌ Claude API error:', error);
    throw error;
  }
  
  // Извлекаем HTML если есть пояснения
  const htmlMatch = html.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
  const finalHtml = htmlMatch ? htmlMatch[0] : html;
  
  // Создаем папку для темы
  const themeDir = path.join(OUTPUT_DIR, selectedTheme);
  await fs.ensureDir(themeDir);
  
  // Сохраняем HTML
  const indexPath = path.join(themeDir, 'index.html');
  await fs.writeFile(indexPath, finalHtml);
  
  // Сохраняем метаданные
  const metadata = {
    theme: selectedTheme,
    name: themeConfig.name,
    generatedAt: new Date().toISOString(),
    emoji: themeConfig.emoji,
    colors: themeConfig.colors,
    version: "1.0.0"
  };
  await fs.writeJson(path.join(themeDir, 'metadata.json'), metadata, { spaces: 2 });
  
  console.log(`💾 Saved to: ${indexPath}`);
  
  return { theme: selectedTheme, path: indexPath, metadata };
}

// Запись в историю
async function updateHistory(result) {
  const historyPath = path.join(OUTPUT_DIR, '../data/history.json');
  await fs.ensureDir(path.dirname(historyPath));
  
  let history = [];
  if (await fs.pathExists(historyPath)) {
    history = await fs.readJson(historyPath);
  }
  
  history.unshift({
    ...result,
    id: Date.now(),
    url: `https://${process.env.GITHUB_REPOSITORY_OWNER}.github.io/${process.env.GITHUB_REPOSITORY_NAME?.split('/')[1] || 'simulator-factory'}/${result.theme}/`
  });
  
  // Оставляем только последние 100 записей
  if (history.length > 100) history = history.slice(0, 100);
  
  await fs.writeJson(historyPath, history, { spaces: 2 });
}

// Запуск
async function main() {
  const theme = process.argv[2] || null;
  
  try {
    const result = await generateSimulator(theme);
    await updateHistory(result);
    
    console.log(`\n🎉 SUCCESS!`);
    console.log(`📁 Theme: ${result.theme}`);
    console.log(`📄 File: ${result.path}`);
    
    // Выводим для GitHub Actions
    console.log(`::set-output name=theme::${result.theme}`);
    console.log(`::set-output name=path::${result.path}`);
    
  } catch (error) {
    console.error('❌ Generation failed:', error);
    process.exit(1);
  }
}

main();