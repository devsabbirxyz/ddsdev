import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="bottom-center"
      duration={3000}
      richColors
      closeButton
      className="toaster group"
      style={{ zIndex: 999999 } as React.CSSProperties}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error:
            "!bg-red-600 !text-white !border-red-700 !font-semibold animate-slide-in-bottom",
          success:
            "!bg-green-600 !text-white !border-green-700 !font-semibold animate-slide-in-bottom",
          warning:
            "!bg-yellow-500 !text-black !border-yellow-600 !font-semibold animate-slide-in-bottom",
          info:
            "!bg-blue-600 !text-white !border-blue-700 !font-semibold animate-slide-in-bottom",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
