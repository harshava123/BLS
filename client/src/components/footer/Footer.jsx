export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-gray-50 to-blue-50 text-center py-2 border-t border-gray-200 shadow-sm">
      <p className="text-xs text-gray-500 font-medium">
        © {new Date().getFullYear()} Balaji Lorry Service. All rights reserved.
      </p>
    </footer>
  );
}
