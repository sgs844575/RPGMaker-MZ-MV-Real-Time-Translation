# LLM Auto Translator for RPG Maker MZ

<p align="center">
  <img src="https://img.shields.io/badge/RPG%20Maker-MZ-blue?style=flat-square" alt="RPG Maker MZ">
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/LLM-OpenAI%7CClaude%7CSiliconFlow-orange?style=flat-square" alt="LLM Support">
</p>

> **Real-time AI translation plugin for RPG Maker MZ games**
> 
> Inspired by [XUnity.AutoTranslator](https://github.com/bbepis/XUnity.AutoTranslator) - bringing the power of runtime translation to RPG Maker MZ.

[中文文档](#中文文档) | [English](#english)

---

## English

### Overview

LLM Auto Translator is a powerful plugin that enables real-time translation of Japanese RPG Maker MZ games using modern Large Language Models (LLMs). Similar to how XUnity.AutoTranslator revolutionized Unity game localization, this plugin brings the same capabilities to the RPG Maker ecosystem.

### Features

- 🚀 **Real-time Translation** - Translates game text on-the-fly as you play
- 💾 **Persistent Cache** - Saves translations to disk to avoid API costs for repeated text
- 🧠 **Context Memory** - Maintains conversation context for coherent translations
- 🌐 **Multiple LLM Support** - Works with OpenAI, Claude, Moonshot (Kimi), and SiliconFlow
- ⚡ **Async Processing** - Non-blocking translation doesn't affect game performance
- 🎮 **Smart Interception** - Hooks into Window_Base to catch all text rendering
- 📝 **Customizable Prompts** - External prompt file support for translation customization
- 🎯 **Selective Translation** - Choose what to translate (UI, dialogue, system text)
- 📚 **MTOOL Format Support** - Import pre-translated files in `{"原文": "译文"}` format

### Installation

1. Copy `js/plugins/LLM_AutoTranslator.js` to your game's `js/plugins/` folder
2. (Optional) Create `js/plugins/prompt.txt` for custom translation prompts
3. Enable the plugin in RPG Maker MZ Plugin Manager
4. Configure your API key in the plugin parameters

### Quick Start

#### 1. Get an API Key

**Recommended for China users:**
- [SiliconFlow](https://cloud.siliconflow.cn/) - Fast domestic access, affordable pricing

**International options:**
- [OpenAI](https://platform.openai.com/)
- [Anthropic Claude](https://console.anthropic.com/)
- [Moonshot](https://platform.moonshot.cn/)

#### 2. Configure Plugin

In RPG Maker MZ:
```
Tools → Plugin Manager → LLM_AutoTranslator

API Configuration:
  provider: siliconflow (or openai/claude/moonshot)
  apiKey: sk-your-api-key-here
  model: Qwen/Qwen2.5-7B-Instruct
  temperature: 0.3
  topP: 1.0
  maxTokens: 1000

Translation Configuration:
  targetLanguage: zh-CN
  enableCache: true
  translateDialogue: true
  translateUI: true
```

#### 3. Play and Translate

- Start your game
- Japanese text will be automatically translated
- Translations are cached to `translation_cache/translation_cache.json`
- Press `Ctrl+T` to toggle translation on/off
- Press `F9` to check status

### File Structure

```
your-game/
├── js/
│   └── plugins/
│       ├── LLM_AutoTranslator.js    # Main plugin
│       └── prompt.txt               # (Optional) Custom prompts
├── translation_cache/               # Auto-generated
│   └── translation_cache.json       # Translation database
└── ...
```

### Custom Prompts

Create `js/plugins/prompt.txt` to customize translation behavior:

```
You are a professional translator specializing in Japanese RPGs.
Translate the following text to Simplified Chinese.
Preserve all escape sequences like \n and \c[n].
Maintain the original tone and style.
Only return the translation, no explanations.
```

### Plugin Commands

| Command | Description |
|---------|-------------|
| `LLMTranslator Enable` | Enable translation |
| `LLMTranslator Disable` | Disable translation |
| `LLMTranslator Toggle` | Toggle translation state |
| `LLMTranslator ClearCache` | Clear translation cache |
| `LLMTranslator Debug` | Enable debug mode |

### MTOOL Translation File Support

Import pre-translated files in MTOOL format `{"原文": "译文"}`:

1. **File/Directory Structure**:
   ```
   translation_cache/
   └── zh-CN/                    # Target language folder
       ├── system.json          # System text translations
       ├── dialogue.json        # Dialogue translations
       └── items.json           # Item names and descriptions
   ```

2. Configure the path in plugin parameters (optional):
   ```
   mtoolFile: translation_cache/zh-CN/    # Load entire directory
   # OR
   mtoolFile: translations/zh.json        # Load single file
   ```

   If not configured, plugin will auto-load `translation_cache/${targetLanguage}/`

3. **File format example** (each JSON file):
   ```json
   {
     "こんにちは": "你好",
     "さようなら": "再见",
     "戦闘開始！": "战斗开始！"
   }
   ```

4. **Duplicate Handling**: Files are loaded in alphabetical order. If the same source text appears in multiple files, later translations override earlier ones (in-memory only, files are not modified).

5. Priority: MTOOL > Cache > API Translation

6. Export current cache to MTOOL format (F12 console):
   ```javascript
   llmExportMtool()  // Export all cached translations
   llmMtoolStatus()  // Check MTOOL status
   ```

### Code Detection (Auto Skip)

The plugin automatically detects and skips the following content types to save API tokens:

| Type | Example | Description |
|------|---------|-------------|
| RPG Maker Control Codes | `\i[123]`, `\c[2]`, `\n[1]` | Icon, color, name, variable references |
| Pure Punctuation | `...`, `!?`, `——` | Only symbols without actual text |
| File Paths | `C:\\game\\img.png`, `/usr/bin/node` | System paths |
| JavaScript Code | `function(){}`, `var x = 1` | Script snippets |
| HTML/XML Tags | `<div>`, `<br/>` | Markup tags only |
| URLs | `https://example.com` | Web links |
| UUID/Hash | `550e8400-e29b-41d4...` | Unique identifiers |

When debug mode is enabled (`llmDebug()`), skipped code will be logged to console.

### Console Commands

During gameplay, press `F12` and type:
```javascript
llmDebug()      // Enable verbose logging
llmStatus()     // Check plugin status
llmTest("text") // Test translation
```

### Cost Optimization

1. **Enable Cache** - Translations are saved locally after first API call
2. **Pre-translate** - Play through once to generate cache, then distribute the cache file
3. **Use Cheaper Models** - Qwen2.5-7B is sufficient for most translations
4. **Adjust Context Window** - Smaller context = fewer tokens = lower cost
5. **Auto Code Detection** - Automatically skips code snippets, saving tokens

---

## 中文文档

### 简介

LLM Auto Translator 是一个强大的 RPG Maker MZ 实时翻译插件，使用现代大语言模型（LLM）进行游戏文本翻译。本插件的灵感来源于 [XUnity.AutoTranslator](https://github.com/bbepis/XUnity.AutoTranslator)，它为 Unity 游戏带来了革命性的实时翻译方案，而我们将其核心思想移植到了 RPG Maker 生态中。

### 功能特点

- 🚀 **实时翻译** - 游戏运行时即时翻译文本
- 💾 **持久化缓存** - 翻译结果保存到本地，避免重复调用API产生费用
- 🧠 **上下文记忆** - 保持对话连贯性，提高翻译质量
- 🌐 **多API支持** - 支持 OpenAI、Claude、Moonshot（Kimi）、SiliconFlow
- ⚡ **异步处理** - 非阻塞式翻译，不影响游戏流畅度
- 🎮 **智能拦截** - 拦截 Window_Base 方法捕获所有文本渲染
- 📝 **自定义提示词** - 支持外部提示词文件，自定义翻译风格
- 🎯 **选择性翻译** - 可选择翻译 UI、对话、系统文本等
- 📚 **MTOOL格式支持** - 支持导入 `{"原文": "译文"}` 格式的预翻译文件

### 安装方法

1. 将 `js/plugins/LLM_AutoTranslator.js` 复制到游戏的 `js/plugins/` 目录
2. （可选）创建 `js/plugins/prompt.txt` 自定义翻译提示词
3. 在 RPG Maker MZ 插件管理器中启用插件
4. 在插件参数中配置 API 密钥

### 快速开始

#### 1. 获取 API 密钥

**中国区用户推荐：**
- [SiliconFlow（硅基流动）](https://cloud.siliconflow.cn/) - 国内访问快，价格便宜

**国际选项：**
- [OpenAI](https://platform.openai.com/)
- [Anthropic Claude](https://console.anthropic.com/)
- [Moonshot](https://platform.moonshot.cn/)

#### 2. 配置插件

在 RPG Maker MZ 中：
```
工具 → 插件管理 → LLM_AutoTranslator

API配置:
  provider: siliconflow (或 openai/claude/moonshot)
  apiKey: sk-your-api-key-here
  model: Qwen/Qwen2.5-7B-Instruct
  temperature: 0.3
  topP: 1.0
  maxTokens: 1000

翻译配置:
  targetLanguage: zh-CN
  enableCache: true
  translateDialogue: true
  translateUI: true
```

#### 3. 游玩与翻译

- 启动游戏
- 日文文本将自动翻译
- 翻译结果缓存到 `translation_cache/translation_cache.json`
- 按 `Ctrl+T` 切换翻译开关
- 按 `F9` 查看状态

### 文件结构

```
游戏目录/
├── js/
│   └── plugins/
│       ├── LLM_AutoTranslator.js    # 主插件
│       └── prompt.txt               # （可选）自定义提示词
├── translation_cache/               # 自动生成
│   └── translation_cache.json       # 翻译数据库
└── ...
```

### 自定义提示词

创建 `js/plugins/prompt.txt` 自定义翻译行为：

```
你是一个专业的日文RPG游戏翻译。
将以下文本翻译成简体中文。
保留所有转义序列如 \n 和 \c[n]。
保持原文的语气和风格。
只返回翻译结果，不要解释。
```

### 插件命令

| 命令 | 说明 |
|------|------|
| `LLMTranslator Enable` | 启用翻译 |
| `LLMTranslator Disable` | 禁用翻译 |
| `LLMTranslator Toggle` | 切换翻译状态 |
| `LLMTranslator ClearCache` | 清除翻译缓存 |
| `LLMTranslator Debug` | 开启调试模式 |

### MTOOL翻译文件支持

支持导入 MTOOL 格式的预翻译文件 `{"原文": "译文"}`：

1. **文件/目录结构**：
   ```
   translation_cache/
   └── zh-CN/                    # 目标语言文件夹
       ├── system.json          # 系统文本翻译
       ├── dialogue.json        # 对话翻译
       └── items.json           # 物品名称和描述
   ```

2. 在插件参数中配置路径（可选）：
   ```
   mtoolFile: translation_cache/zh-CN/    # 加载整个目录
   # 或
   mtoolFile: translations/zh.json        # 加载单个文件
   ```

   如果未配置，插件会自动加载 `translation_cache/${targetLanguage}/`

3. **文件格式示例**（每个JSON文件）：
   ```json
   {
     "こんにちは": "你好",
     "さようなら": "再见",
     "戦闘開始！": "战斗开始！"
   }
   ```

4. **重复处理**：文件按字母顺序加载。如果相同原文出现在多个文件中，后面的译文会覆盖前面的（仅内存中，不修改文件）。

5. 优先级：MTOOL翻译 > 缓存 > API翻译

6. 导出当前缓存为 MTOOL 格式（F12控制台）：
   ```javascript
   llmExportMtool()  // 导出所有缓存的翻译
   llmMtoolStatus()  // 查看MTOOL状态
   ```

### 代码检测（自动跳过）

插件自动检测并跳过以下内容类型，节省API Token：

| 类型 | 示例 | 说明 |
|------|------|------|
| RPG Maker控制字符 | `\i[123]`, `\c[2]`, `\n[1]` | 图标、颜色、名字、变量引用 |
| 纯标点符号 | `...`, `!?`, `——` | 只有符号没有实际文字 |
| 文件路径 | `C:\\game\\img.png`, `/usr/bin/node` | 系统路径 |
| JavaScript代码 | `function(){}`, `var x = 1` | 脚本片段 |
| HTML/XML标签 | `<div>`, `<br/>` | 标记标签 |
| URL | `https://example.com` | 网页链接 |
| UUID/哈希 | `550e8400-e29b-41d4...` | 唯一标识符 |

开启调试模式后（`llmDebug()`），跳过的代码将显示在控制台中。

### 控制台命令

游戏中按 `F12` 打开控制台，输入：
```javascript
llmDebug()      // 开启详细日志
llmStatus()     // 查看插件状态
llmTest("文本")  // 测试翻译
```

### 费用优化建议

1. **启用缓存** - 首次API调用后翻译结果会保存到本地
2. **预翻译** - 完整游玩一遍生成缓存，然后分发缓存文件给其他玩家
3. **使用便宜模型** - Qwen2.5-7B 对大多数翻译已经足够
4. **调整上下文窗口** - 上下文越小 = Token越少 = 费用越低
5. **自动代码检测** - 自动跳过代码片段，节省Token

---

## Architecture

### How It Works

```
Game displays Japanese text
        ↓
Window_Base.drawText() intercepted
        ↓
LLMTranslator.translate() called
        ↓
Check cache (disk & memory)
        ↓
Cache miss → Call LLM API
Cache hit  → Return cached translation
        ↓
Display translated text
        ↓
Save to cache file
```

### Technical Details

- **Text Interception**: Uses JavaScript prototype overriding to hook `Window_Base.prototype.drawText`
- **Caching Strategy**: Two-tier cache (Memory Map + JSON file)
- **Key Generation**: Prefix + Hash + Language for efficient lookup
- **Async Handling**: Promises for non-blocking API calls with fallback to original text

---

## Acknowledgments

### Special Thanks

This project is heavily inspired by **[XUnity.AutoTranslator](https://github.com/bbepis/XUnity.AutoTranslator)** created by **bbepis** and contributors.

XUnity.AutoTranslator revolutionized game localization by bringing real-time machine translation to Unity games. Their innovative approach to:
- Runtime text interception
- Translation caching
- Multiple backend support

...served as the foundation and inspiration for bringing similar capabilities to RPG Maker MZ.

**Thank you to the XUnity.AutoTranslator team for pioneering this field!** 🙏

### Other Credits

- [RPG Maker MZ](https://www.rpgmakerweb.com/) by Kadokawa
- [PixiJS](http://www.pixijs.com/) for the rendering engine
- All LLM providers for their translation APIs

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

1. Fork the repository
2. Make your changes
3. Test with RPG Maker MZ
4. Submit PR with description

### TODO

- [ ] Support for more LLM providers (DeepL, Google Translate)
- [ ] Local model support (llama.cpp)
- [ ] Batch pre-translation tool
- [ ] Translation memory import/export
- [ ] GUI configuration panel

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Disclaimer

This tool is for educational and personal use only. Please respect game developers' rights and only use this on games you own. The authors are not responsible for any misuse of this software.

---

<p align="center">
  Made with ❤️ for the RPG Maker community
</p>
