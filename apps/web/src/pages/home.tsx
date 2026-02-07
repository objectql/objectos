import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <h1 className="text-5xl font-bold mb-6 text-gray-900 dark:text-white">
          Welcome to ObjectOS
        </h1>
        <p className="text-xl mb-8 text-gray-600 dark:text-gray-300">
          A Business Operating System for the ObjectStack Ecosystem
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            to="/sign-in"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/sign-up"
            className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors dark:bg-gray-800 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-gray-700"
          >
            Sign Up
          </Link>
        </div>

        <div className="mt-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            Features
          </h2>
          <ul className="text-left space-y-2 text-gray-700 dark:text-gray-300">
            <li>✅ Email &amp; Password Authentication</li>
            <li>✅ Organization Management</li>
            <li>✅ Role-Based Access Control (RBAC)</li>
            <li>✅ Team Collaboration</li>
            <li>✅ Secure Session Management</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
