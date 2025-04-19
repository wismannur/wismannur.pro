# 👋 Wisman Nur — Personal Portfolio & Open-Source Blog

A modern, fast, and fully open-source personal website to showcase my work as a **Frontend Software Engineer** and share my technical writings. Built with React, TypeScript, and Firebase.

![Website Preview](https://cdn.sundflow.cloud/f/68898e42500bc87b9)

🔗 **Live Site**: [wismannur.pro](https://wismannur.pro)  
⭐️ **Star this repo** if you like it — or better, [contribute](#contributing) and be part of the project!

---

## 🚀 Features

- 🎯 **Portfolio**: Highlighting my selected projects with in-depth case studies
- ✍️ **Blog Platform**: MDX-powered articles with custom components
- ⚙️ **CMS Dashboard**: Built-in system to manage blog & projects
- 📈 **Visitor Analytics**: Integrated with [Umami](https://umami.is)
- ⚡ **Optimized for Speed**: Powered by Vite for ultra-fast performance
- 📱 **Responsive Design**: Tailwind CSS for mobile-first layouts

---

## 🛠 Tech Stack

| Category       | Tech                                                  |
|----------------|-------------------------------------------------------|
| Frontend       | React 18, TypeScript, Vite                            |
| Styling        | Tailwind CSS, [shadcn/ui](https://ui.shadcn.dev)      |
| Content Layer  | MDX                                                   |
| Backend        | Firebase (Auth, Firestore, Storage)                  |
| Analytics      | Umami                                                 |
| Security       | Google reCAPTCHA v3                                   |

---

## 🧑‍💻 Getting Started

1. **Clone the repository**
```bash
git clone https://github.com/wismannur/personal-website.git
cd personal-website
```

2. **Install dependencies**
```bash
npm install
# or
pnpm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
# Then fill in your Firebase and other credentials
```

4. **Start development server**
```bash
npm run dev
```

## Environment Setup

1. Copy `.env.example` to create your environment file:
	```bash
	cp .env.example .env.development   # For development
	cp .env.example .env.production    # For production
	```

2. Fill in the environment variables with your actual values:
	- Firebase configuration from your Firebase Console
	- reCAPTCHA keys from Google reCAPTCHA Admin Console
	- Analytics IDs from your Umami dashboard
	- Other service-specific configurations

3. Never commit your actual `.env` files to version control

## Security Notes

- Keep your environment files secure and never commit them to version control
- Regularly rotate your API keys and access tokens
- Monitor your Firebase and reCAPTCHA usage for any suspicious activity
- Use environment-specific configurations for development and production

---

## 📂 Project Structure

```
src/
├── components/    # Reusable UI components
├── pages/         # Page components and routes
├── services/      # API and service integrations
├── lib/           # Utility functions
└── constants/     # Shared constants
```

---

## 🤝 Contributing

This project is open for contributions!

If you find bugs, have feature ideas, or want to improve the UI/UX, feel free to:
1. Fork the repo
2. Create a new branch
3. Submit a PR

I'll be happy to review and collaborate 💜

---

## 📝 License

MIT License © [Wisman Nur](https://github.com/wismannur)

---

## 📬 Contact

- 🌐 Website: [wismannur.pro](https://wismannur.pro)
- 🐙 GitHub: [@wismannur](https://github.com/wismannur)
- 🐦 Twitter/X: [@wismannur](https://x.com/wismannur)
- 💼 LinkedIn: [wismannur](https://linkedin.com/in/wismannur)



