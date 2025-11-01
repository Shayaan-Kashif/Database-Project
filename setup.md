# How to get Started 

1. First clone the repo using the following:
```bash
https://github.com/Shayaan-Kashif/Database-Project.git
```
2. Install all dependanciesby running the following:
```bash
npm install
```
3. To run the development server run:
```bash
npm run dev
```


## Project Structure 

```bash
Database-Project/
├── backend/                     # Backend logic 
│
├── frontend/                    # Next.js + ShadCN UI frontend
│   ├── app/                     # Next.js App Router (pages, routes, layouts)
│   ├── components/              # Reusable UI & feature-level components
│   │   ├── ui/                  # ShadCN base UI components (building blocks)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── field.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   └── separator.tsx
│   │   └── login-form.tsx       # Custom login form built using ShadCN UI
│   │
│   ├── lib/                     # Utility functions and shared helpers
│   │   └── utils.ts             # Tailwind `cn()` class merging helper
│   │
│   ├── public/                  # Static assets (images, icons, etc.)
│   ├── components.json          # ShadCN configuration file
│   ├── tailwind.config.js       # Tailwind CSS config (auto-linked with ShadCN)
│   ├── next.config.ts           # Next.js configuration
│   ├── package.json             # Frontend dependencies
│   ├── postcss.config.mjs       # PostCSS config
│   ├── tsconfig.json            # TypeScript configuration
│   └── README.md                # Frontend-specific documentation
│
├── setup.md                     # Setup instructions or environment setup notes
└── README.md                    # Root project overview (this file)

```