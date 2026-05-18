/**
 * Hook subscribe WebSocket rank update realtime.
 *
 * Khi user hoàn thành bài → backend push message /topic/rank/{userId}
 * Hook này nhận message và update state
 *
 * Usage:
 * const { currentRank, isAnimating } = useRankUpdate(userId, initialRank);
 */

import { useEffect, useState } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

interface RankUpdateMessage {
    userId: number;
    oldRank: number;
    newRank: number;
    totalKn: number;
    updatedAt: string;
}

export function useRankUpdate(userId: number | undefined, initialRank: number | null) {
    const [currentRank, setCurrentRank] = useState<number | null>(initialRank);
    const [isConnected, setIsConnected] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (!userId) return;

        const socket = new SockJS('/ws');
        const stompClient = Stomp.over(socket);

        stompClient.connect({}, () => {
            console.log('[RankUpdate] Connected');
            setIsConnected(true);

            stompClient.subscribe(`/topic/rank/${userId}`, (message: { body: string }) => {
                try {
                    const data: RankUpdateMessage = JSON.parse(message.body);
                    console.log('[RankUpdate] Received:', data);

                    setIsAnimating(true);
                    setCurrentRank(data.newRank);

                    setTimeout(() => setIsAnimating(false), 1000);
                } catch (error) {
                    console.error('[RankUpdate] Error:', error);
                }
            });
        });

        return () => {
            if (stompClient.connected) {
                stompClient.disconnect(() => {
                    console.log('[RankUpdate] Disconnected');
                    setIsConnected(false);
                });
            }
        };
    }, [userId]);

    return { currentRank, isConnected, isAnimating };
}
