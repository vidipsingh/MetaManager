import * as React from "react";

interface AlertDialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({ open, onClose, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-md shadow-lg w-full max-w-md">
        {children}
      </div>
      <button
        className="absolute inset-0 w-full h-full"
        onClick={onClose}
      />
    </div>
  );
};

export const AlertDialogHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-4 py-2 border-b">
    <h3 className="text-lg font-semibold">{children}</h3>
  </div>
);

export const AlertDialogTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-xl font-bold">{children}</h2>
);

export const AlertDialogDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-sm text-gray-600">{children}</p>
);

export const AlertDialogContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-4 py-3">{children}</div>
);

export const AlertDialogFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-4 py-3 border-t flex justify-end space-x-2">
    {children}
  </div>
);

export const AlertDialogAction: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({
  onClick,
  children,
}) => (
  <button
    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
    onClick={onClick}
  >
    {children}
  </button>
);

export const AlertDialogCancel: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({
  onClick,
  children,
}) => (
  <button
    className="bg-gray-200 text-black px-4 py-2 rounded-md hover:bg-gray-300"
    onClick={onClick}
  >
    {children}
  </button>
);
