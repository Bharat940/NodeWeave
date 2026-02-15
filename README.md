# NodeWeave

A powerful workflow automation platform built with Next.js that enables users to create, manage, and execute complex automation workflows through an intuitive visual interface.

## Overview

NodeWeave is a modern SaaS automation platform that allows users to build sophisticated workflows by connecting various triggers and actions through a visual node-based editor. The platform supports multiple integrations including AI models, messaging platforms, and developer tools.

## Core Features

### Visual Workflow Editor
- Drag-and-drop node-based interface powered by XYFlow
- Real-time workflow visualization
- Connection validation and error handling
- Auto-save functionality
- Workflow execution tracking

### Authentication & User Management
- Secure authentication using Better Auth
- Email/password authentication
- Session management with automatic expiration
- User account management
- Protected routes and API endpoints

### Workflow Execution Engine
- Powered by Inngest for reliable background job processing
- Real-time execution status updates
- Error handling and retry mechanisms
- Execution history and logging
- Event-driven architecture
- **Conditional Branching**: Support for If/Else logic and dynamic execution paths
- **Scheduled Execution**: Native support for cron-based workflow scheduling


### Credential Management
- Secure credential storage with encryption using Cryptr
- Support for multiple credential types:
  - OpenAI API keys
  - Anthropic API keys
  - Google Gemini API keys
  - GitHub tokens
- Credential reuse across workflows
- Encrypted storage in PostgreSQL database

## Supported Integrations

### Triggers
Workflow triggers that initiate automation flows:

- **Manual Trigger**: Start workflows manually from the dashboard
- **Email Trigger**: Trigger workflows from incoming emails (supports Resend, SendGrid, Mailgun, Postmark)
- **GitHub Trigger**: Respond to GitHub webhook events (issues, pull requests, comments)
- **Telegram Trigger**: Trigger workflows from Telegram messages
- **WhatsApp Trigger**: Trigger workflows from WhatsApp messages via Twilio
- **Google Form Trigger**: Process Google Form submissions
- **Stripe Trigger**: Handle Stripe payment events
- **Webhook Trigger**: Trigger workflows via standard HTTP POST requests with JSON payloads
- **Cron Trigger**: Schedule workflows to run at specific intervals using cron expressions (e.g., Every minute, Hourly, Daily)

**Note**: More trigger nodes are planned for future releases.

### Actions
Execution nodes that perform specific tasks:

- **AI Models**:
  - OpenAI
  - Anthropic Claude
  - Google Gemini
  
- **Messaging Platforms**:
  - Discord: Send messages to Discord channels
  - Slack: Post messages to Slack channels
  - Telegram: Send Telegram messages
  - WhatsApp: Send WhatsApp messages via Twilio
  - Email: Send emails via Resend or SMTP
  
- **Developer Tools**:
  - GitHub: Create issues, post comments, manage repositories
  - HTTP Request: Make custom API calls

### Logic Nodes
Control flow nodes that manage execution paths:

- **If/Else Condition**: Branch workflows based on dynamic conditions (supports operators like `equals`, `contains`, `greater_than`, etc.)

**Note**: Additional execution nodes and integrations are planned for future releases.

## Technology Stack

### Frontend
- **Next.js 16**: React framework with App Router and Turbopack
- **React 19**: Latest React features
- **TypeScript**: Type-safe development
- **Tailwind CSS v4**: Utility-first styling with CSS-first configuration
- **Radix UI**: Accessible component primitives
- **XYFlow**: Visual workflow editor
- **Lucide React**: Icon library
- **React Hook Form**: Form management with Zod validation
- **TanStack Query**: Data fetching and caching
- **Jotai**: State management
- **Sonner**: Toast notifications

### Backend
- **tRPC**: End-to-end typesafe APIs
- **Prisma v7**: Database ORM with enhanced type safety
- **PostgreSQL**: Primary database
- **Better Auth**: Authentication solution
- **Inngest**: Background job processing and workflow orchestration
- **Cryptr**: Encryption for sensitive credentials
- **Handlebars**: Template engine for dynamic data processing

### AI & APIs
- **Vercel AI SDK**: Unified AI model interface

### Development Tools
- **mprocs**: Multi-process runner for development
- **ngrok**: Local development tunneling for webhooks
- **inngest-cli**: Inngest development server

## Database Schema

### User Management
- **User**: User accounts with email verification
- **Session**: Active user sessions with expiration
- **Account**: OAuth and credential provider accounts
- **Verification**: Email verification tokens

### Workflow System
- **Workflow**: Container for automation workflows
- **Node**: Individual workflow nodes (triggers, actions, and logic)
- **Connection**: Links between nodes defining execution flow
- **Execution**: Workflow execution records with status tracking

### Credentials
- **Credential**: Encrypted API keys and authentication tokens

## Project Structure

