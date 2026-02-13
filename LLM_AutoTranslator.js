//=============================================================================
// LLM_AutoTranslator.js
// LLM Auto Translator - Real-time translation plugin for RPG Maker MZ
//=============================================================================

/*:
 * @target MZ
 * @plugindesc LLM Auto Translator - Real-time translation with file persistence
 * @author niliuwuxie(sgs844575)
 *
 * @help
 * ============================================================================
 * LLM Auto Translator - 实时翻译插件
 * ============================================================================
 * 
 * 功能:
 * - 实时拦截并翻译游戏文本
 * - 支持多种LLM API（SiliconFlow, OpenAI, Claude, Moonshot）
 * - 翻译结果自动保存到文件，避免重复翻译费用
 * - 上下文记忆，保持对话连贯性
 * 
 * 插件命令:
 *   LLMTranslator Enable      - 启用翻译
 *   LLMTranslator Disable     - 禁用翻译
 *   LLMTranslator Toggle      - 切换翻译状态
 *   LLMTranslator ClearCache  - 清除翻译缓存
 *   LLMTranslator ShowPanel   - 显示设置面板
 *   LLMTranslator Debug       - 开启调试模式
 * 
 * 快捷键:
 *   Ctrl+T - 切换翻译开关
 *   F9     - 显示调试状态
 * 
 * 调试命令(控制台):
 *   llmDebug()  - 开启调试模式
 *   llmStatus() - 查看插件状态
 *   llmTest("文本") - 测试翻译
 * 
 * ============================================================================
 * 
 * @param provider
 * @text API提供商
 * @desc 选择使用的LLM服务提供商
 * @type select
 * @option SiliconFlow(硅基流动-中国)
 * @value siliconflow
 * @option OpenAI
 * @value openai
 * @option Claude(Anthropic)
 * @value claude
 * @option Moonshot(Kimi)
 * @value moonshot
 * @option Custom
 * @value custom
 * @default siliconflow
 * 
 * @param apiKey
 * @text API密钥
 * @desc 你的API密钥(sk-...)
 * @type string
 * @default 
 * 
 * @param apiUrl
 * @text API地址
 * @desc 自定义API端点(一般保持默认)
 * @type string
 * @default https://api.siliconflow.cn/v1/chat/completions
 * 
 * @param model
 * @text 模型名称
 * @desc 使用的AI模型
 * @type string
 * @default Qwen/Qwen2.5-7B-Instruct
 * 
 * @param temperature
 * @text Temperature
 * @desc 翻译创造性程度(0=保守,1=创意)
 * @type number
 * @min 0
 * @max 1
 * @decimals 2
 * @default 0.3
 * 
 * @param maxTokens
 * @text 最大Token数
 * @desc 单次请求最大token数
 * @type number
 * @min 1
 * @max 4096
 * @default 1000
 * 
 * @param targetLanguage
 * @text 目标语言
 * @desc 翻译成的目标语言
 * @type select
 * @option 简体中文
 * @value zh-CN
 * @option 繁体中文
 * @value zh-TW
 * @option English
 * @value en
 * @option Korean
 * @value ko
 * @default zh-CN
 * 
 * @param enableCache
 * @text 启用缓存
 * @desc 是否缓存翻译结果到文件
 * @type boolean
 * @default true
 * 
 * @param maxCacheSize
 * @text 最大缓存数
 * @desc 内存中缓存的最大条目数
 * @type number
 * @min 100
 * @max 100000
 * @default 10000
 * 
 * @param contextWindow
 * @text 上下文窗口
 * @desc 保持的上下文对话数量(0=不使用上下文)
 * @type number
 * @min 0
 * @max 50
 * @default 10
 * 
 * @param translateUI
 * @text 翻译UI
 * @desc 是否翻译界面文本(菜单等)
 * @type boolean
 * @default true
 * 
 * @param translateDialogue
 * @text 翻译对话
 * @desc 是否翻译对话文本
 * @type boolean
 * @default true
 * 
 * @param translateSystemText
 * @text 翻译系统文本
 * @desc 是否翻译系统消息(如"获得了物品")
 * @type boolean
 * @default false
 * 
 * @param showIndicator
 * @text 显示指示器
 * @desc 是否显示翻译状态指示器
 * @type boolean
 * @default true
 * 
 * @param indicatorX
 * @text 指示器X位置
 * @desc 状态指示器的X坐标
 * @type number
 * @default 10
 * 
 * @param indicatorY
 * @text 指示器Y位置
 * @desc 状态指示器的Y坐标
 * @type number
 * @default 10
 * 
 * @param toggleKey
 * @text 切换快捷键
 * @desc 切换翻译的快捷键(ctrl+t或F12等)
 * @type string
 * @default ctrl+t
 * 
 * @param blacklist
 * @text 黑名单正则
 * @desc 不翻译的文本正则(用|分隔)
 * @type string
 * @default \\i\\[\\d+\\]|^\\$|^[0-9]+$
 */

