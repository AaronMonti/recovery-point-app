# Patient CRUD App

This is a Next.js application for managing patients and their physical therapy sessions. It uses Turso as the database and Drizzle ORM for database interactions. The UI is built with Shadcn UI and Tailwind CSS.

## Features

- Create, Read, Update, and Delete patients.
- View a list of all patients.
- View a detailed page for each patient with their session history.
- Register daily sessions for each patient, including a sentiment about the session.
- Responsive design for mobile and desktop.

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework for building user interfaces.
- [Turso](https://turso.tech/) - Edge-hosted database based on libSQL.
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM for SQL databases.
- [Shadcn UI](https://ui.shadcn.com/) - Re-usable components built using Radix UI and Tailwind CSS.
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework.
- [React Hot Toast](https://react-hot-toast.com/) - Toast notifications for React.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Turso account and CLI

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/patient-crud-app.git
   cd patient-crud-app
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up the database:**

   - Create a new database on [Turso](https://turso.tech/).
   - Get the database URL and an authentication token.

4. **Set up environment variables:**

   - Create a `.env` file in the root of the project.
   - Add the following variables with your Turso database credentials:

     ```
     TURSO_DATABASE_URL="your-turso-database-url"
     TURSO_AUTH_TOKEN="your-turso-auth-token"
     ```

5. **Apply database migrations:**

   ```bash
   npm run db:push
   ```

### Running the Application

To start the development server, run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Available Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Lints the code.
- `npm run db:generate`: Generates database migrations based on the schema.
- `npm run db:push`: Pushes the migrations to the database.
