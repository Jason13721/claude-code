# 什么是 Transformer？—— 一部用 JavaScript 逐帧“画”出来的科普视频

一部约 10 分钟、1080p/30fps 的中文科普视频，面向高中生，从“猜下一个词”讲到注意力机制的数学细节。

**画面**完全由 JavaScript + Canvas 2D 代码绘制（没有任何素材图片）；**配音**由本地神经网络 TTS 生成；**背景音乐与音效**由 Python 程序实时合成。整个视频可以一键从源码重新生成。

## 内容大纲（12 章）

| # | 章节 | 讲了什么 |
|---|------|---------|
| 0 | 开场 | ChatGPT 的“黑盒子”、2017 年论文 *Attention Is All You Need*、路线图 |
| 1 | 一个猜词游戏 | 语言模型 = 预测下一个词的概率分布；自回归生成 |
| 2 | 把文字变成数字 | 词元 (token)、词表编号、词向量 (embedding)；3D 词向量空间；国王 − 男人 + 女人 ≈ 女王；GPT-3 的 12288 维 |
| 3 | 数学小课堂：点积 | 代数定义 a₁b₁+a₂b₂+a₃b₃，几何意义 \|a\|\|b\|cosθ，旋转向量实时演示正/零/负 |
| 4 | 上下文的难题 | 一词多义（苹果）；RNN 的“传话游戏”：健忘 + 慢；Transformer：所有词同时互看 |
| 5 | 注意力：Q、K、V | “它”指代谁；Query/Key/Value 的图书馆比喻；x·W_Q 矩阵乘法逐列演示 |
| 6 | 一步一步算注意力 | 真实数字走完 ① 点积打分 ② ÷√d ③ softmax(eˣ/Σeˣ) ④ 加权平均；指数放大差距；完整公式逐项拆解；矩阵并行 + GPU；注意力热力图；因果掩码 |
| 7 | 多头注意力 | 语法/指代/邻居/因果四个头各看各的；Concat + W_O；8 头 vs 96 头 |
| 8 | 位置编码 | “狗咬人 vs 人咬狗”；词向量 + 位置向量；多频正弦波 ≈ 钟表指针；PE 热力图“指纹” |
| 9 | 前馈网络与残差 | d → 4d → d；ReLU = max(0,x)；前馈层存储知识；残差“高速公路” + 层归一化 |
| 10 | 堆叠起来，输出答案 | 模块 ×6 → ×96；越高越抽象；与词表点积 → softmax → 下一个词；编码器 vs 解码器（GPT 只用解码器） |
| 11 | 它是怎么学会的？ | 1750 亿参数；损失 = −log p；梯度下降 θ ← θ − η∂L/∂θ；训练曲线与输出质量演变 |
| 12 | 总结 | 全流程图、应用版图、注意力“和弦图”、片尾 |

所有注意力数字（分数、缩放、eˣ、softmax 权重、热力图、掩码后重新归一化）都是代码里**真实计算**出来的，不是随手编的。

## 快速观看

- 成片：`out/transformer.mp4`（由 `npm run build` 生成）
- 交互式播放器：`npm run serve` 后打开 <http://localhost:8080/>，动画在浏览器里实时渲染，可以拖动进度条；
  `?scene=attn1` 可直接跳到某一章（场景 id 见 `src/scenes*.js`）。

## 目录结构

```
index.html          交互式播放器（也是离线渲染用的页面）
src/engine.js       动画引擎：缓动、绘图原语（芯片、向量、矩阵、箭头…）、时间线
src/common.js       公用组件：公式排版器（分数/根号/上下标）、图标、神经网络图
src/scenes1-3.js    12 章的旁白文本 + 每一帧的绘制函数（纯函数：画面 = f(时间)）
src/player.js       背景、章节卡、字幕、进度条、场景淡入淡出
tools/timeline.mjs  在 Node 中加载场景脚本，导出旁白 / 时间轴
tools/tts.py        sherpa-onnx + MeloTTS 本地中英混合配音（带自定义英文词典）
tools/asr_check.py  用离线 Paraformer 语音识别回听配音，检查发音
tools/mix.py        合成背景音乐（和弦铺底 + 琶音）、章节音效，旁白闪避混音
tools/render.mjs    多个无头 Chromium 并行逐帧渲染 → ffmpeg 编码 → 合成音轨
tools/preview.mjs   渲染任意时刻的静帧，用于检查画面
```

## 从源码重新生成

依赖：Node ≥ 18、Python 3、ffmpeg、Chromium（Playwright）。

```bash
npm install
pip install sherpa-onnx soundfile numpy scipy

# 下载 TTS 模型（约 170 MB）
mkdir -p models && cd models
curl -LO https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-melo-tts-zh_en.tar.bz2
tar xjf vits-melo-tts-zh_en.tar.bz2 && cd ..

npm run build        # 旁白 → TTS → 时间轴 → 混音 → 并行渲染，输出 out/transformer.mp4
```

`tools/render.mjs` 默认使用 `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`，如路径不同请修改 `tools/preview.mjs` 中的 `executablePath`。

画面与声音严格同步的原理：每句旁白先合成语音、测出真实时长，写入 `build/timing.js`；动画里的每个动作都挂在“第 i 句开始后 x 秒”的锚点上，所以改文案、换语速都不会错位。

## 附：网页版播放器

`web/index.html` 是可单独发布的播放器页面（字体走 Google Fonts）。发布前把运行时文件拷进去：

```bash
mkdir -p web/src web/fonts && cp src/*.js web/src/ && cp build/timing.js web/
ffmpeg -i build/audio.wav -b:a 128k web/audio.mp3
cp node_modules/katex/dist/fonts/KaTeX_{Math-Italic,Main-Regular,Main-Bold}.woff2 web/fonts/
```

`release/transformer-720p.mp4` 是提交进仓库的 720p 成片；1080p 版本由 `npm run build` 生成到 `out/`。
