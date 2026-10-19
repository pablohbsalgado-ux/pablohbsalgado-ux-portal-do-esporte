"use client";

import { useAccount } from "./AccountProvider";

export function LogoutButton() {
  const { logout } = useAccount();
  return (
    <button
      className="btn-ghost mt-5 w-full"
      onClick={async () => {
        await logout();
        window.location.assign("/");
      }}
    >
      Sair da conta
    </button>
  );
}
