<h1 align="center">王佳鑫 · WJX LAB</h1>

<p align="center">个人简历与作品集 · 计算机视觉、文档智能与边缘部署</p>

<p align="center">
  <a href="https://106.52.107.206/"><img alt="打开在线网站" src="https://img.shields.io/badge/%E7%BD%91%E7%AB%99-%E5%9C%A8%E7%BA%BF%E9%A2%84%E8%A7%88-7047C6?style=for-the-badge"></a>
  <a href="#项目作品"><img alt="浏览项目作品" src="https://img.shields.io/badge/%E4%BD%9C%E5%93%81-%E9%A1%B9%E7%9B%AE%E6%B5%8F%E8%A7%88-147B6F?style=for-the-badge"></a>
  <a href="#本地预览"><img alt="查看本地运行说明" src="https://img.shields.io/badge/%E5%BC%80%E5%8F%91-%E6%9C%AC%E5%9C%B0%E9%A2%84%E8%A7%88-285AB8?style=for-the-badge"></a>
</p>

## 网页截图

![桌面端首页，左侧为姓名与简介，右侧为深紫色粒子背景](docs/images/home-desktop.png)

首屏粒子会随鼠标移动与页面滚动改变形态。启用系统的减少动态效果设置时，背景以静态画面显示。

<details>
<summary>查看手机端截图</summary>

![手机端首页，粒子背景在上方，姓名和项目入口在下方](docs/images/home-mobile.png)

</details>

## 项目作品

| 工业钢筋实时计数 | EasyPPT | 手写数字检测与识别 |
| :--- | :--- | :--- |
| ![钢筋端面检测结果](assets/rebar.webp) | ![手势控制演示画面](assets/gesture.webp) | ![手写数字识别结果](assets/digits.webp) |
| 用改进的 YOLOv8 检测钢筋端面，支持在 PDA 上实时计数。 | 通过手势控制演示与创作。 | 在实时画面中定位手写数字并显示识别结果。 |

## 本地预览

站点使用原生 HTML、CSS 和 JavaScript。克隆仓库后，用 Python 3 启动本地静态服务器。

```bash
git clone https://github.com/wjiaxin853-ctrl/wjxlab.cn.git
cd wjxlab.cn
python3 -m http.server 8000 --bind 127.0.0.1
```

启动后打开 [http://127.0.0.1:8000/](http://127.0.0.1:8000/)。

## 目录说明

| 文件 | 用途 |
| --- | --- |
| [`index.html`](index.html) | 简历、项目和研究内容 |
| [`style.css`](style.css) | 主题、响应式布局和打印样式 |
| [`site.js`](site.js) | Canvas 粒子背景与交互 |
| [`assets/`](assets/) | 网站图标与项目演示截图 |
| [`docs/images/`](docs/images/) | README 使用的网页截图 |

部署时，将 `index.html`、`style.css`、`site.js` 和 `assets/` 放到静态站点的发布根目录。
