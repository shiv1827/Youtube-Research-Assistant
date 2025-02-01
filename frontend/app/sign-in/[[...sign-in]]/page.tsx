import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="p-8 bg-gray-800 rounded-lg shadow-xl">
        <SignIn appearance={{
          elements: {
            formButtonPrimary: 'bg-blue-500 hover:bg-blue-600',
            card: 'bg-gray-800',
            headerTitle: 'text-white',
            headerSubtitle: 'text-gray-300',
            socialButtonsBlockButton: 'bg-gray-700 hover:bg-gray-600 border-gray-600',
            socialButtonsBlockButtonText: 'text-white',
            dividerLine: 'bg-gray-600',
            dividerText: 'text-gray-400',
            formFieldLabel: 'text-gray-300',
            formFieldInput: 'bg-gray-700 border-gray-600 text-white',
            footerActionLink: 'text-blue-400 hover:text-blue-500',
          },
        }} />
      </div>
    </div>
  );
} 