(function() {
    'use strict';

    const pluginName = 'LLM_AutoTranslator';
    
    //========================================================================
    // 文件工具函数
    //========================================================================
    function loadTextFile(filePath) {
        if (typeof require === 'undefined') return null;
        try {
            const fs = require('fs');
            const path = require('path');
            // 解析相对路径
            const basePath = window.location.pathname.replace(/(\/www|\/)[^\/]*$/, '');
            const decodedPath = decodeURIComponent(basePath).replace(/^\/([A-Za-z]:)/, '$1');
            const fullPath = path.join(decodedPath, filePath);
            
            if (fs.existsSync(fullPath)) {
                return fs.readFileSync(fullPath, 'utf8');
            }
        } catch (e) {
            console.warn('[LLMTranslator] 读取文件失败:', filePath, e.message);
        }
        return null;
    }
    
    // 加载提示词文件
    let systemPromptFromFile = loadTextFile('js/plugins/prompt.txt');
    
    //========================================================================
    // 参数解析
    //========================================================================
    const params = PluginManager.parameters(pluginName);
    
    const apiConfig = {
        provider: params.provider || 'siliconflow',
        apiKey: params.apiKey || '',
        apiUrl: params.apiUrl || 'https://api.siliconflow.cn/v1/chat/completions',
        model: params.model || 'Qwen/Qwen2.5-7B-Instruct',
        temperature: parseFloat(params.temperature) || 0.3,
        maxTokens: parseInt(params.maxTokens) || 1000
    };
    
    const translationConfig = {
        targetLanguage: params.targetLanguage || 'zh-CN',
        enableCache: params.enableCache !== 'false',
        maxCacheSize: parseInt(params.maxCacheSize) || 10000,
        contextWindow: parseInt(params.contextWindow) || 10,
        translateUI: params.translateUI !== 'false',
        translateDialogue: params.translateDialogue !== 'false',
        translateSystemText: params.translateSystemText === 'true'
    };
    
    const uiConfig = {
        showIndicator: params.showIndicator !== 'false',
        indicatorX: parseInt(params.indicatorX) || 10,
        indicatorY: parseInt(params.indicatorY) || 10,
        toggleKey: params.toggleKey || 'ctrl+t'
    };
    
    const blacklist = (params.blacklist || '\\i\\[\\d+\\]|^\\$|^[0-9]+$').split('|').filter(s => s);
    
    //========================================================================
    // 文件存储管理
    //========================================================================
    class TranslationStorage {
        constructor() {
            this._fs = null;
            this._path = null;
            this._cacheDir = '';
            this._cacheFile = '';
            this._init();
        }
        
        _init() {
            if (typeof require !== 'undefined') {
                try {
                    this._fs = require('fs');
                    this._path = require('path');
                    this._cacheDir = this._getCacheDirectory();
                    this._cacheFile = this._path.join(this._cacheDir, 'translation_cache.json');
                    this._ensureDirectoryExists();
                } catch (e) {
                    console.warn('[LLMTranslator] 文件存储初始化失败:', e.message);
                }
            }
        }
        
        _getCacheDirectory() {
            const basePath = window.location.pathname.replace(/(\/www|\/)[^\/]*$/, '');
            const decodedPath = decodeURIComponent(basePath);
            const cleanPath = decodedPath.replace(/^\/([A-Za-z]:)/, '$1');
            return this._path ? this._path.join(cleanPath, 'translation_cache') : './translation_cache';
        }
        
        _ensureDirectoryExists() {
            if (!this._fs) return;
            try {
                if (!this._fs.existsSync(this._cacheDir)) {
                    this._fs.mkdirSync(this._cacheDir, { recursive: true });
                }
            } catch (e) {
                console.error('[LLMTranslator] 创建缓存目录失败:', e.message);
            }
        }
        
        loadCache() {
            if (!this._fs) return null;
            try {
                if (this._fs.existsSync(this._cacheFile)) {
                    const data = this._fs.readFileSync(this._cacheFile, 'utf8');
                    const parsed = JSON.parse(data);
                    // 兼容旧版本格式 (version 1: object) 和新版本 (version 2: array)
                    if (parsed.version === 2 && Array.isArray(parsed.cache)) {
                        // 新版本：转换为 Map 可用的格式
                        const cacheObj = {};
                        for (const item of parsed.cache) {
                            cacheObj[item.key] = item.translated;
                        }
                        parsed.cache = cacheObj;
                    }
                    // 版本1已经是 object 格式，直接使用
                    return parsed;
                }
            } catch (e) {
                console.error('[LLMTranslator] 加载缓存失败:', e.message);
            }
            return null;
        }
        
        saveCache(cacheMap, stats) {
            if (!this._fs) return;
            try {
                // 将缓存转换为数组格式，便于阅读和编辑
                const cacheArray = [];
                for (const [key, value] of cacheMap) {
                    // key 格式: 原文前缀|hash|语言
                    const parts = key.split('|');
                    const original = parts[0];
                    cacheArray.push({
                        original: original,
                        translated: value,
                        key: key
                    });
                }
                const data = {
                    version: 2,
                    timestamp: Date.now(),
                    provider: apiConfig.provider,
                    targetLanguage: translationConfig.targetLanguage,
                    stats: stats,
                    cache: cacheArray
                };
                this._fs.writeFileSync(this._cacheFile, JSON.stringify(data, null, 2), 'utf8');
            } catch (e) {
                console.error('[LLMTranslator] 保存缓存失败:', e.message);
            }
        }
        
        clearCache() {
            if (!this._fs) return false;
            try {
                if (this._fs.existsSync(this._cacheFile)) {
                    this._fs.unlinkSync(this._cacheFile);
                    return true;
                }
            } catch (e) {
                console.error('[LLMTranslator] 删除缓存失败:', e.message);
            }
            return false;
        }
        
        getCachePath() {
            return this._cacheFile;
        }
    }
    
    //========================================================================
    // 翻译服务核心
    //========================================================================
    class LLMTranslatorService {
        constructor() {
            this._cache = new Map();
            this._contextQueue = [];
            this._pendingRequests = new Map();
            this._isTranslating = false;
            this._translationEnabled = true;
            this._debugMode = false;
            this._stats = {
                totalTranslated: 0,
                cacheHits: 0,
                apiCalls: 0,
                errors: 0
            };
            this._storage = new TranslationStorage();
            this._loadCacheFromFile();
            this._initProvider();
        }
        
        _loadCacheFromFile() {
            const data = this._storage.loadCache();
            if (data && data.cache) {
                if (data.provider === apiConfig.provider && 
                    data.targetLanguage === translationConfig.targetLanguage) {
                    let loadedCount = 0;
                    for (const [key, value] of Object.entries(data.cache)) {
                        this._cache.set(key, value);
                        loadedCount++;
                    }
                    if (data.stats) {
                        this._stats.totalTranslated = data.stats.totalTranslated || 0;
                        this._stats.cacheHits = data.stats.cacheHits || 0;
                    }
                    console.log(`[LLMTranslator] 从文件加载了 ${loadedCount} 条缓存记录`);
                } else {
                    console.log('[LLMTranslator] 缓存提供商/语言不匹配，重新创建缓存');
                }
            }
        }
        
        _saveCacheToFile() {
            this._storage.saveCache(this._cache, this._stats);
        }
        
        _debouncedSaveCache() {
            if (this._saveTimeout) {
                clearTimeout(this._saveTimeout);
            }
            this._saveTimeout = setTimeout(() => {
                this._saveCacheToFile();
            }, 5000);
        }
        
        _initProvider() {
            const provider = apiConfig.provider;
            this._apiEndpoints = {
                siliconflow: 'https://api.siliconflow.cn/v1/chat/completions',
                openai: 'https://api.openai.com/v1/chat/completions',
                claude: 'https://api.anthropic.com/v1/messages',
                moonshot: 'https://api.moonshot.cn/v1/chat/completions',
                custom: apiConfig.apiUrl
            };
            this._apiEndpoint = this._apiEndpoints[provider] || apiConfig.apiUrl;
            this._provider = provider;
        }
        
        isEnabled() {
            const hasKey = apiConfig.apiKey && apiConfig.apiKey.trim().length > 0;
            return this._translationEnabled && hasKey;
        }
        
        toggle() {
            this._translationEnabled = !this._translationEnabled;
            return this._translationEnabled;
        }
        
        enable() {
            this._translationEnabled = true;
        }
        
        disable() {
            this._translationEnabled = false;
        }
        
        clearCache() {
            this._cache.clear();
            this._contextQueue = [];
            this._storage.clearCache();
        }
        
        getStats() {
            return { ...this._stats };
        }
        
        getStatus() {
            const hasKey = apiConfig.apiKey && apiConfig.apiKey.trim().length > 0;
            return {
                enabled: this._translationEnabled,
                hasApiKey: hasKey,
                apiKeyPrefix: hasKey ? apiConfig.apiKey.substring(0, 10) + '...' : 'none',
                provider: this._provider,
                targetLang: translationConfig.targetLanguage,
                cacheSize: this._cache.size,
                isReady: this._translationEnabled && hasKey
            };
        }
        
        getCacheFilePath() {
            return this._storage.getCachePath();
        }
        
        setDebugMode(enabled) {
            this._debugMode = enabled;
            console.log('[LLMTranslator] 调试模式:', enabled ? '开启' : '关闭');
        }
        
        _isBlacklisted(text) {
            if (!text || typeof text !== 'string') return true;
            if (text.trim().length === 0) return true;
            
            for (const pattern of blacklist) {
                try {
                    const regex = new RegExp(pattern);
                    if (regex.test(text)) return true;
                } catch (e) {
                    if (text.includes(pattern)) return true;
                }
            }
            return false;
        }
        
        _generateCacheKey(text) {
            // 使用简化原文 + hash 作为 key，既便于阅读又能精确匹配
            const maxPrefixLength = 50;
            const prefix = text.trim().substring(0, maxPrefixLength);
            // 计算后半部分的 hash 确保唯一性
            let hash = 0;
            for (let i = 0; i < text.length; i++) {
                hash = ((hash << 5) - hash) + text.charCodeAt(i);
                hash = hash & hash;
            }
            return prefix + '|' + hash.toString(16) + '|' + translationConfig.targetLanguage;
        }
        
        _getContext() {
            return this._contextQueue.slice(-translationConfig.contextWindow);
        }
        
        _addContext(original, translated) {
            this._contextQueue.push({ original, translated });
            if (this._contextQueue.length > translationConfig.contextWindow) {
                this._contextQueue.shift();
            }
        }
        
        _buildRequestBody(text, context) {
            // 使用外部提示词文件（如果存在），否则使用默认提示词
            let systemPrompt;
            if (systemPromptFromFile) {
                // 使用从 prompt.txt 加载的提示词
                systemPrompt = systemPromptFromFile;
            } else {
                // 使用默认简单提示词
                const langNames = {
                    'zh-CN': '简体中文',
                    'zh-TW': '繁体中文',
                    'en': 'English',
                    'ko': 'Korean',
                    'ja': '日本語'
                };
                const targetLangName = langNames[translationConfig.targetLanguage] || translationConfig.targetLanguage;
                systemPrompt = `You are a professional game translator. Translate the following Japanese text to ${targetLangName}. Maintain the tone, style, and context. Preserve escape sequences like \\n, \\c[n], etc. Only return the translated text without explanations.`;
            }
            
            // 添加上下文信息（如果有）
            let fullPrompt = '';
            if (context && context.length > 0) {
                fullPrompt += 'Previous translations for context:\n';
                for (const ctx of context) {
                    fullPrompt += `Japanese: ${ctx.original}\nTranslation: ${ctx.translated}\n\n`;
                }
                fullPrompt += '---\n\n';
            }
            fullPrompt += `Current text to translate:\n${text}`;
            
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: fullPrompt }
            ];
            
            return {
                model: apiConfig.model,
                messages: messages,
                temperature: apiConfig.temperature,
                max_tokens: apiConfig.maxTokens
            };
        }
        
        async _sendRequest(text) {
            const cacheKey = this._generateCacheKey(text);
            
            if (translationConfig.enableCache && this._cache.has(cacheKey)) {
                this._stats.cacheHits++;
                return this._cache.get(cacheKey);
            }
            
            if (this._pendingRequests.has(cacheKey)) {
                return await this._pendingRequests.get(cacheKey);
            }
            
            const promise = this._doTranslate(text, cacheKey);
            this._pendingRequests.set(cacheKey, promise);
            
            try {
                return await promise;
            } finally {
                this._pendingRequests.delete(cacheKey);
            }
        }
        
        async _doTranslate(text, cacheKey) {
            try {
                this._stats.apiCalls++;
                
                if (this._debugMode) {
                    console.log('[LLMTranslator] API调用:', text.substring(0, 50));
                }
                
                const context = this._getContext();
                const body = this._buildRequestBody(text, context);
                
                const headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiConfig.apiKey}`
                };
                
                if (this._provider === 'claude') {
                    headers['x-api-key'] = apiConfig.apiKey;
                    headers['anthropic-version'] = '2023-06-01';
                    delete headers['Authorization'];
                }
                
                const response = await fetch(this._apiEndpoint, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(body)
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }
                
                const data = await response.json();
                let translated = '';
                
                if (this._provider === 'claude') {
                    translated = data.content?.[0]?.text || text;
                } else {
                    translated = data.choices?.[0]?.message?.content || text;
                }
                
                translated = translated.trim();
                
                if (translationConfig.enableCache) {
                    this._cache.set(cacheKey, translated);
                    this._debouncedSaveCache();
                }
                
                this._addContext(text, translated);
                this._stats.totalTranslated++;
                
                if (this._debugMode) {
                    console.log('[LLMTranslator] 翻译完成:', translated.substring(0, 50));
                }
                
                return translated;
            } catch (error) {
                this._stats.errors++;
                console.error('[LLMTranslator] 翻译错误:', error.message);
                return text;
            }
        }
        
        translate(text) {
            if (this._debugMode) {
                console.log('[LLMTranslator.translate] 输入:', text?.substring(0, 40));
            }
            
            if (!this.isEnabled()) {
                if (this._debugMode) console.log('[LLMTranslator] 未启用');
                return text;
            }
            
            if (this._isBlacklisted(text)) {
                if (this._debugMode) console.log('[LLMTranslator] 黑名单跳过');
                return text;
            }
            
            const cacheKey = this._generateCacheKey(text);
            
            // 检查缓存
            if (translationConfig.enableCache && this._cache.has(cacheKey)) {
                this._stats.cacheHits++;
                const cached = this._cache.get(cacheKey);
                if (this._debugMode) {
                    console.log('[LLMTranslator] 缓存命中!');
                    console.log('  原文:', text?.substring(0, 40));
                    console.log('  译文:', cached?.substring(0, 40));
                }
                // 缓存命中直接返回翻译，不需要异步刷新
                return cached;
            }
            
            // 缓存未命中，发起异步翻译
            if (this._debugMode) console.log('[LLMTranslator] 缓存未命中，发起API请求');
            
            this._sendRequest(text).then(translated => {
                if (this._debugMode) {
                    console.log('[LLMTranslator] 异步翻译完成:', translated?.substring(0, 40));
                }
                // 翻译完成后刷新所有窗口
                this._refreshAllWindows();
            });
            
            // 首次返回原文，等待异步翻译完成后刷新
            return text;
        }
        
        _refreshAllWindows() {
            const scene = SceneManager._scene;
            if (!scene) return;
            
            // 刷新消息窗口
            if (scene._messageWindow && scene._messageWindow._forceUpdateMessageText) {
                scene._messageWindow._forceUpdateMessageText();
            }
            
            // 刷新姓名框
            if (scene._nameBoxWindow) {
                scene._nameBoxWindow.refresh();
            }
            
            // 刷新其他窗口
            if (scene._windowLayer) {
                for (const win of scene._windowLayer.children || []) {
                    if (win.refresh && !(win instanceof Window_Message)) {
                        win.refresh();
                    }
                }
            }
        }
        
        async translateAsync(text) {
            if (!this.isEnabled() || this._isBlacklisted(text)) {
                return text;
            }
            return await this._sendRequest(text);
        }
    }
    
    // 全局实例
    window.$llmTranslator = new LLMTranslatorService();
    
    //========================================================================
    // 插件命令
    //========================================================================
    PluginManager.registerCommand(pluginName, 'Enable', () => {
        $llmTranslator.enable();
        console.log('[LLMTranslator] 已启用');
    });
    
    PluginManager.registerCommand(pluginName, 'Disable', () => {
        $llmTranslator.disable();
        console.log('[LLMTranslator] 已禁用');
    });
    
    PluginManager.registerCommand(pluginName, 'Toggle', () => {
        const state = $llmTranslator.toggle();
        console.log('[LLMTranslator] 状态:', state ? '启用' : '禁用');
    });
    
    PluginManager.registerCommand(pluginName, 'ClearCache', () => {
        $llmTranslator.clearCache();
        console.log('[LLMTranslator] 缓存已清除');
    });
    
    PluginManager.registerCommand(pluginName, 'ShowPanel', () => {
        SceneManager.push(Scene_LLMTranslatorPanel);
    });
    
    PluginManager.registerCommand(pluginName, 'Debug', () => {
        $llmTranslator.setDebugMode(true);
    });
    
    //========================================================================
    // 文本拦截
    //========================================================================
    const _Window_Base_drawText = Window_Base.prototype.drawText;
    const _Window_Base_drawTextEx = Window_Base.prototype.drawTextEx;
    const _Window_Message_startMessage = Window_Message.prototype.startMessage;
    const _Window_NameBox_start = Window_NameBox.prototype.start;
    
    function shouldTranslateWindow(win) {
        if (!$llmTranslator.isEnabled()) return false;
        
        if (win instanceof Window_Message) {
            return translationConfig.translateDialogue;
        }
        if (win instanceof Window_NameBox) {
            return translationConfig.translateDialogue;
        }
        return translationConfig.translateUI;
    }
    
    Window_Base.prototype.drawText = function(text, x, y, maxWidth, align) {
        if (shouldTranslateWindow(this) && typeof text === 'string') {
            const translated = $llmTranslator.translate(text);
            if ($llmTranslator._debugMode && text !== translated) {
                console.log('[LLMTranslator.drawText]');
                console.log('  原文:', text.substring(0, 30));
                console.log('  译文:', translated.substring(0, 30));
            }
            _Window_Base_drawText.call(this, translated, x, y, maxWidth, align);
            return;
        }
        _Window_Base_drawText.call(this, text, x, y, maxWidth, align);
    };
    
    Window_Base.prototype.drawTextEx = function(text, x, y, width) {
        if (shouldTranslateWindow(this) && typeof text === 'string') {
            const translated = $llmTranslator.translate(text);
            if ($llmTranslator._debugMode && text !== translated) {
                console.log('[LLMTranslator.drawTextEx]');
                console.log('  原文:', text.substring(0, 30));
                console.log('  译文:', translated.substring(0, 30));
            }
            return _Window_Base_drawTextEx.call(this, translated, x, y, width);
        }
        return _Window_Base_drawTextEx.call(this, text, x, y, width);
    };
    
    Window_Message.prototype.startMessage = function() {
        if (shouldTranslateWindow(this) && !this._skipTranslationCheck) {
            const originalText = $gameMessage.allText();
            
            // 先检查缓存
            const cacheKey = $llmTranslator._generateCacheKey(originalText);
            if (translationConfig.enableCache && $llmTranslator._cache.has(cacheKey)) {
                // 缓存命中，直接替换文本
                const translated = $llmTranslator._cache.get(cacheKey);
                if (translated !== originalText) {
                    $gameMessage._texts = translated.split('\n');
                }
                if ($llmTranslator._debugMode) {
                    console.log('[LLMTranslator] 消息缓存命中，直接使用翻译');
                }
            } else {
                // 缓存未命中，异步翻译
                if ($llmTranslator._debugMode) {
                    console.log('[LLMTranslator] 消息缓存未命中，异步翻译');
                }
                
                // 保存原始文本用于后续更新
                this._originalMessageText = originalText;
                
                $llmTranslator.translateAsync(originalText).then(translated => {
                    if (translated !== originalText && this.isOpen()) {
                        // 更新游戏消息文本
                        $gameMessage._texts = translated.split('\n');
                        
                        // 强制刷新显示
                        this._forceUpdateMessageText();
                    }
                }).catch(err => {
                    console.error('[LLMTranslator] 消息翻译失败:', err);
                });
            }
        }
        
        // 重置跳过标志
        this._skipTranslationCheck = false;
        
        _Window_Message_startMessage.call(this);
    };
    
    // 强制更新消息窗口显示的文本
    Window_Message.prototype._forceUpdateMessageText = function() {
        if ($llmTranslator._debugMode) {
            console.log('[LLMTranslator] 强制更新消息文本');
        }
        
        // 设置标志，避免重新触发翻译
        this._skipTranslationCheck = true;
        
        // 终止当前显示
        this._textState = null;
        this._waitCount = 0;
        this.pause = false;
        
        // 清除内容
        this.contents.clear();
        if (this.contentsBack) this.contentsBack.clear();
        
        // 重新开始消息（此时会读取已翻译的文本，且跳过翻译检查）
        this.startMessage();
    };
    
    Window_NameBox.prototype.start = function() {
        if (shouldTranslateWindow(this)) {
            const originalName = $gameMessage.speakerName();
            if (originalName) {
                $llmTranslator.translateAsync(originalName).then(translated => {
                    if (translated !== originalName) {
                        this._text = translated;
                        this.refresh();
                    }
                });
            }
        }
        _Window_NameBox_start.call(this);
    };
    
    //========================================================================
    // 设置面板
    //========================================================================
    class Scene_LLMTranslatorPanel extends Scene_MenuBase {
        create() {
            super.create();
            this.createWindowLayer();
            this.createMainWindow();
            this.createStatusWindow();
        }
        
        createMainWindow() {
            const rect = new Rectangle(100, 100, Graphics.boxWidth - 200, Graphics.boxHeight - 200);
            this._mainWindow = new Window_LLMTranslatorPanel(rect);
            this._mainWindow.setHandler('cancel', this.popScene.bind(this));
            this._mainWindow.setHandler('toggle', this.onToggle.bind(this));
            this._mainWindow.setHandler('clearCache', this.onClearCache.bind(this));
            this.addWindow(this._mainWindow);
        }
        
        createStatusWindow() {
            const rect = new Rectangle(100, 50, Graphics.boxWidth - 200, 80);
            this._statusWindow = new Window_LLMTranslatorStatus(rect);
            this.addWindow(this._statusWindow);
        }
        
        onToggle() {
            $llmTranslator.toggle();
            this._mainWindow.refresh();
            this._statusWindow.refresh();
        }
        
        onClearCache() {
            $llmTranslator.clearCache();
            this._statusWindow.refresh();
        }
    }
    
    window.Scene_LLMTranslatorPanel = Scene_LLMTranslatorPanel;
    
    class Window_LLMTranslatorPanel extends Window_Command {
        makeCommandList() {
            const status = $llmTranslator.isEnabled() ? 'ON' : 'OFF';
            this.addCommand('翻译开关: ' + status, 'toggle');
            this.addCommand('清除缓存', 'clearCache');
            this.addCommand('返回', 'cancel');
        }
        
        refresh() {
            this.clearCommandList();
            this.makeCommandList();
            super.refresh();
        }
    }
    
    class Window_LLMTranslatorStatus extends Window_Base {
        initialize(rect) {
            super.initialize(rect);
            this._lastCacheSize = 0;
            this.refresh();
        }
        
        refresh() {
            this.contents.clear();
            const stats = $llmTranslator.getStats();
            const status = $llmTranslator.getStatus();
            
            this.drawText(`状态: ${status.isReady ? '就绪' : '未就绪'}`, 0, 0, 200);
            this.drawText(`缓存: ${status.cacheSize} 条`, 200, 0, 200);
            this.drawText(`API调用: ${stats.apiCalls}`, 400, 0, 200);
            this.drawText(`节省: ${stats.cacheHits}`, 600, 0, 200);
            
            this.contents.fontSize = 18;
            this.drawText(`密钥: ${status.apiKeyPrefix}`, 0, 36, 400);
            this.drawText(`提供商: ${status.provider}`, 400, 36, 300);
            this.resetFontSettings();
        }
    }
    
    //========================================================================
    // 状态指示器
    //========================================================================
    class Sprite_TranslationIndicator extends Sprite {
        initialize() {
            super.initialize();
            this._lastStatus = null;
            this.createBitmap();
            this.x = uiConfig.indicatorX;
            this.y = uiConfig.indicatorY;
            this.update();
        }
        
        createBitmap() {
            this.bitmap = new Bitmap(120, 24);
        }
        
        update() {
            super.update();
            const status = $llmTranslator.isEnabled();
            if (this._lastStatus !== status) {
                this._lastStatus = status;
                this.refresh();
            }
        }
        
        refresh() {
            this.bitmap.clear();
            const enabled = $llmTranslator.isEnabled();
            const ready = $llmTranslator.getStatus().isReady;
            const text = ready ? (enabled ? '[翻译ON]' : '[翻译OFF]') : '[未配置]';
            const color = ready ? (enabled ? '#00FF00' : '#FF0000') : '#888888';
            
            this.bitmap.textColor = color;
            this.bitmap.fontSize = 16;
            this.bitmap.drawText(text, 0, 0, 120, 24);
        }
    }
    
    const _Scene_Base_createWindowLayer = Scene_Base.prototype.createWindowLayer;
    Scene_Base.prototype.createWindowLayer = function() {
        _Scene_Base_createWindowLayer.call(this);
        if (uiConfig.showIndicator) {
            this._translationIndicator = new Sprite_TranslationIndicator();
            this.addChild(this._translationIndicator);
        }
    };
    
    //========================================================================
    // 快捷键
    //========================================================================
    const _SceneManager_onKeyDown = SceneManager.onKeyDown;
    SceneManager.onKeyDown = function(event) {
        _SceneManager_onKeyDown.call(this, event);
        
        if (event.keyCode === 120) { // F9
            const status = $llmTranslator.getStatus();
            console.log('[LLMTranslator] 状态:', status);
            return;
        }
        
        const toggleKey = uiConfig.toggleKey.toLowerCase();
        const parts = toggleKey.split('+');
        
        let keyMatch = false;
        if (parts.length === 2) {
            const mod = parts[0].trim();
            const key = parts[1].trim();
            const modPressed = (mod === 'ctrl' && event.ctrlKey) ||
                              (mod === 'alt' && event.altKey) ||
                              (mod === 'shift' && event.shiftKey);
            keyMatch = modPressed && event.keyCode === key.toUpperCase().charCodeAt(0);
        } else if (parts.length === 1) {
            keyMatch = event.keyCode === toggleKey.toUpperCase().charCodeAt(0);
        }
        
        if (keyMatch) {
            event.preventDefault();
            const state = $llmTranslator.toggle();
            console.log('[LLMTranslator] 切换:', state ? '启用' : '禁用');
        }
    };
    
    //========================================================================
    // 启动日志
    //========================================================================
    const status = $llmTranslator.getStatus();
    console.log('%c[LLMTranslator] 插件已加载', 'color: #00FF00; font-weight: bold');
    console.log('[LLMTranslator] 状态:', status.isReady ? '✓ 就绪' : '✗ 未就绪(API密钥未配置)');
    console.log('[LLMTranslator] 提供商:', status.provider);
    console.log('[LLMTranslator] 缓存:', status.cacheSize, '条');
    if (systemPromptFromFile) {
        console.log('[LLMTranslator] ✓ 已加载外部提示词: js/plugins/prompt.txt');
    } else {
        console.log('[LLMTranslator] ℹ 使用默认提示词 (如需自定义请创建 js/plugins/prompt.txt)');
    }
    
    if (!status.hasApiKey) {
        console.warn('%c[LLMTranslator] 警告: 请在插件参数中设置API密钥!', 'color: #FF6600');
    }
    
    // 控制台命令
    window.llmDebug = () => $llmTranslator.setDebugMode(true);
    window.llmStatus = () => console.table($llmTranslator.getStatus());
    window.llmTest = (text) => {
        text = text || '测试文本';
        console.log('[LLMTranslator] 测试:', text);
        console.log('[LLMTranslator] 结果:', $llmTranslator.translate(text));
    };
    
})();
