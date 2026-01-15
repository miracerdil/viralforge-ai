'use client';

import { useCallback } from 'react';

interface ExtractedFrame {
  blob: Blob;
  timestamp: number;
}

export function useFrameExtractor() {
  const extractFrames = useCallback(async (file: File): Promise<ExtractedFrame[]> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      const frames: ExtractedFrame[] = [];
      const targetTimestamps = [0, 2]; // First frame and 2 seconds in

      video.onloadedmetadata = async () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const captureFrame = async (timestamp: number): Promise<ExtractedFrame> => {
          return new Promise((resolveFrame) => {
            video.currentTime = Math.min(timestamp, video.duration - 0.1);
            video.onseeked = () => {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    resolveFrame({ blob, timestamp });
                  }
                },
                'image/png',
                0.9
              );
            };
          });
        };

        try {
          for (const timestamp of targetTimestamps) {
            if (timestamp <= video.duration) {
              const frame = await captureFrame(timestamp);
              frames.push(frame);
            }
          }
          resolve(frames);
        } catch (err) {
          reject(err);
        } finally {
          URL.revokeObjectURL(video.src);
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video'));
      };

      video.src = URL.createObjectURL(file);
    });
  }, []);

  const getVideoDuration = useCallback(async (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        resolve(Math.round(video.duration));
        URL.revokeObjectURL(video.src);
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video'));
      };

      video.src = URL.createObjectURL(file);
    });
  }, []);

  return { extractFrames, getVideoDuration };
}
