# 🌈 Rainbow Lab - 彩虹实验室

**Rainbow Lab** 是一个专为青少年设计的交互式物理教学应用，旨在通过可视化的方式揭示彩虹形成的奥秘。

本项目结合了**微观光学模拟**（折射、反射、色散）与**宏观地理视角**（观察者、太阳角度、反日点），帮助用户直观理解为什么彩虹是圆的、为什么是七彩的、以及为什么我们必须背对太阳才能看到它。

此外，应用还内置了基于 **Google Gemini** 的 **AI 光之博士**，随时解答孩子们关于光学的奇思妙想。

## ✨ 核心功能 (Features)

### 1. 🔬 微观视角 (Micro View)
*   **交互式水滴模拟**：拖动滑块改变光线射入水滴的位置。
*   **实时光路计算**：基于斯涅尔定律（Snell's Law）和反射定律，实时渲染光线路径。
*   **色散演示**：一键开启光谱模式，观察白光如何分解为七色光。
*   **主虹与副虹**：展示光线在水滴内一次反射（主虹）与两次反射（副虹/霓）的区别，以及颜色顺序的反转。

### 2. 🌍 宏观视角 (Macro View)
*   **上帝视角场景**：直观展示太阳、观察者、雨幕的位置关系。
*   **太阳高度角控制**：拖动太阳改变高度，观察彩虹位置的变化（42°角原理）。
*   **不可见区域**：演示当太阳高度超过42°时，为何彩虹会沉入地平线以下。

### 3. 🤖 AI 光之博士 (AI Tutor)
*   **个性化教学**：基于 Google Gemini API 的智能助手。
*   **角色扮演**：以"光之博士"的身份，用生动有趣的语言回答青少年的提问。

### 4. 📱 响应式设计 (Responsive Design)
*   **移动端优先**：针对手机竖屏优化的操作布局，单手即可完成所有实验。
*   **桌面端适配**：利用大屏幕展示更清晰的光路细节。

## 🛠️ 技术栈 (Tech Stack)

*   **Frontend**: React 18, TypeScript, Tailwind CSS
*   **Rendering**: SVG (矢量图形渲染，保证物理连线的精确性)
*   **AI Integration**: Google Gemini API (`@google/genai`)
*   **Build Tool**: ESM (无需复杂构建工具，直接运行)

## 🚀 快速开始 (Getting Started)

本项目结构简单，核心逻辑位于 `App.tsx` 及 `components/` 目录下。

1.  **Clone 项目**
    ```bash
    git clone https://github.com/your-username/rainbow-lab.git
    ```

2.  **配置 API Key**
    本项目需要 Google Gemini API Key 才能使用 AI 问答功能。
    在代码运行环境中，确保 `process.env.API_KEY` 已设置。

3.  **运行**
    由于使用了 ESM 模块结构，您可以直接在支持 ESM 的环境（如 StackBlitz, CodeSandbox）中运行，或使用简单的静态文件服务器。

## 📖 物理原理 (Physics Behind)

*   **折射 (Refraction)**: 光从空气进入水（n ≈ 1.33）时速度变慢，路径发生偏折。蓝紫光折射率大，偏折多；红光折射率小，偏折少。
*   **反射 (Reflection)**: 光在水滴内部表面发生反射。
*   **最小偏向角 (Minimum Deviation Angle)**: 经过计算，红光的主虹出射角约为 42°，紫光约为 40°，这就是我们看到彩虹高度的原因。

---
*Created with ❤️ for Science Education.*
