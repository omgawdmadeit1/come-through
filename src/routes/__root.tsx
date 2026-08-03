import type { ReactNode } from "react";
import { useEffect } from "react";
import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { CreatedWithGrokBanner } from "@/components/created-with-grok-banner";
import { prepareNativeChrome } from "@/lib/native/capacitor";
import appCss from "@/styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, user-scalable=no",
      },
      {
        title: "Come Through — cut in with corrected speech",
      },
      {
        name: "description",
        content:
          "Come Through lets you hold to talk, correct your words, and send a priority message that plays on another iPhone — no phone call required.",
      },
      { name: "theme-color", content: "#0a0a0b" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Come Through" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "application-name", content: "Come Through" },
      { property: "og:title", content: "Come Through" },
      {
        property: "og:description",
        content: "Cut in with corrected speech. Priority messages for family — no call to answer.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  useEffect(() => {
    void prepareNativeChrome();
  }, []);

  return (
    <RootDocument>
      <CreatedWithGrokBanner />
      <Outlet />
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          style: {
            background: "#121214",
            border: "1px solid #2a2a30",
            color: "#f4f4f5",
          },
        }}
      />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-dvh bg-[var(--color-bg)] text-[var(--color-fg)] antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}
