import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { themes, getRandomTheme } from './themes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========== ПРОВЕРКА API КЛЮЧА ==========
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
if (!DEEPSEEK_API_KEY) {
  console.error('❌ DEEPSEEK_API_KEY not set in environment variables');
  console.error('Please add it to GitHub Secrets or set it locally');
  process.exit(1);
}
console.log('✅ DeepSeek API key found, length:', DEEPSEEK_API_KEY.length);

const TEMPLATE_PATH = path.join(__dirname, '../templates/base.html');
const OUTPUT_DIR = path.join(__dirname, '../output');

// ========== ФУНКЦИЯ ВЫЗОВА DEEPSEEK API ==========
async function callDeepSeek(prompt) {
  console.log('📤 Calling DeepSeek API...');
  
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      max_tokens: 8192,
      temperature: 0.8,
      messages: [
        {
          role: 'system',
          content: 'You are an expert game developer specializing in browser-based simulator games. Generate complete, working HTML/CSS/JS code. Output ONLY the HTML code, no explanations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error (${response.status}): ${errorText}`);
  }
  
  const data = await response.json();
  console.log('✅ DeepSeek API response received');
  return data.choices[0].message.content;
}

// ========== ФУНКЦИЯ ГЕНЕРАЦИИ ПРОМПТА ==========
function buildPrompt(themeName, themeConfig) {
  return `Создай полностью рабочий HTML-файл для игры-симулятора "${themeConfig.name} ${themeConfig.emoji}".

## КОНФИГУРАЦИЯ:
- Основной ресурс: ${themeConfig.resource.name} (${themeConfig.resource.symbol}, старт: ${themeConfig.resource.start})
- Вторичный ресурс: ${themeConfig.secondary.name} (старт: ${themeConfig.secondary.start})
- Энергия: ${themeConfig.energy.name} (макс: ${themeConfig.energy.max})
- Оборудование: ${JSON.stringify(themeConfig.equipment, null, 2)}
- События: ${themeConfig.events.join(', ')}
- Цвета: основной ${themeConfig.colors.primary}, фон ${themeConfig.colors.secondary}, акцент ${themeConfig.colors.accent}

## ТРЕБОВАНИЯ:
1. Один полный HTML файл с CSS и JS внутри
2. Механики: накопление ресурсов, покупка улучшений, энергия, случайные события
3. Визуальные уведомления (тосты)
4. Сохранение в localStorage
5. Используй указанную цветовую схему
6. Интерфейс в стиле киберпанк с неоновыми акцентами

## ВАЖНО:
- ВЫВЕДИ ТОЛЬКО HTML КОД
- Начинай с <!DOCTYPE html>
- Заканчивай </html>
- Без пояснений вне кода`;
}

// ========== ОСНОВНАЯ ФУНКЦИЯ ГЕНЕРАЦИИ ==========
async function generateSimulator(themeName = null) {
  const selectedTheme = themeName || getRandomTheme();
  const themeConfig = themes[selectedTheme];
  
  if (!themeConfig) {
    throw new Error(`Theme "${selectedTheme}" not found`);
  }
  
  console.log(`🎮 Generating simulator: ${themeConfig.name}`);
  console.log(`📝 Building prompt...`);
  
  const prompt = buildPrompt(selectedTheme, themeConfig);
  
  let html;
  try {
    html = await callDeepSeek(prompt);
    console.log(`✅ Received response (${html.length} chars)`);
  } catch (error) {
    console.error('❌ DeepSeek API error:', error);
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
    provider: 'deepseek',
    version: "1.0.0"
  };
  await fs.writeJson(path.join(themeDir, 'metadata.json'), metadata, { spaces: 2 });
  
  console.log(`💾 Saved to: ${indexPath}`);
  
  return { theme: selectedTheme, path: indexPath, metadata };
}

// ========== ЗАПИСЬ В ИСТОРИЮ ==========
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
    url: `https://${process.env.GITHUB_REPOSITORY_OWNER || 'anikavojn'}.github.io/${process.env.GITHUB_REPOSITORY_NAME?.split('/')[1] || 'simulator-factory'}/${result.theme}/`
  });
  
  if (history.length > 100) history = history.slice(0, 100);
  
  await fs.writeJson(historyPath, history, { spaces: 2 });
}

// ========== ЗАПУСК ==========
async function main() {
  const theme = process.argv[2] || null;
  
  try {
    const result = await generateSimulator(theme);
    await updateHistory(result);
    
    console.log(`\n🎉 SUCCESS!`);
    console.log(`📁 Theme: ${result.theme}`);
    console.log(`📄 File: ${result.path}`);
    
    if (process.env.GITHUB_OUTPUT) {
      const fs = await import('fs');
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `theme=${result.theme}\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `path=${result.path}\n`);
    }
    
  } catch (error) {
    console.error('❌ Generation failed:', error);
    process.exit(1);
  }
}

main();