```
nodeweave/
├── prisma/
│   └── schema.prisma          # Database schema definition
├── public/
│   └── logos/                 # Application logos and assets
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── features/
│   │   │   ├── auth/          # Authentication components
│   │   │   ├── credentials/   # Credential management
│   │   │   ├── editor/        # Workflow editor
│   │   │   ├── executions/    # Execution nodes and components
│   │   │   ├── triggers/      # Trigger nodes and components
│   │   │   ├── workflows/     # Workflow management
│   │   │   └── subscriptions/ # Subscription management
│   │   ├── api/               # API routes
│   │   └── (auth)/            # Auth route group
│   ├── components/            # Shared React components
│   │   ├── ui/                # UI component library
│   │   └── app-sidebar.tsx    # Main navigation sidebar
│   ├── config/                # Configuration files
│   ├── generated/             # Generated Prisma client
│   ├── hooks/                 # Custom React hooks
│   ├── inngest/               # Inngest functions and workflows
│   │   ├── channels/          # Channel-specific execution logic
│   │   ├── client.ts          # Inngest client configuration
│   │   └── functions.ts       # Workflow execution functions
│   ├── lib/                   # Utility libraries
│   │   ├── auth.ts            # Better Auth configuration
│   │   ├── db.ts              # Prisma client instance
│   │   ├── encryption.ts      # Credential encryption utilities
│   │   └── utils.ts           # General utilities
│   └── trpc/                  # tRPC setup
│       ├── routers/           # API route definitions
│       └── server.ts          # tRPC server configuration
├── .env                       # Environment variables
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
└── next.config.ts             # Next.js configuration
```

## Getting Started

### Prerequisites
- Node.js 18 or higher
- PostgreSQL database
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Bharat940/nodeweave.git
cd nodeweave
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/nodeweave"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"

# Inngest
INNGEST_EVENT_KEY="your-inngest-event-key"
INNGEST_SIGNING_KEY="your-inngest-signing-key"

# Encryption
ENCRYPTION_SECRET="your-encryption-secret"

# Optional: AI Provider API Keys
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key"
GOOGLE_API_KEY="your-google-key"

# Optional: Messaging Platform Credentials
DISCORD_BOT_TOKEN="your-discord-token"
SLACK_BOT_TOKEN="your-slack-token"
TELEGRAM_BOT_TOKEN="your-telegram-token"
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"

# Optional: GitHub Integration
GITHUB_TOKEN="your-github-token"
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Development Workflow

For full development with all services running:

```bash
npm run dev:all
```

This uses `mprocs` to run:
- Next.js development server
- Inngest development server
- ngrok tunnel (for webhook testing)

Individual commands:
```bash
npm run dev          # Next.js dev server with Turbopack
npm run inngest:dev  # Inngest dev server
npm run ngrok:dev    # ngrok tunnel
```

## Building Workflows

### Creating a Workflow

1. Navigate to the Workflows page
2. Click "Create Workflow"
3. Add a trigger node (starting point)
4. Add action nodes
5. Connect nodes to define execution flow
6. Configure each node with required credentials and parameters
7. Save the workflow

### Node Configuration

Each node type requires specific configuration:

- **Trigger Nodes**: Define when the workflow should start
- **AI Nodes**: Require API credentials and prompt configuration
- **Messaging Nodes**: Require channel/chat IDs and message content
- **HTTP Request**: Requires URL, method, headers, and body

### Execution Flow

1. Trigger event occurs
2. Inngest receives the event
3. Workflow execution begins
4. Nodes execute in topological order
5. Results are passed between connected nodes
6. Execution status is tracked in real-time
7. Final results are stored in the database

## API Routes

### tRPC Endpoints

All API endpoints are type-safe and accessible via tRPC:

- `/api/trpc/workflows.*`: Workflow CRUD operations
- `/api/trpc/credentials.*`: Credential management
- `/api/trpc/executions.*`: Execution history and status
- `/api/trpc/auth.*`: Authentication operations

### Webhook Endpoints

- `/api/webhooks/email`: Email webhook receiver (supports multiple providers)
- `/api/webhooks/github`: GitHub webhook receiver
- `/api/webhooks/telegram`: Telegram webhook receiver
- `/api/webhooks/whatsapp`: WhatsApp webhook receiver
- `/api/webhooks/stripe`: Stripe webhook receiver
- `/api/webhooks/generic`: Generic webhook receiver for HTTP POST triggers

### Inngest Endpoints

- `/api/inngest`: Inngest event handler and function executor

## Security

### Credential Encryption
All API keys and sensitive credentials are encrypted using Cryptr before storage in the database. Encryption keys are stored securely in environment variables.

### Authentication
- Session-based authentication with secure HTTP-only cookies
- CSRF protection
- Password hashing using Better Auth
- Email verification for new accounts

### API Security
- tRPC procedures protected with authentication middleware
- Input validation using Zod schemas
- Rate limiting on sensitive endpoints
- Webhook signature verification

## Deployment

### Build for Production

```bash
npm run build
```

### Environment Variables

Ensure all required environment variables are set in your production environment:
- Database connection string
- Authentication secrets
- API keys for integrations
- Webhook URLs

### Database Migrations

```bash
npx prisma migrate deploy
```

### Recommended Platforms

- **Vercel**: Optimized for Next.js deployment
- **Railway**: PostgreSQL and application hosting
- **Supabase**: PostgreSQL database hosting
- **Neon**: Serverless PostgreSQL

## Scripts

- `npm run dev`: Start development server with Turbopack
- `npm run build`: Build production bundle
- `npm start`: Start production server
- `npm run lint`: Run ESLint
- `npm run dev:all`: Run all development services
- `npm run inngest:dev`: Start Inngest development server
- `npm run ngrok:dev`: Start ngrok tunnel

## Roadmap

### Planned Features
- Additional trigger nodes for more platforms and services
- More execution nodes and integrations
- Enhanced workflow editor features
- Workflow templates and marketplace
- Team collaboration features
- Production deployment and hosting

### In Development
- Expanding integration ecosystem
- Performance optimizations
- Enhanced error handling and debugging tools

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Bharat940/nodeweave/issues) if you want to contribute.

To contribute:
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Support

For support, please contact Bharat Dangi at [bdangi450@gmail.com](mailto:bdangi450@gmail.com)
