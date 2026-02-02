import Link from "next/link";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  alternativeLink?: {
    text: string;
    linkText: string;
    href: string;
  };
}

export function AuthLayout({ children, title, subtitle, alternativeLink }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-900">
      {/* Left side - content */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:w-1/2 xl:w-[500px] border-r border-gray-100 dark:border-gray-800">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-8">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">ObjectOS</span>
            </div>
            
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>

          <div className="mt-8">
            {children}
          </div>

          {alternativeLink && (
            <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
              {alternativeLink.text}{" "}
              <Link href={alternativeLink.href} className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                {alternativeLink.linkText}
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Right side - hero */}
      <div className="hidden lg:block relative flex-1 bg-gray-50 dark:bg-gray-800">
        <div className="absolute inset-0 flex items-center justify-center p-20">
          <div className="space-y-8 max-w-lg text-center">
             <div className="rounded-2xl bg-white dark:bg-gray-700 shadow-2xl overflow-hidden p-2 border border-gray-200 dark:border-gray-600 rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="aspect-[4/3] bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-opacity-50 text-6xl">
                    <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
                    </svg>
                </div>
             </div>
             <div>
                 <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                     The Business Operating System
                 </h3>
                 <p className="text-gray-500 dark:text-gray-400">
                     Manage your organization's data, workflows, and identity in one unified platform.
                 </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
