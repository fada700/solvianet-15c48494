import { useState, useEffect } from "react";

interface ServerStatus {
  online: boolean;
  players: { online: number; max: number } | null;
  version: string | null;
  motd: string | null;
  loading: boolean;
}

export function useServerStatus() {
  const [status, setStatus] = useState<ServerStatus>({
    online: false,
    players: null,
    version: null,
    motd: null,
    loading: true,
  });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("https://api.mcsrvstat.us/2/play.solvianmc.net:25565");
        const data = await res.json();
        const playersOnline = data.players?.online ?? 0;
        const playersMax = data.players?.max ?? 0;
        const isOnline = (data.online ?? false) && playersOnline > 0;
        setStatus({
          online: isOnline,
          players: isOnline ? { online: playersOnline, max: playersMax } : null,
          version: data.version ?? null,
          motd: data.motd?.clean?.[0] ?? null,
          loading: false,
        });
      } catch {
        setStatus({ online: false, players: null, version: null, motd: null, loading: false });
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  return status;
}
