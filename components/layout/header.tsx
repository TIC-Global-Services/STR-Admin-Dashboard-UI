'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function Header() {
  const router = useRouter();


  return (
    <header className="bg-white shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 font-velcan">
            Control Panel 
          </h1>
        </div>
        
        <div className=" font-halfre">
          Developed by <Link href={'https://www.theinternetcompany.one/'} className=' text-green-600'> The Internet Company</Link> 
        </div>
      </div>
    </header>
  );
}
