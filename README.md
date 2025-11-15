# InviteFlow: Wedding Invitation Management Suite

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/taufiqrchmt/dashboard-undangan-v1.0.1)

InviteFlow is a sophisticated, minimalist web application designed to streamline the process of managing and sending wedding invitations. It provides a dual-role system for administrators and users. Administrators can manage user accounts, define global invitation templates, and configure event-specific details for each user, such as custom invitation URLs. Regular users can manage their guest lists by organizing them into groups, create personalized invitation templates, and utilize the powerful 'Send Invitation' module. This core feature allows users to select a guest group and a template to automatically generate personalized WhatsApp messages, plain text invitations, and unique invitation links for each guest. The application focuses on an elegant, intuitive user experience with a clean, modern interface, ensuring that managing hundreds of invitations is a seamless and delightful process.

## Key Features

-   **Dual-Role Architecture**: Separate interfaces and permissions for Admins and regular Users.
-   **Guest Management**: Easily create, edit, delete, and organize guests into custom groups (e.g., VIP, Family, Friends).
-   **Template Engine**: Admins can create global templates, while users can create their own personalized message templates with dynamic placeholders like `[nama-tamu]` and `[link-undangan]`.
-   **Invitation Sending Hub**: A centralized page to generate personalized messages, WhatsApp links, and unique invitation URLs for entire guest groups at once.
-   **Admin Control Panel**: Admins can manage all user accounts, configure event-specific settings (like invitation slugs and URLs) for each user, and manage global templates.
-   **Modern & Responsive UI**: A clean, minimalist, and fully responsive design built with Tailwind CSS and shadcn/ui for a seamless experience on any device.
-   **State Management**: Efficient and predictable client-side state management using Zustand.

## Technology Stack

-   **Frontend**: React, Vite, React Router, TypeScript
-   **Backend**: Hono on Cloudflare Workers
-   **Database**: Cloudflare Durable Objects for stateful serverless storage
-   **UI/Styling**: Tailwind CSS, shadcn/ui, Lucide React, Framer Motion
-   **State Management**: Zustand
-   **Forms**: React Hook Form with Zod for validation

## Getting Started

Follow these instructions to get the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   [Node.js](httpss://nodejs.org/) (v18 or later)
-   [Bun](httpss://bun.sh/) as the package manager and runtime
-   [Wrangler CLI](httpss://developers.cloudflare.com/workers/wrangler/install-and-update/) for interacting with the Cloudflare platform.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd inviteflow
    ```

2.  **Install dependencies:**
    This project uses Bun for package management.
    ```bash
    bun install
    ```

3.  **Configure Environment Variables:**
    The application connects to Supabase for authentication and database services. Create a `.dev.vars` file in the root of the project for local development. You can create secrets for production using the Wrangler CLI.

    **`.dev.vars`:**
    ```ini
    NEXT_PUBLIC_SUPABASE_URL="https://mdsfycarovvwrffqqyru.supabase.co"
    NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kc2Z5Y2Fyb3Z2d3JmZnFxeXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxODUyMjIsImV4cCI6MjA3ODc2MTIyMn0.cETBrsWWntd4nkuC5eYbkShl_LMX8FnzGqEMOzGdRyE"
    SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
    ```

    For production, set these secrets using Wrangler:
    ```bash
    wrangler secret put NEXT_PUBLIC_SUPABASE_URL
    wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
    wrangler secret put SUPABASE_SERVICE_ROLE_KEY
    ```

4.  **Run the development server:**
    This command starts the Vite frontend and the Hono backend on Cloudflare Workers simultaneously.
    ```bash
    bun run dev
    ```
    The application will be available at `http://localhost:3000`.

## Project Structure

The project is organized into three main directories:

-   `src/`: Contains the entire React frontend application, including pages, components, hooks, and utility functions.
-   `worker/`: Contains the Hono backend application that runs on Cloudflare Workers. This is where API routes and business logic are defined.
-   `shared/`: Contains TypeScript types and interfaces that are shared between the frontend and the backend to ensure type safety.

## Development

-   **Frontend**: All frontend code resides in the `src` directory. Pages are located in `src/pages`, and reusable components are in `src/components`.
-   **Backend**: API endpoints are defined in `worker/user-routes.ts`. The backend logic leverages entities defined in `worker/entities.ts` which interact with Cloudflare's Durable Objects for data persistence.
-   **Styling**: The project uses Tailwind CSS for styling. Customizations and shadcn/ui theme variables are located in `tailwind.config.js` and `src/index.css`.

## Deployment

This application is designed to be deployed to the Cloudflare network.

1.  **Build the application:**
    ```bash
    bun run build
    ```

2.  **Deploy to Cloudflare Workers:**
    Make sure you are logged into your Cloudflare account via the Wrangler CLI (`wrangler login`). Then, run the deploy command:
    ```bash
    bun run deploy
    ```
    This command will build the application and deploy it to your Cloudflare account, making it available at the URL provided in the output.

Alternatively, you can deploy directly from your GitHub repository using the button below.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/taufiqrchmt/dashboard-undangan-v1.0.1)